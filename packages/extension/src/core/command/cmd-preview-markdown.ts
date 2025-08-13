import * as vscode from 'vscode';
import path from 'path';

import { ServerMessageHandler } from 'webview-bridge';
import { createWebviewPanel } from '@/utils/webview';

/**
 * 预览 markdown
 * @param {vscode.ExtensionContext} context 上下文
 * @param {vscode.Uri} uri 文档 uri
 */
export function previewMarkdown(context: vscode.ExtensionContext, uri: vscode.Uri) {
  const fsPath = uri.fsPath.replace(/\\/g, '/');
  const isDarkTheme = vscode.workspace.getConfiguration().get<string>('workbench.colorTheme', '').toLowerCase().includes('dark');

  createWebviewPanel({
    context,
    viewType: 'Doc Tools：预览 markdown',
    title: path.basename(uri.fsPath),
    showOptions: vscode.ViewColumn.Beside,
    iconPath: vscode.Uri.file(path.join(context.extensionPath, 'resources', isDarkTheme ? 'icon-preview-dark.svg' : 'icon-preview-light.svg')),
    webviewPanelOptions: {
      retainContextWhenHidden: true,
      enableScripts: true,
      enableCommandUris: true,
    },
    injectData: {
      path: '/markdown',
      theme: isDarkTheme ? 'dark' : 'light',
      locale: fsPath.includes('/en/') ? 'en' : 'zh',
      query: {
        fsPath,
      },
    },
    onBeforeLoad(webviewPanel, isDev) {
      ServerMessageHandler.bind(webviewPanel, isDev);
    },
  });
}

/**
 * 触发 markdown/_toc.yaml 内容改变
 * @param {vscode.TextDocument} document 文档对象
 */
export const triggerPreviewMarkdownContentChange = (() => {
  let timerTriggerMdContentChange: NodeJS.Timeout | null = null;
  let timerTriggerTocContentChange: NodeJS.Timeout | null = null;

  return (document: vscode.TextDocument) => {
    if (document.languageId !== 'markdown' && document.languageId !== 'yaml') {
      return;
    }

    if (document.languageId === 'markdown') {
      if (timerTriggerMdContentChange) {
        clearTimeout(timerTriggerMdContentChange);
      }

      timerTriggerMdContentChange = setTimeout(() => {
        ServerMessageHandler.broadcast('onMarkdownContentChange', document.uri.fsPath.replace(/\\/g, '/'));
        timerTriggerMdContentChange = null;
      }, 1000);

      return;
    }

    if (document.languageId === 'yaml' && document.uri.path.split('/').pop() === '_toc.yaml') {
      if (timerTriggerTocContentChange) {
        clearTimeout(timerTriggerTocContentChange);
      }

      timerTriggerTocContentChange = setTimeout(() => {
        ServerMessageHandler.broadcast('onTocContentChange', document.uri.fsPath.replace(/\\/g, '/'));
        timerTriggerTocContentChange = null;
      }, 1000);
      return;
    }
  };
})();
