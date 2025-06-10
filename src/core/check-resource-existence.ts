import * as vscode from 'vscode';
import path from 'path';

import { isAccessibleLink } from '../utils/common.js';

function isValidLink(link: string, document: vscode.TextDocument) {
  return isAccessibleLink(link.startsWith('http') ? link : path.join(path.dirname(document.uri.fsPath), link));
}

export async function checkResourceExistence(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();

  // 提取 Markdown 图片语法中的链接
  const REGEX_MARKDOWN_PIC = /!\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = REGEX_MARKDOWN_PIC.exec(text)) !== null) {
    const link = match[1];
    if (link && !(await isValidLink(link, document))) {
      const range = new vscode.Range(
        document.positionAt(match.index + match[0].indexOf(link)),
        document.positionAt(match.index + match[0].indexOf(link) + link.length)
      );
      const diagnostic = new vscode.Diagnostic(range, `Non-existent resource: ${link}`, vscode.DiagnosticSeverity.Warning);
      diagnostic.source = 'resource-existence-check';
      diagnostics.push(diagnostic);
    }
  }

  // 提取 HTML <img> 标签中的链接
  const REGEX_IMG = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi;
  while ((match = REGEX_IMG.exec(text)) !== null) {
    const link = match[1];
    if (link && !(await isValidLink(link, document))) {
      const range = new vscode.Range(
        document.positionAt(match.index + match[0].indexOf(link)),
        document.positionAt(match.index + match[0].indexOf(link) + link.length)
      );
      const diagnostic = new vscode.Diagnostic(range, `Non-existent resource: ${link}`, vscode.DiagnosticSeverity.Warning);
      diagnostic.source = 'resource-existence-check';
      diagnostics.push(diagnostic);
    }
  }

  // 提取html <video>标签中的链接，使用/g进行匹配，每次匹配lastIndex更新，直至循环终止
  const REGEX_VIDEO = /<video\s+[^>]*src="([^"]+)"[^>]*>/gi;
  while ((match = REGEX_VIDEO.exec(text)) !== null) {
    const link = match[1];
    if (link && !(await isValidLink(link, document))) {
      const range = new vscode.Range(
        document.positionAt(match.index + match[0].indexOf(link)),
        document.positionAt(match.index + match[0].indexOf(link) + link.length)
      );
      const diagnostic = new vscode.Diagnostic(range, `Non-existent resource: ${link}`, vscode.DiagnosticSeverity.Warning);
      diagnostic.source = 'resource-existence-check';
      diagnostics.push(diagnostic);
    }
  }
  return diagnostics;
}
