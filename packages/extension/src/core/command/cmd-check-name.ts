import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { execFilenameAndDirnameCheck } from 'checkers';

import { isConfigEnabled } from '@/utils/common';
import { createWebviewPanel } from '@/utils/webview';
import { ServerMessageHandler } from 'webview-bridge';

/**
 * 检查目录名、文件名命名规范
 * @param {vscode.Uri} uri 目标目录 uri
 */
export async function checkName(context: vscode.ExtensionContext, uri: vscode.Uri) {
  const dirPath = uri.fsPath.replace(/\\/g, '/');

  if (!fs.existsSync(dirPath)) {
    vscode.window.showErrorMessage(`路径不存在：${dirPath}`);
    return;
  }

  if (!fs.statSync(dirPath).isDirectory()) {
    vscode.window.showErrorMessage(`非目录路径：${dirPath}`);
    return;
  }

  if (isConfigEnabled('docTools.scope') && !dirPath.includes('docs/zh') && !dirPath.includes('docs/en')) {
    vscode.window.showErrorMessage(`非文档下的 zh 或 en 目录：${dirPath}`);
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Doc Tools: 正在检查命名规范...',
      cancellable: false,
    },
    async (progress) => {
      const config = vscode.workspace.getConfiguration('docTools.check.name');
      const whiteList = config.get<string[]>('whiteList', []);
      const results = await execFilenameAndDirnameCheck(dirPath, whiteList);
      const fsPath = uri.fsPath.replace(/\\/g, '/');
      const isDarkTheme = vscode.workspace.getConfiguration().get<string>('workbench.colorTheme', '').toLowerCase().includes('dark');

      progress.report({ message: 'Doc Tools: 正在生成检查结果...' });

      createWebviewPanel({
        context,
        viewType: 'Doc Tools：检查结果',
        title: 'Doc Tools：检查结果',
        showOptions: vscode.ViewColumn.Beside,
        iconPath: vscode.Uri.file(path.join(context.extensionPath, 'resources', isDarkTheme ? 'icon-preview-dark.svg' : 'icon-preview-light.svg')),
        webviewPanelOptions: {
          retainContextWhenHidden: true,
          enableScripts: true,
          enableCommandUris: true,
        },
        injectData: {
          path: '/check-name-result',
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
