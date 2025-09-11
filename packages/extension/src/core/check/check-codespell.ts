import * as vscode from 'vscode';
import { CODESPELL_CHECK, DEFAULT_WHITELIST_WORDS, execCheckCodespell } from 'checkers';

import { isConfigEnabled } from '@/utils/common';


// 错误单词提示记录
const WORDS = new Map<string, string[]>();

/**
 * codespell 检查
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkCodespell(content: string, document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.codespell')) {
    return [];
  }

  const whiteListConfig = vscode.workspace.getConfiguration('docTools.check.codespell').get<string[]>('whiteList', []);
  const whiteList = Array.isArray(whiteListConfig) ? [...whiteListConfig, ...DEFAULT_WHITELIST_WORDS] : DEFAULT_WHITELIST_WORDS;
  const results = await execCheckCodespell(content, whiteList);

  return results.map(item => { 
    if (Array.isArray(item.extras)) {
      WORDS.set(item.content, item.extras);
    }

    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, item.message.zh, vscode.DiagnosticSeverity.Information);
    diagnostic.source = CODESPELL_CHECK;
    diagnostic.code = item.content;
    
    return diagnostic;
  });
}

/**
 * 获取 codespell 可执行的 action
 * @param {vscode.CodeActionContext} context code action 上下文
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.CodeAction[]} 返回可以执行的 action
 */
export function getCodespellCodeActions(context: vscode.CodeActionContext, document: vscode.TextDocument) {
  const actions: vscode.CodeAction[] = [];
  if (!isConfigEnabled('docTools.check.codespell')) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== CODESPELL_CHECK) {
      return;
    }

    const suggestions = WORDS.get(item.code as string);
    if (!Array.isArray(suggestions)) {
      return;
    }

    suggestions.forEach((word) => {
      const action = new vscode.CodeAction(word, vscode.CodeActionKind.QuickFix);
      action.edit = new vscode.WorkspaceEdit();
      action.edit.replace(document.uri, item.range, word);
      actions.push(action);
    });

    const whiteListAction = new vscode.CodeAction('添加单词白名单', vscode.CodeActionKind.QuickFix);
    whiteListAction.command = {
      command: 'doc.tools.codespell.add.whitelist',
      title: '添加单词白名单',
      arguments: [item.code],
    };
    actions.push(whiteListAction);
  });

  return actions;
}
