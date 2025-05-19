import * as vscode from 'vscode';
import lint from './lint/index.js';

// 用于存储错误信息
const diagnosticsCollection = vscode.languages.createDiagnosticCollection('markdownlint');
let timer: string | number | NodeJS.Timeout;

export function activate(context: vscode.ExtensionContext) {
  // 首次激活后检查
  if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === 'markdown') {
    lint(vscode.window.activeTextEditor.document, diagnosticsCollection);
  }

  // 监听文件打开
  const onDidOpenTextDocumentListener = vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.languageId === 'markdown') {
      lint(document, diagnosticsCollection);
    }
  });

  context.subscriptions.push(onDidOpenTextDocumentListener);

  // 监听文件保存
  const onDidSaveTextDocumentListener = vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.languageId === 'markdown') {
      lint(document, diagnosticsCollection);
    }
  });

  context.subscriptions.push(onDidSaveTextDocumentListener);

  // 监听内容变化
  const onDidChangeTextDocumentListener = vscode.workspace.onDidChangeTextDocument((event) => {
    console.log('changed');
    if (event.document.languageId === 'markdown') {
      clearTimeout(timer);
      timer = setTimeout(() => {
        lint(event.document, diagnosticsCollection);
      }, 1000);
    }
  });

  context.subscriptions.push(onDidChangeTextDocumentListener);

  // 注册命令
  const lintCommand = vscode.commands.registerCommand('markdownlint.run', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'markdown') {
      lint(editor.document, diagnosticsCollection);
    } else {
      vscode.window.showInformationMessage('请在Markdown文件中运行Markdownlint');
    }
  });

  context.subscriptions.push(lintCommand);
}

export function deactivate() {
  diagnosticsCollection.dispose();
}
