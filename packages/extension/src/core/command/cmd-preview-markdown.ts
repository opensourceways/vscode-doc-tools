import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';

import { ServerMessageHandler } from 'webview-bridge';

let panel: vscode.WebviewPanel | null = null;

export function disposePreviewMarkdown() {
  panel?.dispose();
}

export function previewMarkdown(context: vscode.ExtensionContext, uri: vscode.Uri) {
  if (panel) {
    panel.dispose();
  }

  const isDarkTheme = vscode.workspace.getConfiguration().get<string>('workbench.colorTheme', '').toLowerCase().includes('dark');
  const isDev = fs.existsSync(path.resolve(context.extensionPath, 'packages/webview-bridge/dev/index.html'));
  const basePath = path.join(context.extensionPath, isDev ? 'packages/webview-bridge/dev' : 'dist/webview', '/');
  const htmlPath = path.join(basePath, 'index.html');

  panel = vscode.window.createWebviewPanel(
    'Doc Tools：预览 markdown', // 标识
    path.basename(uri.fsPath), // 面板标题
    vscode.ViewColumn.Beside, // 在编辑器旁边打开
    {
      retainContextWhenHidden: true,
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [context.extensionUri, vscode.Uri.file(basePath), ...(vscode.workspace.workspaceFolders?.map((folder) => folder.uri) || [])],
    }
  );

  panel.iconPath = vscode.Uri.file(path.join(context.extensionPath, 'resources', isDarkTheme ? 'icon-preview-dark.svg' : 'icon-preview-light.svg'));
  ServerMessageHandler.bind(panel);

  const fsPath = uri.fsPath.replace(/\\/g, '/');
  const injectData = {
    path: '/markdown',
    theme: isDarkTheme ? 'dark' : 'light',
    locale: fsPath.includes('/en/') ? 'en' : 'zh',
    query: {
      fsPath,
    },
  };

  if (isDev) {
    panel.webview.html = fs
      .readFileSync(htmlPath, 'utf-8')
      .replace('${baseHref}', panel.webview.asWebviewUri(vscode.Uri.file(basePath)).toString())
      .replace('${iframeSrc}', `http://localhost:23333?injectData=${encodeURIComponent(JSON.stringify(injectData))}`);
  } else {
    panel.webview.html = fs
      .readFileSync(htmlPath, 'utf-8')
      .replace(`<base href="/">`, `<base href="${panel.webview.asWebviewUri(vscode.Uri.file(basePath))}">`)
      .replace(`</title>`, `</title><script>window.__injectData = \`${JSON.stringify(injectData)}\`</script>`);
  }

  context.subscriptions.push(panel);
}
