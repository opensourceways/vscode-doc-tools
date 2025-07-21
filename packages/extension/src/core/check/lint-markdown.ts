import * as vscode from 'vscode';
import { lint } from 'markdownlint/async';
import { type Configuration, type LintError, type LintResults } from 'markdownlint';

import { MD_DEFAULT_CONFIG, MD_DESC } from '@/config/markdownlint';
import { isConfigEnabled } from '@/utils/common';

export const lintHistory = new Map<string, LintError[]>();

/**
 * 转换 markdownlint 执行结果
 * @param {LintResults} result markdownlint 执行结果
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
function parseLintResult(result: LintResults) {
  const diagnostics: vscode.Diagnostic[] = [];

  // 遍历每个文件的结果
  Object.keys(result).forEach((file) => {
    const fileResults = result[file];

    // 遍历每个问题
    fileResults.forEach((issue) => {
      const range = new vscode.Range(new vscode.Position(issue.lineNumber - 1, 0), new vscode.Position(issue.lineNumber - 1, Number.MAX_SAFE_INTEGER));
      let message = `${issue.ruleDescription}${issue.errorDetail ? `. ${issue.errorDetail}` : ''}${
        MD_DESC[issue.ruleNames[0]] ? `\n${MD_DESC[issue.ruleNames[0]]}` : ''
      }`;

      if (typeof issue.errorDetail === 'string' && typeof MD_DESC[issue.ruleNames[0]] === 'string') {
        const zhDetail = issue.errorDetail.replace('Expected: ', '期望：').replace('; Actual: ', '；当前：');
        message = message.replace('{expected_actual}', zhDetail);
      }

      const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning);
      diagnostic.code = issue.ruleNames.join(',') + (issue.fixInfo ? ',fixable' : '');
      diagnostic.source = 'markdown-lint';
      diagnostics.push(diagnostic);
    });
  });

  return diagnostics;
}

/**
 * 执行 markdownlint
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export function lintMarkdown(document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.markdownlint')) {
    return Promise.resolve([]);
  }

  const filePath = document.uri.fsPath;

  // 读取文件内容
  const content = document.getText();

  // 加载配置
  const settingConfig = vscode.workspace.getConfiguration('docTools.markdownlint').get<Configuration>('config', {});
  const options = {
    strings: { [filePath]: content },
    config: Object.keys(settingConfig).length > 0 ? settingConfig : MD_DEFAULT_CONFIG,
    resultVersion: 3,
  };

  return new Promise<vscode.Diagnostic[]>((resolve) => {
    lint(options, (err, result) => {
      if (err) {
        vscode.window.showErrorMessage(`Markdownlint执行错误: ${err.message}`);
        resolve([]);
        return;
      }

      if (result) {
        lintHistory.set(filePath, result[filePath]);
        resolve(parseLintResult(result));
        return;
      }

      resolve([]);
    });
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
    if (item.source !== 'markdown-lint' || !String(item.code).includes('fixable')) {
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
