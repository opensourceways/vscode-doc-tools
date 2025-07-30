import * as vscode from 'vscode';

import { InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';
import { createInvokeMessage } from '../utils/message';

/**
 * 处理 invoke 消息：资源相关
 * @param {vscode.WebviewPanel} webviewPanel WebviewPanel
 */
export function handleResourceMessage(webviewPanel: vscode.WebviewPanel) {
  webviewPanel.webview.onDidReceiveMessage((message: MessageT<InvokeT>) => {
    if (message.source !== SOURCE_TYPE.client || message.operation !== OPERATION_TYPE.invoke) {
      return;
    }

    const { name } = message.data;

    switch (name) {
      case 'viewSource':
        viewSource(webviewPanel, message);
        break;
    }
  });
}

/**
 * 处理 invoke 消息：viewSource - 在 VSCode 中打开对应的源文件
 * @param {vscode.WebviewPanel} webviewPanel WebviewPanel
 * @param {MessageT<InvokeT>} message 消息
 */
async function viewSource(webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  const { id, name, args } = message.data;
  if (typeof args?.[0] === 'string') {
    const filePath = vscode.Uri.file(args[0]);
    const document = await vscode.workspace.openTextDocument(filePath);

    await vscode.window.showTextDocument(
      document,
      typeof webviewPanel.viewColumn?.valueOf?.() === 'number' && webviewPanel.viewColumn.valueOf() > 1
        ? webviewPanel.viewColumn.valueOf() - 1
        : vscode.ViewColumn.Beside
    );
  }

  webviewPanel.webview.postMessage(
    createInvokeMessage({
      source: SOURCE_TYPE.server,
      data: {
        id,
        name,
      },
    })
  );
}
