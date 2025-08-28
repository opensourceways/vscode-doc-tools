import * as vscode from 'vscode';
import { execExtraSpacesCheck, EXTRA_SPACES_CHECK } from 'checkers';

import { isConfigEnabled } from '@/utils/common';



/**
 * 中文之间多余空格检查
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkExtraSpaces(content: string, document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.extraBlankSpace')) {
    return [];
  }

  return execExtraSpacesCheck(content).map((item) => {
    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, item.message.zh, vscode.DiagnosticSeverity.Information);
    diagnostic.code = item.content;
    diagnostic.source = EXTRA_SPACES_CHECK;
    return diagnostic;
  });
}

/**
 * 获取中文之间多余空格可执行的 action
 * @param {vscode.CodeActionContext} context code action 上下文
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.CodeAction[]} 返回可以执行的 action
 */
export function getExtraSpacesCodeActions(context: vscode.CodeActionContext, document: vscode.TextDocument) {
  const actions: vscode.CodeAction[] = [];
  if (!isConfigEnabled('docTools.check.extraBlankSpace')) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== EXTRA_SPACES_CHECK) {
      return;
    }

    const escapeAction = new vscode.CodeAction('删除空格', vscode.CodeActionKind.QuickFix);
    escapeAction.edit = new vscode.WorkspaceEdit();
    escapeAction.edit.replace(document.uri, item.range, '');
    actions.push(escapeAction);
  });

  return actions;
}
