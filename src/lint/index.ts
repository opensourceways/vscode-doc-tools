import * as vscode from 'vscode';
import { lintMarkdown } from './lint-markdown.js';
import { lintTagClosed, getTagClosedCodeActions } from './lint-tag-closed.js';
import { lintSpelling, getSpellingCodeActions } from './lint-spelling.js';
import { lintImgLink } from './lint-img-link.js';
import { lintLink } from './lint-link.js';

import type { EVENT_TYPE } from '../@types/event.js';

export async function lint(opts: {
  document: vscode.TextDocument;
  diagnosticsCollection: vscode.DiagnosticCollection;
  eventType: EVENT_TYPE;
  contentChanged?: (readonly vscode.TextDocumentContentChangeEvent[])[];
}) {
  // 先执行不怎么耗时的检查
  const { document, diagnosticsCollection } = opts;
  const diagnostics: vscode.Diagnostic[] = [...(await lintTagClosed(document)), ...(await lintSpelling(document)), ...(await lintMarkdown(document))];
  diagnosticsCollection.delete(document.uri);
  diagnosticsCollection.set(document.uri, diagnostics);

  // 耗时久的另外执行
  const diagnosticsLong = [...(await lintImgLink(document)), ...(await lintLink(document))];
  if (diagnosticsLong.length > 0) {
    diagnostics.push(...diagnosticsLong);
    diagnosticsCollection.set(document.uri, diagnostics);
  }
}

export function getCodeActions(document: vscode.TextDocument, context: vscode.CodeActionContext) {
  const actions: vscode.CodeAction[] = [...getSpellingCodeActions(document, context), ...getTagClosedCodeActions(document, context)];
  return actions;
}
