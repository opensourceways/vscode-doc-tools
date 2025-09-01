import * as vscode from 'vscode';
import { execCheckTagClosed, TAG_CLOSED_CHECK } from 'checkers';

import { isConfigEnabled } from '@/utils/common';

/**
 * 检查 html 标签是否闭合
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkTagClosed(content: string, document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  if (!isConfigEnabled('docTools.check.tagClosed')) {
    return diagnostics;
  }

  return execCheckTagClosed(content).map((item) => {
    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, item.message.zh, vscode.DiagnosticSeverity.Error);
    diagnostic.source = TAG_CLOSED_CHECK;
    diagnostic.code = item.content;
    diagnostics.push(diagnostic);

    return diagnostic;
  });
}

/**
 * 获取标签不闭合可执行的 action
 * @param {vscode.CodeActionContext} context code action 上下文
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.CodeAction[]} 返回可以执行的 action
 */
export function getTagClosedCodeActions(context: vscode.CodeActionContext, document: vscode.TextDocument) {
  const actions: vscode.CodeAction[] = [];
  if (!isConfigEnabled('docTools.check.tagClosed')) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== TAG_CLOSED_CHECK) {
      return;
    }

    const code = String(item.code);
    const escapeAction1 = new vscode.CodeAction('\\字符替换 (适用于非 Html 标签嵌套的情况)', vscode.CodeActionKind.QuickFix);
    escapeAction1.edit = new vscode.WorkspaceEdit();
    escapeAction1.edit.replace(document.uri, item.range, code.replace('<', '\\<'));
    actions.push(escapeAction1);

    const escapeAction2 = new vscode.CodeAction('&lt;和&gt;字符替换 (适用于 Html 标签嵌套的情况)', vscode.CodeActionKind.QuickFix);
    escapeAction2.edit = new vscode.WorkspaceEdit();
    escapeAction2.edit.replace(document.uri, item.range, code.replace('\\<', '<').replace('\\>', '>').replace('<', '&lt;').replace('>', '&gt;'));
    actions.push(escapeAction2);

    const match = code.match(/<\s*\/?\s*([a-zA-Z0-9\-]+)([^>]*)>/);
    if (match) {
      const closedAction = new vscode.CodeAction('闭合标签', vscode.CodeActionKind.QuickFix);
      closedAction.edit = new vscode.WorkspaceEdit();
      closedAction.edit.replace(document.uri, item.range, `${(item.code as string).replace('\\<', '<').replace('\\>', '>')}</${match[1]}>`);
      actions.push(closedAction);
    }
  });

  return actions;
}
