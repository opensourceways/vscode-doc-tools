import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { execMultiNameConsistencyCheck } from 'checkers';
import { ServerMessageHandler } from 'webview-bridge';

import { createWebviewPanel } from '@/utils/webview';

/**
 * 检查中英文文档名称一致性
 * @param {vscode.ExtensionContext} context 上下文
 * @param {vscode.Uri} uri 目标目录 uri
 */
export async function checkNameConsistency(context: vscode.ExtensionContext, uri: vscode.Uri) {
  if (!fs.existsSync(uri.fsPath)) {
    vscode.window.showErrorMessage(`路径不存在：${uri.fsPath}`);
    return;
  }

  const fsPath = fs.realpathSync.native(uri.fsPath).replace(/\\/g, '/');
  if (!fs.statSync(fsPath).isDirectory()) {
    vscode.window.showErrorMessage(`非目录路径：${fsPath}`);
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Doc Tools: 正在检查中英文文档名称一致性...',
      cancellable: false,
    },
    async (progress) => {
      const results = await execMultiNameConsistencyCheck(fsPath, ['README.md']);
      const isDarkTheme = vscode.workspace.getConfiguration().get<string>('workbench.colorTheme', '').toLowerCase().includes('dark');

      progress.report({ message: 'Doc Tools: 正在生成检查结果...' });

      createWebviewPanel({
        context,
        viewType: 'Doc Tools：检查结果',
        title: 'Doc Tools：检查结果',
        showOptions: vscode.ViewColumn.Beside,
        iconPath: vscode.Uri.file(path.join(context.extensionPath, 'resources', isDarkTheme ? 'icon-preview-dark.svg' : 'icon-preview-light.svg')),
        injectData: {
          path: '/check-name-consistency-result',
          theme: isDarkTheme ? 'dark' : 'light',
          locale: fsPath.includes('/en/') ? 'en' : 'zh',
          extras: {
            fsPath,
            results,
          },
        },
        onBeforeLoad(webviewPanel, isDev) {
          ServerMessageHandler.bind(webviewPanel, isDev);
        },
      });
    }
  );
}
