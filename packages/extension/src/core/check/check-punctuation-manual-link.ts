import * as vscode from 'vscode';
import { execCheckPunctuationManualLink, PUNCTUATION_MANUAL_LINK_CHECK } from 'checkers';

import { isConfigEnabled } from '@/utils/common';

/**
 * 检查外链手册是否有书名号
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkPunctuationManualLink(content: string, document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.punctuationManualLink')) {
    return [];
  }

  return execCheckPunctuationManualLink(content).map((item) => {
    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, item.message.zh, vscode.DiagnosticSeverity.Information);
    diagnostic.source = PUNCTUATION_MANUAL_LINK_CHECK;
    diagnostic.code = item.extras;
    return diagnostic;
  });
}

/**
 * 获取外链手册是否有书名号可执行的 action
 * @param {vscode.CodeActionContext} context code action 上下文
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.CodeAction[]} 返回可以执行的 action
 */
export function getPunctuationMauanlLinkActions(context: vscode.CodeActionContext, document: vscode.TextDocument) {
  const actions: vscode.CodeAction[] = [];
  if (!isConfigEnabled('docTools.check.punctuationManualLink')) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== PUNCTUATION_MANUAL_LINK_CHECK) {
      return;
    }

    const escapeAction = new vscode.CodeAction('添加书名号', vscode.CodeActionKind.QuickFix);
    escapeAction.edit = new vscode.WorkspaceEdit();
    escapeAction.edit.replace(document.uri, item.range, `《${item.code}》`);
    actions.push(escapeAction);
  });

  return actions;
}
