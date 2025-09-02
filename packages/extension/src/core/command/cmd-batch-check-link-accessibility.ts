import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { existsAsync, getFileContentAsync, getMarkdownFilterContent, readdirAsync } from 'shared';
import { BroadcastT, MessageT, OPERATION_TYPE, ServerMessenger, SOURCE_TYPE } from 'webview-bridge';
import { execCheckLinkValidity, execCheckResourceExistence } from 'checkers';

import defaultWhitelistUrls from '@/config/whitelist-urls';
import { createWebviewPanel } from '@/utils/webview';

const ID = 'batch-check-link-accessibility-result';
let controller: AbortController | null = null;

async function walkDir(
  dir: string,
  opts: {
    whiteList: string[];
    signal: AbortSignal;
    disableCheckExternalUrl?: boolean;
    disableCheckInternalUrl?: boolean;
    disableCheckAnchor?: boolean;
    disableCheck404?: boolean;
    disableCheckOtherStatus?: boolean;
  }
) {
  const names = await readdirAsync(dir);
  for (const name of names) {
    if (opts.signal.aborted) {
      return;
    }

    const completePath = path.join(dir, name).replace(/\\/g, '/');
    ServerMessenger.broadcast(ID, 'onAsyncTaskOutput', 'batchCheckLinkAccessibility:scanTarget', completePath);

    if (fs.statSync(completePath).isDirectory()) {
      await walkDir(completePath, opts);
    } else if (name.endsWith('.md')) {
      const content = getMarkdownFilterContent(await getFileContentAsync(completePath), {
        disableHtmlComment: true,
        disableCode: true,
      });

      const results = await Promise.all([
        execCheckLinkValidity(content, {
          whiteList: opts.whiteList,
          signal: opts.signal,
          prefixPath: dir,
          disableCheckExternalUrl: opts.disableCheckExternalUrl,
          disableCheckInternalUrl: opts.disableCheckInternalUrl,
          disableCheckAnchor: opts.disableCheckAnchor,
        }),
        execCheckResourceExistence(content, {
          whiteList: opts.whiteList,
          signal: opts.signal,
          prefixPath: dir,
          disableCheckExternalUrl: opts.disableCheckExternalUrl,
          disableCheckInternalUrl: opts.disableCheckInternalUrl,
        }),
      ]);

      if (opts.signal.aborted) {
        return;
      }

      results.forEach((r) => {
        r.forEach((item) => {
          if ((!opts.disableCheck404 && item.extras === 404) || !opts.disableCheckOtherStatus) {
            ServerMessenger.broadcast(ID, 'onAsyncTaskOutput', 'batchCheckLinkAccessibility:addItem', {
              url: item.content,
              status: item.extras,
              start: item.start,
              end: item.end,
              file: completePath,
              msg: item.message.zh,
            });
          }
        });
      });
    }
  }
}

async function startWalk(
  targetPath: string,
  opts: {
    disableCheckExternalUrl?: boolean;
    disableCheckInternalUrl?: boolean;
    disableCheckAnchor?: boolean;
    disableCheck404?: boolean;
    disableCheckOtherStatus?: boolean;
  }
) {
  try {
    controller?.abort();
    controller = new AbortController();
    const whiteListConfig = vscode.workspace.getConfiguration('docTools.check.url').get<string[]>('whiteList', []);
    const whiteList = Array.isArray(whiteListConfig) ? [...whiteListConfig, ...defaultWhitelistUrls] : defaultWhitelistUrls;
    await walkDir(targetPath, {
      ...opts,
      whiteList,
      signal: controller.signal,
    });

    if (controller && !controller.signal.aborted) {
      ServerMessenger.broadcast(ID, 'onAsyncTaskOutput', 'batchCheckLinkAccessibility:stop');
    }
  } catch {
    stopWalk();
  }
}

function stopWalk() {
  if (controller && !controller.signal.aborted) {
    controller.abort();
  }
  controller = null;
  ServerMessenger.broadcast(ID, 'onAsyncTaskOutput', 'batchCheckLinkAccessibility:stop');
}

/**
 * 创建批量检查链接可访问性 webview
 * @param {vscode.ExtensionContext} context 上下文
 * @param {vscode.Uri} uri 目标目录 uri
 */
export async function createBatchCheckLinkAccessibilityWebview(context: vscode.ExtensionContext, uri: vscode.Uri) {
  if (!(await existsAsync(uri.fsPath))) {
    vscode.window.showErrorMessage(`路径不存在：${uri.fsPath}`);
    return;
  }

  const fsPath = fs.realpathSync.native(uri.fsPath).replace(/\\/g, '/');
  if (!fs.statSync(fsPath).isDirectory()) {
    vscode.window.showErrorMessage(`非目录路径：${fsPath}`);
    return;
  }

  const isDarkTheme = vscode.workspace.getConfiguration().get<string>('workbench.colorTheme', '').toLowerCase().includes('dark');

  const webviewPanel = createWebviewPanel({
    context,
    viewType: 'Doc Tools：检查结果',
    title: 'Doc Tools：检查结果',
    showOptions: vscode.ViewColumn.Two,
    iconPath: vscode.Uri.file(path.join(context.extensionPath, 'resources', isDarkTheme ? 'icon-preview-dark.svg' : 'icon-preview-light.svg')),
    injectData: {
      path: '/batch-check-link-accessibility-result',
      theme: isDarkTheme ? 'dark' : 'light',
      locale: fsPath.includes('/en/') ? 'en' : 'zh',
      extras: {
        fsPath,
      },
    },
    onBeforeLoad(webviewPanel, isDev) {
      ServerMessenger.bind(ID, webviewPanel, isDev);
    },
  });

  webviewPanel.onDidDispose(() => {
    controller?.abort();
    controller = null;
  });

  webviewPanel.webview.onDidReceiveMessage((message: MessageT<BroadcastT<string>>) => {
    if (message.source !== SOURCE_TYPE.client || message.operation !== OPERATION_TYPE.broadcast) {
      return;
    }

    const { name, extras } = message.data;
    if (
      name === 'asyncTask:batchCheckLinkAccessibility' &&
      typeof extras?.[0] === 'string' &&
      Array.isArray(extras?.[1]) &&
      Array.isArray(extras?.[2])
    ) {
      startWalk(extras[0], {
        disableCheckExternalUrl: !extras[1].includes('http'),
        disableCheckInternalUrl: !extras[1].includes('relative-link'),
        disableCheckAnchor: !extras[1].includes('anchor'),
        disableCheck404: !extras[2].includes('404'),
        disableCheckOtherStatus: !extras[2].includes('others'),
      });
    } else if (name === 'asyncTask:stopBatchCheckLinkAccessibility') {
      stopWalk();
    }
  });
}
