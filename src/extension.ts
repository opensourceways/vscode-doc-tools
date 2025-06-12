import * as vscode from 'vscode';
import { checkMarkdown, getCodeActions } from './core/index.js';

// 用于存储错误信息
const diagnosticsCollection = vscode.languages.createDiagnosticCollection('markdownlint');
// 用于存储延迟任务记录
const timerMap = new Map<string, NodeJS.Timeout>()

/**
 * 触发器（延迟 1s 触发检查，避免频繁触发）
 * @param document 文档对象
 */
function trigger(document: vscode.TextDocument) {
  if (document.languageId !== 'markdown' && document.languageId !== 'yaml') {
    return;
  }

  // 清理上一次还未开始执行的任务
  const key = document.uri.path;
  let timer = timerMap.get(key);
  if (!timer) {
    clearTimeout(timer);
  }

  // 重新创建延迟任务
  timer = setTimeout(() => {
    if (document.languageId === 'markdown') {
      checkMarkdown(document, diagnosticsCollection);
      timerMap.delete(key);
    }
  }, 1000);

  timerMap.set(key, timer);
}

/**
 * 激活插件
 * @param context 上下文对象
 */
export function activate(context: vscode.ExtensionContext) {
  // 首次激活后检查
  if (vscode.window.activeTextEditor) {
    trigger(vscode.window.activeTextEditor.document);
  }

  // 监听文件打开
  context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(trigger));

  // 监听文件保存
  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(trigger));

  // 监听内容变化
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => trigger(event.document)));

  // 注册 markdownlint.run 命令
  const lintCommand = vscode.commands.registerCommand('markdownlint.run', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'markdown') {
      trigger(editor.document);
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

/**
 * 失活插件
 */
export function deactivate() {
  diagnosticsCollection.dispose();
}
