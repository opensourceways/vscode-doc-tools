import * as vscode from 'vscode';
import { spellCheckDocument } from 'cspell-lib';

import ignoreWords from '../config/ignore-words.js';

const wordsMap = new Map<string, string[]>();

export async function checkCodespell(document: vscode.TextDocument) {
  const text = document.getText();

  const result = await spellCheckDocument(
    {
      uri: 'text.txt',
      text,
      languageId: 'markdown',
      locale: 'en, en-US',
    },
    {
      generateSuggestions: true,
      noConfigSearch: true,
    },
    {
      words: ignoreWords,
      suggestionsTimeout: 2000,
      ignoreRegExpList: ['/\\[.*?\\]\\(.*?\\)/g', '/<[^>]*?>/g'],
    }
  );

  const diagnostics: vscode.Diagnostic[] = [];
  result.issues.forEach((issue) => {
    if (Array.isArray(issue.suggestions)) {
      wordsMap.set(issue.text, issue.suggestions);
    }

    const start = document.positionAt(issue.offset);
    const end = document.positionAt(issue.offset + issue.text.length);
    const range = new vscode.Range(start, end);
    const diagnostic = new vscode.Diagnostic(range, `CodeSpell warning: ${issue.text}`, vscode.DiagnosticSeverity.Information);
    diagnostic.source = 'codespell-check';
    diagnostic.code = issue.text;
    diagnostics.push(diagnostic);
  });

  return diagnostics;
}

export function getCodespellActions(document: vscode.TextDocument, context: vscode.CodeActionContext) {
  const actions: vscode.CodeAction[] = [];

  context.diagnostics.forEach((item) => {
    if (item.source !== 'codespell-check') {
      return;
    }

    const suggestions = wordsMap.get(item.code as string);
    if (!Array.isArray(suggestions)) {
      return;
    }

    suggestions.forEach((word) => {
      const action = new vscode.CodeAction(word, vscode.CodeActionKind.QuickFix);
      action.edit = new vscode.WorkspaceEdit();
      action.edit.replace(document.uri, item.range, word);

      actions.push(action);
    });
  });

  return actions;
}
