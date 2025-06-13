import * as vscode from 'vscode';
import { lint } from 'markdownlint/async';
import { LintResults } from 'markdownlint';

import mdLintConfig from '../../config/markdownlint.js';
import { isConfigEnabled } from '../../utils/common.js';

const parseLintResult = (result: LintResults): vscode.Diagnostic[] => {
  const diagnostics: vscode.Diagnostic[] = [];

  // 遍历每个文件的结果
  Object.keys(result).forEach((file) => {
    const fileResults = result[file];

    // 遍历每个问题
    fileResults.forEach((issue) => {
      const range = new vscode.Range(new vscode.Position(issue.lineNumber - 1, 0), new vscode.Position(issue.lineNumber - 1, Number.MAX_SAFE_INTEGER));

      const diagnostic = new vscode.Diagnostic(
        range,
        `${issue.ruleDescription} (${issue.ruleNames.join(', ')})${issue.errorDetail ? `\n${issue.errorDetail}` : ''}`,
        vscode.DiagnosticSeverity.Warning
      );

      diagnostic.code = issue.ruleNames.join(',');
      diagnostic.source = 'markdown-lint';

      diagnostics.push(diagnostic);
    });
  });

  return diagnostics;
};

export function lintMarkdown(document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.markdown.lint')) {
    return Promise.resolve([]);
  }

  const filePath = document.fileName;

  // 读取文件内容
  const content = document.getText();

  // 加载配置
  const options = {
    strings: { [filePath]: content },
    config: mdLintConfig,
  };

  return new Promise<vscode.Diagnostic[]>((resolve) => {
    lint(options, (err, result) => {
      if (err) {
        vscode.window.showErrorMessage(`Markdownlint执行错误: ${err.message}`);
        resolve([]);
        return;
      }

      if (result) {
        // 解析结果并显示诊断信息
        resolve(parseLintResult(result));
        return;
      }

      resolve([]);
    });
  });
}
