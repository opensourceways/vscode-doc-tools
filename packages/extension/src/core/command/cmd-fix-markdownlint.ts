import * as vscode from 'vscode';
import { applyFixes } from 'markdownlint';

import { lintHistory } from '@/core/check/markdownlint';

/**
 * 修复所有 markdown-lint 错误
 * @param {vscode.TextDocument} document 文档对象
 */
export function fixMarkdownlint(document: vscode.TextDocument) {
  if (!document) {
    return;
  }

  const errs = lintHistory.get(document.uri.fsPath);
  if (!errs) {
    return;
  }

  const editor = vscode.window.visibleTextEditors.find((e) => e.document.uri.fsPath === document.uri.fsPath);
  if (!editor) {
    return;
  }

  editor.edit((editBuilder) => {
    const fullRange = new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length));
    editBuilder.replace(fullRange, applyFixes(document.getText(), errs));
  });
}
