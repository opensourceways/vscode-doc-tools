import * as vscode from 'vscode';
import yaml from 'js-yaml';

import { TocItem } from '../../@types/toc.js';
import { isValidLink } from '../../utils/common.js';

function flatItemUrl(item: TocItem, links = new Set<string>()) {
  if (typeof item.href === 'string') {
    links.add(item.href);
  } else if (typeof item.href?.upstream === 'string') {
    links.add(item.href.upstream);
  }

  if (Array.isArray(item.sections)) {
    item.sections.forEach((el) => {
      flatItemUrl(el, links);
    });
  }

  return links;
}

function collectInvalidLinkDiagnostics(document: vscode.TextDocument, link: string) {
  const diagnostics: vscode.Diagnostic[] = [];
  for (const match of document.getText().matchAll(new RegExp(link, 'g'))) {
    const range = new vscode.Range(
      document.positionAt(match.index).line,
      document.positionAt(match.index).character,
      document.positionAt(match.index + match[0].length).line,
      document.positionAt(match.index + match[0].length).character
    );
    const diagnostic = new vscode.Diagnostic(range, `Non-existent doc in toc: ${link}.`, vscode.DiagnosticSeverity.Error);
    diagnostic.source = 'toc-check';
    diagnostics.push(diagnostic);
  }

  return diagnostics;
}

export async function checkToc(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];

  try {
    const obj = yaml.load(document.getText()) as TocItem;
    const links = flatItemUrl(obj);

    for (const link of links) {
      const valid = await isValidLink(link, document);
      if (!valid) {
        diagnostics.push(...collectInvalidLinkDiagnostics(document, link));
      }
    }
  } catch (err: any) {
    if (err?.mark) {
      const range = new vscode.Range(
        new vscode.Position(err.mark.line, err.mark.column),
        new vscode.Position(err.mark.line, document.lineAt(err.mark.line).text.length)
      );

      const diagnostic = new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error);
      diagnostic.source = 'toc-check';
      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}
