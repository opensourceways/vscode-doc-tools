import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { existsAsync, getFileContentAsync, getMarkdownFilterContent, readdirAsync } from 'shared';
import { BroadcastT, MessageT, OPERATION_TYPE, ServerMessageHandler, SOURCE_TYPE } from 'webview-bridge';
import { execCheckTagClosed } from 'checkers';

import { createWebviewPanel } from '@/utils/webview';

let controller: AbortController | null = null;

async function walkDir(dir: string, signal: AbortSignal) {
  const names = await readdirAsync(dir);
  for (const name of names) {
    if (signal.aborted) {
      return;
    }

    const completePath = path.join(dir, name).replace(/\\/g, '/');
    ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchCheckTagClosed:scanTarget', completePath);

    if (fs.statSync(completePath).isDirectory()) {
      await walkDir(completePath, signal);
    } else if (name.endsWith('.md')) {
      const content = getMarkdownFilterContent(await getFileContentAsync(completePath), {
        disableHtmlComment: true,
        disableCode: true,
      });
      const results = await execCheckTagClosed(content);
      if (signal.aborted) {
        return;
      }

      results.forEach((item) => {
        ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchCheckTagClosed:addItem', {
          start: item.start,
          end: item.end,
          file: completePath,
          msg: item.message.zh,
        });
      });
    }
  }
}

async function startWalk(targetPath: string) {
  try {
    controller?.abort();
    controller = new AbortController();
    await walkDir(targetPath, controller.signal);
    if (controller && !controller.signal.aborted) {
      ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchCheckTagClosed:stop');
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
  ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchCheckTagClosed:stop');
}

/**
 * 创建批量检查链接可访问性 webview
 * @param {vscode.ExtensionContext} context 上下文
 * @param {vscode.Uri} uri 目标目录 uri
 */
export async function cretaeBatchCheckTagClosedWebview(context: vscode.ExtensionContext, uri: vscode.Uri) {
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
      path: '/batch-check-tag-closed-result',
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
    if (name === 'asyncTask:batchCheckTagClosed' && typeof extras?.[0] === 'string') {
      startWalk(extras[0]);
    } else if (name === 'asyncTask:stopBatchCheckTagClosed') {
      stopWalk();
    }
  });
}
