import * as vscode from 'vscode';
import path from 'path';
import { execTocCheck, TOC_CHECK } from 'checkers';

import { isConfigEnabled } from '@/utils/common';

/**
 * 检查 _toc.yaml
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkToc(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  if (!isConfigEnabled('docTools.check.toc')) {
    return diagnostics;
  }

  const results = await execTocCheck(document.getText(), path.dirname(document.uri.fsPath));

  return results.map((item) => {
    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, item.message.zh, vscode.DiagnosticSeverity.Error);
    diagnostic.source = TOC_CHECK;

    return diagnostic;
  });
}
