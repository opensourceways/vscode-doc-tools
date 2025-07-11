import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';

import { ServerMessageHandler } from 'webview-bridge';

export function previewMarkdown(context: vscode.ExtensionContext, uri: vscode.Uri) {
  const isDev = fs.existsSync(path.resolve(context.extensionPath, 'packages/webview-bridge/dev/index.html'));
  const basePath = path.join(context.extensionPath, isDev ? 'packages/webview-bridge/dev' : 'dist/webview', '/');
  const htmlPath = path.join(basePath, 'index.html');

  const panel = vscode.window.createWebviewPanel(
    'Doc Tools：预览 markdown', // 标识
    path.basename(uri.fsPath), // 面板标题
    vscode.ViewColumn.Beside, // 在编辑器旁边打开
    {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [context.extensionUri, vscode.Uri.file(basePath), ...(vscode.workspace.workspaceFolders?.map((folder) => folder.uri) || [])],
    }
  );

  ServerMessageHandler.bind(uri, panel);
  if (isDev) {
    panel.webview.html = fs
      .readFileSync(htmlPath, 'utf-8')
      .replace('${baseHref}', panel.webview.asWebviewUri(vscode.Uri.file(basePath)).toString())
      .replace('${iframeSrc}', 'http://localhost:23333/markdown');
  } else {
    panel.webview.html = fs
      .readFileSync(htmlPath, 'utf-8')
      .replace(`<base href="/">`, `<base href="${panel.webview.asWebviewUri(vscode.Uri.file(basePath))}">`);
  }
}
