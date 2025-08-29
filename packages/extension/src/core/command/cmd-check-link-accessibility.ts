import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { existsAsync, getFileContentAsync, getMarkdownFilterContent, readdirAsync } from 'shared';
import { BroadcastT, MessageT, OPERATION_TYPE, ServerMessageHandler, SOURCE_TYPE } from 'webview-bridge';
import { execLinkValidityCheck, execResourceExistenceCheck, execTocCheck } from 'checkers';

import defaultWhitelistUrls from '@/config/whitelist-urls';
import { createWebviewPanel } from '@/utils/webview';

let controller: AbortController | null = null;

async function walkDir(
  dir: string,
  opts: {
    whiteList: string[];
    signal: AbortSignal;
    disableScanMarkdown?: boolean;
    disableScanToc?: boolean;
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
      throw new Error('aborted');
    }

    const completePath = path.join(dir, name).replace(/\\/g, '/');
    ServerMessageHandler.broadcast('onAsyncTaskOutput', 'checkLinkAccessibility:scanTarget', completePath);

    if (fs.statSync(completePath).isDirectory()) {
      await walkDir(completePath, opts);
    } else if (!opts.disableScanMarkdown && name.endsWith('.md')) {
      const content = getMarkdownFilterContent(await getFileContentAsync(completePath), {
        disableHtmlComment: true,
        disableCode: true,
      });

      const results = await Promise.all([
        execLinkValidityCheck(content, {
          whiteList: opts.whiteList,
          signal: opts.signal,
          prefixPath: dir,
          disableCheckExternalUrl: opts.disableCheckExternalUrl,
          disableCheckInternalUrl: opts.disableCheckInternalUrl,
          disableCheckAnchor: opts.disableCheckAnchor,
        }),
        execResourceExistenceCheck(content, {
          whiteList: opts.whiteList,
          signal: opts.signal,
          prefixPath: dir,
          disableCheckExternalUrl: opts.disableCheckExternalUrl,
          disableCheckInternalUrl: opts.disableCheckInternalUrl,
        }),
      ]);

      if (opts.signal.aborted) {
        throw new Error('aborted');
      }

      results.forEach((r) => {
        r.forEach((item) => {
          if ((!opts.disableCheck404 && item.extras === 404) || !opts.disableCheckOtherStatus) {
            ServerMessageHandler.broadcast('onAsyncTaskOutput', 'checkLinkAccessibility:addItem', {
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
    } else if (!opts.disableScanToc && name === '_toc.yaml') {
      const content = await getFileContentAsync(completePath);
      const results = await execTocCheck(content, dir, opts.signal);
      if (opts.signal.aborted) {
        throw new Error('aborted');
      }

      results.forEach((item) => {
        if (item.message.includes('文档资源不存在')) {
          ServerMessageHandler.broadcast('onAsyncTaskOutput', 'checkLinkAccessibility:addItem', {
            url: item.message.split(':')[1].trim(),
            status: 404,
            start: item.start,
            end: item.end,
            file: completePath,
            msg: '链接无法访问',
          });
        }
      });
    }
  }
}

async function startWalk(
  targetPath: string,
  opts: {
    disableScanMarkdown?: boolean;
    disableScanToc?: boolean;
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
    controller.signal.addEventListener('abort', () => {
      throw new Error('abort');
    });

    const whiteListConfig = vscode.workspace.getConfiguration('docTools.check.url').get<string[]>('whiteList', []);
    const whiteList = Array.isArray(whiteListConfig) ? [...whiteListConfig, ...defaultWhitelistUrls] : defaultWhitelistUrls;
    await walkDir(targetPath, {
      ...opts,
      whiteList,
      signal: controller.signal,
    });

    if (controller && !controller.signal.aborted) {
      ServerMessageHandler.broadcast('onAsyncTaskOutput', 'checkLinkAccessibility:stop');
    }
  } catch {
    stopWalk();
  }
}

function stopWalk() {
  controller?.abort();
  ServerMessageHandler.broadcast('onAsyncTaskOutput', 'checkLinkAccessibility:stop');
}

/**
 * 检查链接可访问性
 * @param {vscode.ExtensionContext} context 上下文
 * @param {vscode.Uri} uri 目标目录 uri
 */
export async function checkLinkAccessibility(context: vscode.ExtensionContext, uri: vscode.Uri) {
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
    showOptions: vscode.ViewColumn.Beside,
    iconPath: vscode.Uri.file(path.join(context.extensionPath, 'resources', isDarkTheme ? 'icon-preview-dark.svg' : 'icon-preview-light.svg')),
    injectData: {
      path: '/check-link-accessibility',
      theme: isDarkTheme ? 'dark' : 'light',
      locale: fsPath.includes('/en/') ? 'en' : 'zh',
      extras: {
        fsPath,
      },
    },
    onBeforeLoad(webviewPanel, isDev) {
      ServerMessageHandler.bind(webviewPanel, isDev);
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
      name === 'asyncTask:checkLinkAccessibility' &&
      typeof extras?.[0] === 'string' &&
      Array.isArray(extras?.[1]) &&
      Array.isArray(extras?.[2]) &&
      Array.isArray(extras?.[3])
    ) {
      startWalk(extras[0], {
        disableScanMarkdown: !extras[1].includes('markdown'),
        disableScanToc: !extras[1].includes('_toc.yaml'),
        disableCheckExternalUrl: !extras[2].includes('http'),
        disableCheckInternalUrl: !extras[2].includes('relative-link'),
        disableCheckAnchor: !extras[2].includes('anchor'),
        disableCheck404: !extras[3].includes('404'),
        disableCheckOtherStatus: !extras[3].includes('others'),
      });
    } else if (name === 'asyncTask:stopCheckLinkAccessibility') {
      stopWalk();
    }
  });
}
