import * as vscode from 'vscode';
import { execPunctuationSpacesCheck, PUNCTUATION_SPACES_CHECK } from 'checkers';

import { isConfigEnabled } from '@/utils/common';

/**
 * 是否启用，过渡性配置，用于迁移配置项
 * @returns 是否启用
 */
function isEnabled() {
  if (isConfigEnabled('docTools.check.punctuationBlankSpace')) {
    vscode.workspace.getConfiguration('docTools.check.punctuationSpaces').update('enable', true, vscode.ConfigurationTarget.Global)
    vscode.workspace.getConfiguration('docTools.check.punctuationBlankSpace').update('enable', undefined, vscode.ConfigurationTarget.Global);
    return true;
  }

  return isConfigEnabled('docTools.check.punctuationSpaces');
}

/**
 * 检查中文标点符号前后是否有多余空格
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkPunctuationSpaces(content: string, document: vscode.TextDocument) {
  if (!isEnabled()) {
    return [];
  }

  return execPunctuationSpacesCheck(content).map((item) => {
    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, item.message.zh, vscode.DiagnosticSeverity.Information);
    diagnostic.source = PUNCTUATION_SPACES_CHECK;
    return diagnostic;
  });
}

/**
 * 获取中文标点符号前后是否有多余空格可执行的 action
 * @param {vscode.CodeActionContext} context code action 上下文
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.CodeAction[]} 返回可以执行的 action
 */
export function getPunctuationSpacesCodeActions(context: vscode.CodeActionContext, document: vscode.TextDocument) {
  const actions: vscode.CodeAction[] = [];
  if (!isEnabled()) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== PUNCTUATION_SPACES_CHECK) {
      return;
    }

    const escapeAction = new vscode.CodeAction('删除空格', vscode.CodeActionKind.QuickFix);
    escapeAction.edit = new vscode.WorkspaceEdit();
    escapeAction.edit.replace(document.uri, item.range, '');
    actions.push(escapeAction);
  });

  return actions;
}
