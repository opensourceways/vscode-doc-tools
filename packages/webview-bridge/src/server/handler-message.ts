import * as vscode from 'vscode';

import { createBroadcastMessage } from '../utils/message';
import { SOURCE_TYPE } from '../@types/message';
import { handlePageMessage } from './handler-page';
import { handleResourceMessage } from './handler-resource';
import { handleMarkdownMessage } from './handler-markdown';
import { handleTocMessage } from './handler-toc';
import { handleConfigMessage } from './handler-config';

const symbolWebviewPanel = Symbol('symbolWebviewPanel');

export class ServerMessageHandler {
  static [symbolWebviewPanel]: vscode.WebviewPanel | null;

  /**
   * 绑定webviewPanel
   * @param {vscode.WebviewPanel} webviewPanel webviewPanel
   * @param {boolean} isDev 是否处于开发环境
   */
  static bind(webviewPanel: vscode.WebviewPanel, isDev: boolean) {
    if (this[symbolWebviewPanel]) {
      this[symbolWebviewPanel].dispose();
    }

    this[symbolWebviewPanel] = webviewPanel;
    handlePageMessage(webviewPanel);
    handleResourceMessage(webviewPanel);
    handleMarkdownMessage(webviewPanel, isDev);
    handleTocMessage(webviewPanel);
    handleConfigMessage(webviewPanel);
  }

  static unbind() {
    if (this[symbolWebviewPanel]) {
      this[symbolWebviewPanel].dispose();
      this[symbolWebviewPanel] = null;
    }
  }

  /**
   * 广播消息
   * @param {string} name 消息名称
   * @param {any[]} arg 附带参数
   */
  static broadcast(name: string, ...arg: any[]) {
    if (!this[symbolWebviewPanel]) {
      return;
    }

    this[symbolWebviewPanel].webview.postMessage(
      createBroadcastMessage({
        source: SOURCE_TYPE.server,
        data: {
          name,
          extras: arg,
        },
      })
    );
  }
}
