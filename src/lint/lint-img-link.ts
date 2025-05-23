import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';

function isValidLocalLink(link: string, document: vscode.TextDocument) {
  return fs.existsSync(path.join(path.dirname(document.uri.fsPath), link));
}

export default function lintImgLink(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();

  // 提取 Markdown 图片语法中的链接
  const markdownRegex = /!\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = markdownRegex.exec(text)) !== null) {
    const link = match[1];
    if (link && !link.startsWith('http') && !isValidLocalLink(link, document)) {
      const range = new vscode.Range(
        document.positionAt(match.index + match[0].indexOf(link)),
        document.positionAt(match.index + match[0].indexOf(link) + link.length)
      );
      diagnostics.push(new vscode.Diagnostic(range, `Invalid image url: ${link}`, vscode.DiagnosticSeverity.Error));
    }
  }

  // 提取 HTML <img> 标签中的链接
  const htmlRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi;
  while ((match = htmlRegex.exec(text)) !== null) {
    const link = match[1];
    if (link && !link.startsWith('http') && !isValidLocalLink(link, document)) {
      const range = new vscode.Range(
        document.positionAt(match.index + match[0].indexOf(link)),
        document.positionAt(match.index + match[0].indexOf(link) + link.length)
      );
      diagnostics.push(new vscode.Diagnostic(range, `Invalid image url: ${link}`, vscode.DiagnosticSeverity.Error));
    }
  }

  return diagnostics;
}
