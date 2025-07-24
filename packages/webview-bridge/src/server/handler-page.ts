import * as vscode from 'vscode';
import { InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';
import { createInvokeMessage } from '../utils/message';

function setWebviewTitle(webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  const { id, name, args } = message.data;
  if (typeof args?.[0] === 'string') {
    webviewPanel.title = args[0];
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

export function handlePageMessage(webviewPanel: vscode.WebviewPanel) {
  webviewPanel.webview.onDidReceiveMessage((message: MessageT<InvokeT>) => {
    if (message.source !== SOURCE_TYPE.client || message.operation !== OPERATION_TYPE.invoke) {
      return;
    }

    const { name } = message.data;

    switch (name) {
      case 'setWebviewTitle':
        setWebviewTitle(webviewPanel, message);
        break;
    }
  });
}
