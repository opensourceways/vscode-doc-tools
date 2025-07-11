import * as vscode from 'vscode';
import fs from 'fs';

import { InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';
import { createInvokeMessage } from '../utils/message';
import { createDocMarkdownRenderer } from '../utils/markdown';

async function getMarkdownContent(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  webviewPanel.webview.postMessage(
    createInvokeMessage<string>({
      id: message.id,
      source: SOURCE_TYPE.server,
      data: {
        name: message.data.name,
        result: fs.readFileSync(uri.fsPath, 'utf-8'),
      },
    })
  );
}

async function getMarkdownHtml(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  const md = await createDocMarkdownRenderer(uri);
  webviewPanel.webview.postMessage(
    createInvokeMessage<string>({
      id: message.id,
      source: SOURCE_TYPE.server,
      data: {
        name: message.data.name,
        result: await md.renderAsync(fs.readFileSync(uri.fsPath, 'utf-8')),
      },
    })
  );
}

export function handleMarkdownMessage(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
  webviewPanel.webview.onDidReceiveMessage((message: MessageT<InvokeT>) => {
    if (message.source !== SOURCE_TYPE.client || message.operation !== OPERATION_TYPE.invoke) {
      return;
    }

    const { name } = message.data;

    switch (name) {
      case 'getMarkdownContent':
        getMarkdownContent(uri, webviewPanel, message);
        break;
      case 'getMarkdownHtml':
        getMarkdownHtml(uri, webviewPanel, message);
        break;
    }
  });
}
