import * as vscode from 'vscode';

import { InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../../@types/message';
import { createInvokeMessage } from '../../utils/message';

/**
 * 处理 invoke 消息：配置相关
 * @param {vscode.WebviewPanel} webviewPanel
 */
export function handleConfigMessage(webviewPanel: vscode.WebviewPanel) {
  webviewPanel.webview.onDidReceiveMessage((message: MessageT<InvokeT>) => {
    if (message.source !== SOURCE_TYPE.client || message.operation !== OPERATION_TYPE.invoke) {
      return;
    }

    const { name } = message.data;

    switch (name) {
      case 'addCheckNameWhiteList':
        addCheckNameWhiteList(webviewPanel, message);
        break;
      case 'addUrlWhiteList':
        addUrlWhiteList(webviewPanel, message);
        break;
    }
  });
}

/**
 * 处理 invoke 消息：addCheckNameWhiteList - 添加文件/目录命名规范白名单
 * @param {vscode.WebviewPanel} webviewPanel
 * @param {MessageT<InvokeT>} message
 */
async function addCheckNameWhiteList(webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  const { id, name, args } = message.data;
  if (typeof args?.[0] === 'string') {
    const config = vscode.workspace.getConfiguration('docTools.check.name');
    const whiteList = config.get<string[]>('whiteList', []);
    if (!whiteList.includes(args[0])) {
      whiteList.push(args[0]);
    }
  
    await config.update('whiteList', whiteList, vscode.ConfigurationTarget.Global);
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

/**
 * 处理 invoke 消息：addUrlWhiteList - 添加地址白名单
 * @param {vscode.WebviewPanel} webviewPanel
 * @param {MessageT<InvokeT>} message
 */
async function addUrlWhiteList(webviewPanel: vscode.WebviewPanel, message: MessageT<InvokeT>) {
  const { id, name, args } = message.data;
  if (typeof args?.[0] === 'string') {
    const config = vscode.workspace.getConfiguration('docTools.check.url');
    const whiteList = config.get<string[]>('whiteList', []);
    if (!whiteList.includes(args[0])) {
      whiteList.push(args[0]);
    }
  
    await config.update('whiteList', whiteList, vscode.ConfigurationTarget.Global);
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
