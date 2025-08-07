import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { getFileContentAsync, getMarkdownFilterContent, readdirAsync } from 'shared';
import { BroadcastT, MessageT, OPERATION_TYPE, ServerMessageHandler, SOURCE_TYPE } from 'webview-bridge';
import { execLinkValidityCheck, execResourceExistenceCheck, execTocCheck } from 'checkers';

import defaultWhitelistUrls from '@/config/whitelist-urls';
import { isConfigEnabled } from '@/utils/common';
import { createWebviewPanel } from '@/utils/webview';

let controller: AbortController | null = null;

async function walkDir(dir: string, whiteList: string[], signal: AbortSignal) {
  const names = await readdirAsync(dir);
  for (const name of names) {
    if (signal.aborted) {
      throw new Error('aborted');
    }

    const completePath = path.join(dir, name).replace(/\\/g, '/');
    ServerMessageHandler.broadcast('onAsyncTaskOutput', 'checkLinkAccessibility:scanTarget', completePath);

    if (fs.statSync(completePath).isDirectory()) {
      await walkDir(completePath, whiteList, signal);
    } else if (name.endsWith('.md')) {
      const content = getMarkdownFilterContent(await getFileContentAsync(completePath), {
        disableHtmlComment: true,
        disableCode: true,
      });

      const results = await Promise.all([execLinkValidityCheck(content, dir, whiteList, signal), execResourceExistenceCheck(content, dir, whiteList, signal)]);
      if (signal.aborted) {
        throw new Error('aborted');
      }

      results.forEach((r) => {
        r.forEach((item) => {
          if (item.extras === 404) {
            ServerMessageHandler.broadcast('onAsyncTaskOutput', 'checkLinkAccessibility:addItem', {
              url: item.content,
              status: item.extras,
              start: item.start,
              end: item.end,
              file: completePath,
            });
          }
        });
      });
    } else if (name === '_toc.yaml') {
      const content = await getFileContentAsync(completePath);
      const results = await execTocCheck(content, dir);
      if (signal.aborted) {
        throw new Error('aborted');
      }

      results.forEach((item) => {
        if (item.content.includes('href')) {
          ServerMessageHandler.broadcast('onAsyncTaskOutput', 'checkLinkAccessibility:addItem', {
            url: item.content.split(':')[1].trim(),
            status: 404,
            start: item.start,
            end: item.end,
            file: completePath,
          });
        }
      });
    }
  }
}

async function startWalk(targetPath: string) {
  try {
    controller?.abort();
    controller = new AbortController();
    controller.signal.addEventListener('abort', () => {
      throw new Error('abort');
    });

    const whiteListConfig = vscode.workspace.getConfiguration('docTools.check.url').get<string[]>('whiteList', []);
    const whiteList = Array.isArray(whiteListConfig) ? [...whiteListConfig, ...defaultWhitelistUrls] : defaultWhitelistUrls;
    await walkDir(targetPath, whiteList, controller.signal);
    if (controller && !controller.signal.aborted) {
      ServerMessageHandler.broadcast('onAsyncTaskOutput', 'checkLinkAccessibility:stop');
    }
  } catch (err) {
    // nothing
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
  const dirPath = uri.fsPath.replace(/\\/g, '/');

  if (!fs.existsSync(dirPath)) {
    vscode.window.showErrorMessage(`路径不存在：${dirPath}`);
    return;
  }

  if (!fs.statSync(dirPath).isDirectory()) {
    vscode.window.showErrorMessage(`非目录路径：${dirPath}`);
    return;
  }

  if (isConfigEnabled('docTools.scope') && !dirPath.includes('docs/zh/') && !dirPath.includes('docs/en/')) {
    vscode.window.showErrorMessage(`非文档下的 zh 或 en 目录：${dirPath}`);
    return;
  }

  const fsPath = uri.fsPath.replace(/\\/g, '/');
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
    if (name === 'asyncTask:checkLinkAccessibility' && typeof extras?.[0] === 'string') {
      startWalk(extras[0]);
    } else if (name === 'asyncTask:stopCheckLinkAccessibility') {
      stopWalk();
    }
  });
}
