import * as vscode from 'vscode';
import lintMarkdown from './lint-markdown.js';
import lintTagClosed from './lint-tag-closed.js';

export default async function lint(document: vscode.TextDocument, diagnosticsCollection: vscode.DiagnosticCollection) {
  const diagnostics: vscode.Diagnostic[] = [
    ...(await lintMarkdown(document)),
    ...lintTagClosed(document),
  ];

  diagnosticsCollection.delete(document.uri);
  diagnosticsCollection.set(document.uri, diagnostics);
}
