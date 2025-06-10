import * as vscode from 'vscode';
import { lint, getCodeActions } from './core/index.js';
import genToc from './command/gen-toc.js';

import { EVENT_TYPE } from './@types/event.js';

// 用于存储错误信息
const diagnosticsCollection = vscode.languages.createDiagnosticCollection('markdownlint');
let timer: string | number | NodeJS.Timeout;

export function activate(context: vscode.ExtensionContext) {
  // 首次激活后检查
  if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === 'markdown') {
    lint({
      document: vscode.window.activeTextEditor.document,
      diagnosticsCollection,
      eventType: EVENT_TYPE.EVENT_ACTIVE,
    });
  }

  // 监听文件打开
  const onDidOpenTextDocumentListener = vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.languageId === 'markdown') {
      lint({
        document,
        diagnosticsCollection,
        eventType: EVENT_TYPE.EVENT_OPEN_TEXT_DOC,
      });
    }
  });

  context.subscriptions.push(onDidOpenTextDocumentListener);

  // 监听文件保存
  const onDidSaveTextDocumentListener = vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.languageId === 'markdown') {
      lint({
        document,
        diagnosticsCollection,
        eventType: EVENT_TYPE.EVENT_SAVE_TEXT_DOC,
      });
    }
  });

  context.subscriptions.push(onDidSaveTextDocumentListener);

  // 监听内容变化
  let lastChanged: (readonly vscode.TextDocumentContentChangeEvent[])[] = [];
  const onDidChangeTextDocumentListener = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.languageId === 'markdown') {
      lastChanged.push(event.contentChanges);
      clearTimeout(timer);
      timer = setTimeout(() => {
        lint({
          document: event.document,
          diagnosticsCollection,
          eventType: EVENT_TYPE.EVENT_CHANGE_TEXT_DOC,
          contentChanged: lastChanged,
        });
        lastChanged = [];
      }, 1000);
    }
  });

  context.subscriptions.push(onDidChangeTextDocumentListener);

  // 注册 markdownlint.run 命令
  const lintCommand = vscode.commands.registerCommand('markdownlint.run', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'markdown') {
      lint({
        document: editor.document,
        diagnosticsCollection,
        eventType: EVENT_TYPE.EVENT_RUN_COMMAND,
      });
    } else {
      vscode.window.showInformationMessage('请在Markdown文件中运行Markdownlint');
    }
  });

  context.subscriptions.push(lintCommand);

  // 注册 code action 菜单
  const codeActionProvider = vscode.languages.registerCodeActionsProvider('markdown', {
    provideCodeActions(document, _range, context, _token) {
      return getCodeActions(document, context);
    },
  });

  context.subscriptions.push(codeActionProvider);
}

export function deactivate() {
  diagnosticsCollection.dispose();
}
