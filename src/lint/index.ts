import * as vscode from 'vscode';
import lintMarkdown from './lint-markdown.js';
import lintTagClosed from './lint-tag-closed.js';
import lintImgLink from './lint-img-link.js';

export default async function lint(document: vscode.TextDocument, diagnosticsCollection: vscode.DiagnosticCollection) {
  const diagnostics: vscode.Diagnostic[] = [
    ...(await lintMarkdown(document)),
    ...lintTagClosed(document),
    ...lintImgLink(document),
  ];

  diagnosticsCollection.delete(document.uri);
  diagnosticsCollection.set(document.uri, diagnostics);
}
