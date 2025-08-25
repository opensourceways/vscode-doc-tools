import * as vscode from 'vscode';
import { execExtraBlankSpaceCheck } from 'checkers';

import { isConfigEnabled } from '@/utils/common';

/**
 * 启用中文文字之间无空格检查
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkExtraBlankSpace(content: string, document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.extraBlankSpace')) {
    return [];
  }

  return execExtraBlankSpaceCheck(content).map((item) => {
    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, item.message, vscode.DiagnosticSeverity.Information);
    diagnostic.code = item.content;
    diagnostic.source = 'extra-blank-space-check';
    return diagnostic;
  });
}
