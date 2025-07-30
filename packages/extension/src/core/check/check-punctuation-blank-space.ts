import * as vscode from 'vscode';
import { execPunctuationBlankSpaceCheck } from 'checkers';

import { isConfigEnabled } from '@/utils/common';

/**
 * 检查中文标点符号前后是否有多余空格
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkPunctuationBlankSpace(content: string, document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.punctuationBlankSpace')) {
    return [];
  }

  return execPunctuationBlankSpaceCheck(content).map((item) => {
    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, item.message, vscode.DiagnosticSeverity.Information);
    diagnostic.source = 'punctuation-blank-space-check';
    return diagnostic;
  });
}

/**
 * 获取中文标点符号前后是否有多余空格可执行的 action
 * @param {vscode.CodeActionContext} context code action 上下文
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.CodeAction[]} 返回可以执行的 action
 */
export function getPunctuationBlankSpaceCodeActions(context: vscode.CodeActionContext, document: vscode.TextDocument) {
  const actions: vscode.CodeAction[] = [];
  if (!isConfigEnabled('docTools.check.punctuationBlankSpace')) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== 'punctuation-blank-space-check') {
      return;
    }

    const escapeAction = new vscode.CodeAction('删除空格', vscode.CodeActionKind.QuickFix);
    escapeAction.edit = new vscode.WorkspaceEdit();
    escapeAction.edit.replace(document.uri, item.range, '');
    actions.push(escapeAction);
  });

  return actions;
}
