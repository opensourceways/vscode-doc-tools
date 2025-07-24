import * as vscode from 'vscode';

import { InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';
import { createInvokeMessage } from '../utils/message';
import { getBase64Image } from '../utils/resource';
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

async function getBase64Img(webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  const { id, name, args } = message.data;

  webviewPanel.webview.postMessage(
    createInvokeMessage<string>({
      source: SOURCE_TYPE.server,
      data: {
        id,
        name,
        result: getBase64Image(args?.[0]),
      },
    })
  );
}

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
      case 'getBase64Image':
        getBase64Img(webviewPanel, message);
        break;
    }
  });
}
