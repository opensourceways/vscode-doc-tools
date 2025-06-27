import * as vscode from 'vscode';
import { spellCheckDocument } from 'cspell-lib';

import ignoreWords from '@/config/ignore-words';
import { isConfigEnabled } from '@/utils/common';

const wordsMap = new Map<string, string[]>();

export async function checkCodespell(document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.codespell')) {
    return [];
  }

  const text = document.getText();
  const whiteList = vscode.workspace.getConfiguration('docTools.check.codespell').get<string[]>('whiteList', []);
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
      words: Array.isArray(whiteList) ? [...whiteList, ...ignoreWords] : ignoreWords,
      suggestionsTimeout: 2000,
      ignoreRegExpList: ['/\\[.*?\\]\\(.*?\\)/g', '/<[^>]*?>/g', '```[\s\S]*?```|`[^`]*`'],
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
  if (!isConfigEnabled('docTools.check.codespell')) {
    return actions;
  }

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

    const whiteListAction = new vscode.CodeAction('加入白名单', vscode.CodeActionKind.QuickFix);
    whiteListAction.command = {
      command: 'doc.tools.codespell.add.whitelist',
      title: '加入白名单',
      arguments: [item.code]
    };
    actions.push(whiteListAction);
  });

  return actions;
}
