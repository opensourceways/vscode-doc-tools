import * as vscode from 'vscode';
import path from 'path';

import { isAccessibleLink } from '../utils/common.js';

function isValidLink(link: string, document: vscode.TextDocument) {
  return isAccessibleLink(link.startsWith('http') ? link : path.join(path.dirname(document.uri.fsPath), link));
}

export async function lintImgLink(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();

  // 提取 Markdown 图片语法中的链接
  const markdownRegex = /!\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = markdownRegex.exec(text)) !== null) {
    const link = match[1];
    if (link && !(await isValidLink(link, document))) {
      const range = new vscode.Range(
        document.positionAt(match.index + match[0].indexOf(link)),
        document.positionAt(match.index + match[0].indexOf(link) + link.length)
      );
      const diagnostic = new vscode.Diagnostic(range, `Invalid image link: ${link}`, vscode.DiagnosticSeverity.Warning);
      diagnostic.source = 'img-link-lint';
      diagnostics.push(diagnostic);
    }
  }

  // 提取 HTML <img> 标签中的链接
  const htmlRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi;
  while ((match = htmlRegex.exec(text)) !== null) {
    const link = match[1];
    if (link && !(await isValidLink(link, document))) {
      const range = new vscode.Range(
        document.positionAt(match.index + match[0].indexOf(link)),
        document.positionAt(match.index + match[0].indexOf(link) + link.length)
      );
      const diagnostic = new vscode.Diagnostic(range, `Invalid image link: ${link}`, vscode.DiagnosticSeverity.Warning);
      diagnostic.source = 'img-link-lint';
      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}
