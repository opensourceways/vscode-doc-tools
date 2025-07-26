import * as vscode from 'vscode';
import fs from 'fs';

import { InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';
import { createInvokeMessage } from '../utils/message';
import { createDocMarkdownRenderer } from '../utils/markdown';

/**
 * 处理 invoke 消息：markdown 相关
 * @param {vscode.WebviewPanel} webviewPanel WebviewPanel
 * @param {boolean} 是否是开发环境
 */
export function handleMarkdownMessage(webviewPanel: vscode.WebviewPanel, isDev: boolean) {
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
        getMarkdownHtml(webviewPanel, isDev, message);
        break;
    }
  });
}

/**
 * 处理 invoke 消息：getMarkdownContent - 获取 markdown 内容
 * @param {vscode.WebviewPanel} webviewPanel WebviewPanel
 * @param {MessageT<InvokeT>} message 消息
 */
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

/**
 * 处理 invoke 消息：getMarkdownHtml - 获取 markdown html
 * @param {vscode.WebviewPanel} webviewPanel WebviewPanel
 * @param {boolean} 是否是开发环境
 * @param {MessageT<InvokeT>} message 消息
 */
async function getMarkdownHtml(webviewPanel: vscode.WebviewPanel, isDev: boolean, message: MessageT<InvokeT>) {
  const { id, name, args } = message.data;
  let result: string | null = null;

  try {
    if (typeof args?.[0] === 'string' && fs.existsSync(args[0])) {
      const md = await createDocMarkdownRenderer(args[0], webviewPanel.webview, isDev);
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
