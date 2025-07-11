import * as vscode from 'vscode';
import { handleMarkdownMessage } from './handler-markdown';
import { handleTocMessage } from './handler-toc';

export class ServerMessageHandler {
  static bind(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
    handleMarkdownMessage(uri, webviewPanel);
    handleTocMessage(uri, webviewPanel);
  }
}