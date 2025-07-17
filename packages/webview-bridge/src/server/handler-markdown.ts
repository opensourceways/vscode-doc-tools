import * as vscode from 'vscode';
import fs from 'fs';

import { InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';
import { createInvokeMessage } from '../utils/message';
import { createDocMarkdownRenderer } from '../utils/markdown';

async function getMarkdownContent(webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  const { args } = message.data;
  let result = '';

  try {
    result = fs.readFileSync(args![0], 'utf-8');
  } catch (error) {
    // nothing
  }

  webviewPanel.webview.postMessage(
    createInvokeMessage<string>({
      id: message.id,
      source: SOURCE_TYPE.server,
      data: {
        name: message.data.name,
        result,
      },
    })
  );
}

async function getMarkdownHtml(webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  const { args } = message.data;
  let result = '';

  try {
    const md = await createDocMarkdownRenderer(args![0]);
    result = await md.renderAsync(fs.readFileSync(args![0], 'utf-8'));
  } catch (error) {
    // nothing
  }

  
  webviewPanel.webview.postMessage(
    createInvokeMessage<string>({
      id: message.id,
      source: SOURCE_TYPE.server,
      data: {
        name: message.data.name,
        result,
      },
    })
  );
}

export function handleMarkdownMessage(webviewPanel: vscode.WebviewPanel) {
  webviewPanel.webview.onDidReceiveMessage((message: MessageT<InvokeT>) => {
    if (message.source !== SOURCE_TYPE.client || message.operation !== OPERATION_TYPE.invoke) {
      return;
    }

    const { name } = message.data;

    switch (name) {
      case 'getMarkdownContent':
        getMarkdownContent(webviewPanel, message);
        break;
      case 'getMarkdownHtml':
        getMarkdownHtml(webviewPanel, message);
        break;
    }
  });
}
