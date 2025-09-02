import * as vscode from 'vscode';

import { InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../../@types/message';
import { createInvokeMessage } from '../../utils/message';
import { getTocByMdPath } from '../../utils/toc';

/**
 * 处理 invoke 消息：toc 相关
 * @param {vscode.WebviewPanel} webviewPanel WebviewPanel
 */
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

/**
 * 处理 invoke 消息：getToc - 获取 toc
 * @param {vscode.WebviewPanel} webviewPanel WebviewPanel
 * @param {MessageT<InvokeT>} message 消息
 */
async function getToc(webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  const { id, name, args } = message.data;
  webviewPanel.webview.postMessage(
    createInvokeMessage<{
      tocPath: string | null;
      tocObj: Record<string, any> | null;
    } | null>({
      source: SOURCE_TYPE.server,
      data: {
        id,
        name,
        result: await getTocByMdPath(args?.[0]),
      },
    })
  );
}