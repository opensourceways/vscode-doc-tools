import * as vscode from 'vscode';

import { isConfigEnabled } from '@/utils/common';
import { execPunctuationMixingCheck } from 'checkers';

/**
 * 检查中英文标点符号是否混用
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkPunctuationMixing(content: string, document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.punctuationMixing')) {
    return [];
  }

  return execPunctuationMixingCheck(content).map((item) => {
    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, item.message, vscode.DiagnosticSeverity.Information);
    diagnostic.code = item.content;
    diagnostic.source = 'punctuation-mixing-check';
    return diagnostic;
  });
}
