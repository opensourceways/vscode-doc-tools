import * as vscode from 'vscode';
import { type Configuration, type LintError } from 'markdownlint';
import { DEFAULT_MD_CONFIG, execMarkdownlint, MARKDOWNLINT } from 'checkers';

import { isConfigEnabled } from '@/utils/common';

export const lintHistory = new Map<string, LintError[]>();

/**
 * 执行 markdownlint
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function markdownlint(document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.markdownlint')) {
    return Promise.resolve([]);
  }

  const settingConfig = vscode.workspace.getConfiguration('docTools.markdownlint').get<Configuration>('config', {});
  const config = Object.keys(settingConfig).length > 0 ? settingConfig : DEFAULT_MD_CONFIG;
  const [results, error] = await execMarkdownlint(document.getText(), config);
  lintHistory.set(document.uri.fsPath, error);

  return results.map((item) => {
    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, item.message.zh, vscode.DiagnosticSeverity.Warning);
    diagnostic.code = item.extras;
    diagnostic.source = MARKDOWNLINT;

    return diagnostic;
  });
}

/**
 * 获取 markdownlint 的 action
 * @param {vscode.CodeActionContext} context code action 上下文
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.CodeAction[]} 返回可以执行的 action
 */
export function getMarkdownlintCodeActions(context: vscode.CodeActionContext, document: vscode.TextDocument) {
  const actions: vscode.CodeAction[] = [];
  if (!isConfigEnabled('docTools.markdownlint')) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== MARKDOWNLINT || !String(item.code).includes('fixable')) {
      return;
    }

    const action = new vscode.CodeAction('修复 markdown-lint 错误', vscode.CodeActionKind.QuickFix);
    action.command = {
      command: 'doc.tools.markdownlint.fix',
      title: '修复 markdown-lint 错误',
      arguments: [document],
    };
    actions.push(action);
  });

  return actions;
}
