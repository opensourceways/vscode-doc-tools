import * as vscode from 'vscode';

import { EVENT_TYPE } from './@types/event.js';
import { getCodeActions, triggerCheck } from './core/check/index.js';
import { genTocManual } from './core/command/gen-toc-manual.js';
import { markdownLintRun } from './core/command/markdown-lint-run.js';

// 用于存储错误信息
const diagnosticsCollection = vscode.languages.createDiagnosticCollection('doc-tools');

/**
 * 注册事件
 * @param context 上下文对象
 */
function registerEvent(context: vscode.ExtensionContext) {
  // 监听文件打开
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      triggerCheck(EVENT_TYPE.EVENT_OPEN_TEXT_DOC, document, diagnosticsCollection);
    })
  );

  // 监听文件保存
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      triggerCheck(EVENT_TYPE.EVENT_SAVE_TEXT_DOC, document, diagnosticsCollection);
    })
  );

  // 监听内容变化
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      triggerCheck(EVENT_TYPE.EVENT_CHANGE_TEXT_DOC, event.document, diagnosticsCollection);
    })
  );
}

/**
 * 注册命令
 * @param context 上下文对象
 */
function registerCommand(context: vscode.ExtensionContext) {
  // 注册 markdownlint.run 命令
  context.subscriptions.push(
    vscode.commands.registerCommand('markdownlint.run', () => {
      markdownLintRun(diagnosticsCollection);
    })
  );

  // 注册 gen-toc.manual 命令
  context.subscriptions.push(
    vscode.commands.registerCommand('gen-toc.manual', (uri: vscode.Uri) => {
      genTocManual(uri);
    })
  );
}

/**
 * 注册code action
 * @param context 上下文对象
 */
function registerCodeAction(context: vscode.ExtensionContext) {
  // 注册 code action 菜单
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('markdown', {
      provideCodeActions(document, _range, context, _token) {
        return getCodeActions(document, context);
      },
    })
  );
}

/**
 * 激活插件
 * @param context 上下文对象
 */
export function activate(context: vscode.ExtensionContext) {
  // 首次激活后检查
  if (vscode.window.activeTextEditor) {
    triggerCheck(EVENT_TYPE.EVENT_ACTIVE, vscode.window.activeTextEditor.document, diagnosticsCollection);
  }

  // 注册事件、命令和 code action
  registerEvent(context);
  registerCommand(context);
  registerCodeAction(context);
}

/**
 * 失活插件
 */
export function deactivate() {
  diagnosticsCollection.dispose();
}
