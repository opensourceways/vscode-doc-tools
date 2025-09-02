import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { execCheckFileNaming } from 'checkers';
import { BroadcastT, MessageT, OPERATION_TYPE, ServerMessageHandler, SOURCE_TYPE } from 'webview-bridge';
import { readdirAsync, sleep } from 'shared';

import { createWebviewPanel } from '@/utils/webview';

let controller: AbortController | null = null;

async function walkDir(dir: string, nameWhiteList: string[] = [], signal: AbortSignal) {
  const names = await readdirAsync(dir);
  for (const name of names) {
    if (signal.aborted) {
      return;
    }

    const completePath = path.join(dir, name).replace(/\\/g, '/');
    ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchCheckFileNaming:scanTarget', completePath);

    const stat = fs.statSync(completePath);
    if ((stat.isDirectory() || name.endsWith('.md')) && !execCheckFileNaming(name, nameWhiteList)) {
      ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchCheckFileNaming:addItem', {
        name,
        path: completePath,
        fileType: stat.isDirectory() ? '目录' : '文件',
      });
    }

    if (stat.isDirectory()) {
      await walkDir(completePath, nameWhiteList, signal);
    } 

    if (!signal.aborted) {
      await sleep(3);
    }
  }
}

async function startWalk(targetPath: string) {
  try {
    controller?.abort();
    controller = new AbortController();
    const config = vscode.workspace.getConfiguration('docTools.check.name');
    const whiteList = config.get<string[]>('whiteList', []);
    await walkDir(targetPath, whiteList, controller.signal);
    if (controller && !controller.signal.aborted) {
      ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchCheckFileNaming:stop');
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
  ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchCheckFileNaming:stop');
}

/**
 * 创建批量检查目录名、文件名命名规范 webview
 * @param {vscode.ExtensionContext} context 上下文
 * @param {vscode.Uri} uri 目标目录 uri
 */
export async function createBatchCheckFileNamingWebview(context: vscode.ExtensionContext, uri: vscode.Uri) {
  if (!fs.existsSync(uri.fsPath)) {
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
      path: '/batch-check-file-naming-result',
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
    if (name === 'asyncTask:batchCheckFileNaming' && typeof extras?.[0] === 'string') {
      startWalk(extras[0]);
    } else if (name === 'asyncTask:stopBatchCheckFileNaming') {
      stopWalk();
    }
  });
}
