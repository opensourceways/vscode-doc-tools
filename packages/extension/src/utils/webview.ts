import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';

export function createWebviewPanel(options: {
  context: vscode.ExtensionContext;
  viewType: string;
  title: string;
  showOptions: vscode.ViewColumn;
  injectData: any;
  iconPath?: vscode.Uri;
  webviewPanelOptions?: vscode.WebviewPanelOptions & vscode.WebviewOptions;
  onBeforeLoad?: (webviewPanel: vscode.WebviewPanel, isDev: boolean) => void;
  onAfterLoad?: (webviewPanel: vscode.WebviewPanel, isDev: boolean) => void;
}) {
  const isDev = fs.existsSync(path.resolve(options.context.extensionPath, 'packages/webview-bridge/dev/index.html'));
  const basePath = path.join(options.context.extensionPath, isDev ? 'packages/webview-bridge/dev' : 'dist/webview', '/');
  const htmlPath = path.join(basePath, 'index.html');

  const panel = vscode.window.createWebviewPanel(
    options.viewType, // 标识
    options.title, // 面板标题
    options.showOptions, // 在编辑器旁边打开
    {
      ...(options.webviewPanelOptions || {}),
      retainContextWhenHidden: true,
      enableScripts: true,
    }
  );

  if (options.iconPath) {
    panel.iconPath = options.iconPath;
  }

  options.onBeforeLoad?.(panel, isDev);

  if (isDev) {
    panel.webview.html = fs
      .readFileSync(htmlPath, 'utf-8')
      .replace('${baseHref}', panel.webview.asWebviewUri(vscode.Uri.file(basePath)).toString())
      .replace('${iframeSrc}', `http://localhost:23333?injectData=${encodeURIComponent(JSON.stringify(options.injectData))}`);
  } else {
    panel.webview.html = fs
      .readFileSync(htmlPath, 'utf-8')
      .replace(`<base href="/">`, `<base href="${panel.webview.asWebviewUri(vscode.Uri.file(basePath))}">`)
      .replace(`</title>`, `</title><script>window.__injectData = \`${JSON.stringify(options.injectData)}\`</script>`);
  }

  options.context.subscriptions.push(panel);
  options.onAfterLoad?.(panel, isDev);

  return panel;
}
