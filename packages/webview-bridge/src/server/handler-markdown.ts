import * as vscode from 'vscode';
import fs from 'fs';

import { InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';
import { createInvokeMessage } from '../utils/message';
import { createDocMarkdownRenderer } from '../utils/markdown';

async function getMarkdownContent(webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  const { id, name, args } = message.data;
  let result: string | null = null;

  try {
    if (typeof args?.[0] === 'string' && fs.existsSync(args[0])) {
      result = fs.readFileSync(args[0], 'utf-8');
    }
  } catch (error) {
    // nothing
  }

  webviewPanel.webview.postMessage(
    createInvokeMessage<string | null>({
      source: SOURCE_TYPE.server,
      data: {
        id,
        name,
        result,
      },
    })
  );
}

async function getMarkdownHtml(webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  const { id, name, args } = message.data;
  let result: string | null = null;

  try {
    if (typeof args?.[0] === 'string' && fs.existsSync(args[0])) {
      const md = await createDocMarkdownRenderer(args[0]);
      result = await md.renderAsync(fs.readFileSync(args[0], 'utf-8'));
    }
  } catch (error) {
    // nothing
  }

  webviewPanel.webview.postMessage(
    createInvokeMessage<string | null>({
      source: SOURCE_TYPE.server,
      data: {
        id,
        name,
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
