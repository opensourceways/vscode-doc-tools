import * as vscode from 'vscode';
import { InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';
import { createInvokeMessage } from '../utils/message';
import { getRelativeToc } from 'src/utils/toc';

async function getToc(webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  const { args } = message.data;
  webviewPanel.webview.postMessage(
    createInvokeMessage<Record<string, any> | null>({
      id: message.id,
      source: SOURCE_TYPE.server,
      data: {
        name: message.data.name,
        result: await getRelativeToc(args?.[0]),
      },
    })
  );
}

export function handleTocMessage(webviewPanel: vscode.WebviewPanel) {
  webviewPanel.webview.onDidReceiveMessage((message: MessageT<InvokeT>) => {
    if (message.source !== SOURCE_TYPE.client || message.operation !== OPERATION_TYPE.invoke) {
      return;
    }

    const { name } = message.data;

    switch (name) {
      case 'getToc':
        getToc(webviewPanel, message);
        break;
    }
  });
}
