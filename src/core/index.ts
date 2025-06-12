import * as vscode from 'vscode';
import { lintMarkdown } from './lint-markdown.js';
import { checkTagClosed, getTagClosedCodeActions } from './check-tag-closed.js';
import { checkCodespell, getCodespellActions } from './check-codespell.js';
import { checkResourceExistence } from './check-resource-existence.js';
import { checkLinkValidity } from './check-link-validity.js';

export async function checkMarkdown(document: vscode.TextDocument, diagnosticsCollection: vscode.DiagnosticCollection) {
  // 先执行不怎么耗时的检查
  const diagnostics: vscode.Diagnostic[] = [...(await checkTagClosed(document)), ...(await checkCodespell(document)), ...(await lintMarkdown(document))];
  diagnosticsCollection.delete(document.uri);
  diagnosticsCollection.set(document.uri, diagnostics);

  // 耗时久的另外执行
  const diagnosticsLong = [...(await checkResourceExistence(document)), ...(await checkLinkValidity(document))];
  if (diagnosticsLong.length > 0) {
    diagnostics.push(...diagnosticsLong);
    diagnosticsCollection.set(document.uri, diagnostics);
  }
}

export function getCodeActions(document: vscode.TextDocument, context: vscode.CodeActionContext) {
  const actions: vscode.CodeAction[] = [...getCodespellActions(document, context), ...getTagClosedCodeActions(document, context)];
  return actions;
}
