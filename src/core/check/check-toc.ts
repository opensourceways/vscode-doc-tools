import * as vscode from 'vscode';
import yaml from 'js-yaml';

import { TocItem } from '@/@types/toc.js';
import { isConfigEnabled, isValidLink } from '@/utils/common';

const ALLOWED_KEYS = ['label', 'isManual', 'sections', 'href', 'upstream', 'path'];

function collectInvalidDiagnostics(document: vscode.TextDocument, text: string, message: string) {
  const diagnostics: vscode.Diagnostic[] = [];
  for (const match of document.getText().matchAll(new RegExp(text, 'g'))) {
    const range = new vscode.Range(
      document.positionAt(match.index).line,
      document.positionAt(match.index).character,
      document.positionAt(match.index + match[0].length).line,
      document.positionAt(match.index + match[0].length).character
    );
    const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
    diagnostic.source = 'toc-check';
    diagnostics.push(diagnostic);
  }

  return diagnostics;
}

async function walkToc(item: TocItem, document: vscode.TextDocument, diagnostics: vscode.Diagnostic[], handled = new Set<string>()) {
  // 检查 key
  for (const key of Object.keys(item)) {
    if (!ALLOWED_KEYS.includes(key) && !handled.has(`${key}:`)) {
      diagnostics.push(...collectInvalidDiagnostics(document, `${key}:`, `Not allowed key: ${key}.`));
      handled.add(`${key}:`);
    }
  }

  // 检查isManual，只能为 true 或 false
  if (item.isManual && typeof item.isManual !== 'boolean' && !handled.has(`isManual:\\s+${item.isManual}`)) {
    diagnostics.push(...collectInvalidDiagnostics(document, `isManual:\\s+${item.isManual}`, `Not allowed value: ${item.isManual}. The value of isManual can only be true or false.`));
    handled.add(`isManual:\\s+${item.isManual}`);
  }

  // 检查链接有效性
  if (item.href) {
    const url = typeof item.href === 'string' ? item.href : item.href.upstream;
    if (url && !handled.has(`href:\\s+${url}`)) {
      const valid = await isValidLink(url, document);
      if (!valid) {
        diagnostics.push(...collectInvalidDiagnostics(document, `href:\\s+${url}`, `Non-existent doc in toc: ${url}.`));
      }

      handled.add(`href:\\s+${url}`);
    }
  }

  // 继续递归遍历
  if (Array.isArray(item.sections)) {
    for (const child of item.sections) {
      await walkToc(child, document, diagnostics, handled);
    }
  }
}

export async function checkToc(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  if (!isConfigEnabled('docTools.check.toc')) {
    return diagnostics;
  }

  try {
    const obj = yaml.load(document.getText()) as TocItem;
    await walkToc(obj, document, diagnostics);
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
