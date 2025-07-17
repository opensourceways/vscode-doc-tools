import * as vscode from 'vscode';
import { handleMarkdownMessage } from './handler-markdown';
import { handleTocMessage } from './handler-toc';

export class ServerMessageHandler {
  static bind(webviewPanel: vscode.WebviewPanel) {
    handleMarkdownMessage(webviewPanel);
    handleTocMessage(webviewPanel);
  }
}