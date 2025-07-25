import * as vscode from 'vscode';

import { createBroadcastMessage } from '../utils/message';
import { SOURCE_TYPE } from '../@types/message';
import { handlePageMessage } from './handler-page';
import { handleResourceMessage } from './handler-resource';
import { handleMarkdownMessage } from './handler-markdown';
import { handleTocMessage } from './handler-toc';

const symbolWebviewPanel = Symbol('ServerMessageHandler');

export class ServerMessageHandler {
  static [symbolWebviewPanel]: vscode.WebviewPanel;

  static bind(webviewPanel: vscode.WebviewPanel, isDev: boolean) {
    this[symbolWebviewPanel] = webviewPanel;
    handlePageMessage(webviewPanel);
    handleResourceMessage(webviewPanel);
    handleMarkdownMessage(webviewPanel, isDev);
    handleTocMessage(webviewPanel);
  }

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
