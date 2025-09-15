import * as vscode from 'vscode';

import { createBroadcastMessage } from '../utils/message';
import { SOURCE_TYPE } from '../@types/message';
import { handlePageMessage } from './handler/handler-page';
import { handleResourceMessage } from './handler/handler-resource';
import { handleMarkdownMessage } from './handler/handler-markdown';
import { handleTocMessage } from './handler/handler-toc';
import { handleConfigMessage } from './handler/handler-config';

const symbolWebviewPanelMap = Symbol('symbolWebviewPanelMap');

export class ServerMessenger {
  static [symbolWebviewPanelMap] = new Map<string, vscode.WebviewPanel>();

  /**
   * 绑定webviewPanel
   * @param {string} id 绑定id
   * @param {vscode.WebviewPanel} webviewPanel webviewPanel
   * @param {boolean} isDev 是否处于开发环境
   */
  static bind(id: string, webviewPanel: vscode.WebviewPanel, isDev: boolean) {
    if (this[symbolWebviewPanelMap].has(id)) {
      this[symbolWebviewPanelMap].get(id)!.dispose();
    }

    this[symbolWebviewPanelMap].set(id, webviewPanel);
    handlePageMessage(webviewPanel);
    handleResourceMessage(webviewPanel);
    handleMarkdownMessage(webviewPanel, isDev);
    handleTocMessage(webviewPanel);
    handleConfigMessage(webviewPanel);

    webviewPanel.onDidDispose(() => {
      this[symbolWebviewPanelMap].delete(id);
    });
  }

  /**
   * 解绑webviewPanel，为空时解绑所有
   * @param {string} id id
   */
  static unbind(id?: string) {
    if (id) {
      if (this[symbolWebviewPanelMap].has(id)) {
        this[symbolWebviewPanelMap].get(id)!.dispose();
        this[symbolWebviewPanelMap].delete(id);
      }
    } else {
      this[symbolWebviewPanelMap].forEach((webviewPanel) => {
        webviewPanel.dispose();
      });
      this[symbolWebviewPanelMap].clear();
    }
  }

  /**
   * 广播消息
   * @param {string} id id
   * @param {string} name 消息名称
   * @param {any[]} arg 附带参数
   */
  static broadcast(id: string, name: string, ...arg: any[]) {
    if (!this[symbolWebviewPanelMap].has(id)) {
      return;
    }

    this[symbolWebviewPanelMap].get(id)!.webview.postMessage(
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
