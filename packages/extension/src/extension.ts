import * as vscode from 'vscode';

import { EVENT_TYPE } from '@/@types/event';
import { getCodeActions, triggerCheck } from '@/core/check';
import { genTocManual } from '@/core/command/cmd-gen-toc-manual';
import { checkMarkdown } from '@/core/command/cmd-check-markdown';
import { addCodespellWhitelist } from '@/core/command/cmd-add-codespell-whitlist';

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
  // 注册 运行Markdown检查 命令
  context.subscriptions.push(
    vscode.commands.registerCommand('doc.tools.check.markdown', () => {
      checkMarkdown(diagnosticsCollection);
    })
  );

  // 注册 生成指南 _toc.yaml 命令
  context.subscriptions.push(
    vscode.commands.registerCommand('doc.tools.gen.toc.manual', (uri: vscode.Uri) => {
      genTocManual(uri);
    })
  );

  // 注册 添加单词白名单 命令
  context.subscriptions.push(
    vscode.commands.registerCommand('doc.tools.add.codespell.white.list', (word: string) => {
      addCodespellWhitelist(word, diagnosticsCollection);
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
