import * as vscode from 'vscode';

import { isAccessibleLink } from '../utils/common.js';

function extractLinks(text: string): { url: string; position: vscode.Position }[] {
  const REGEX_MD_LINK = /!?\[.*?\]\((http[^)]+)\)/g; // 匹配普通链接
  const REGEX_MD_LINK2 = /<(http[^>]+)>/g; // 匹配 <链接地址> 格式的链接
  const REGEX_A_TAG = /<a[^>]*href=["'](http[^"]+)["'][^>]*>/g; // 匹配 <a> 标签链接
  const links: { url: string; position: vscode.Position }[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let offset = 0;
    let match;

    // 匹配普通链接
    while ((match = REGEX_MD_LINK.exec(line)) !== null) {
      const url = match[1];
      if (!match[0].startsWith('!')) {
        const startIndex = line.indexOf(match[0], offset);
        const urlIndex = match[0].indexOf(url);
        const position = new vscode.Position(i, startIndex + urlIndex);
        links.push({ url, position });
        offset = startIndex + match[0].length;
      }
    }

    // 匹配 <a> 标签链接
    offset = 0;
    while ((match = REGEX_A_TAG.exec(line)) !== null) {
      const url = match[1];
      const startIndex = line.indexOf(match[0], offset);
      const urlIndex = match[0].indexOf(url);
      const position = new vscode.Position(i, startIndex + urlIndex);
      links.push({ url, position });
      offset = startIndex + match[0].length;
    }

    // 匹配 <链接地址> 格式的链接
    offset = 0;
    while ((match = REGEX_MD_LINK2.exec(line)) !== null) {
      const url = match[1];
      const startIndex = line.indexOf(match[0], offset);
      const urlIndex = match[0].indexOf(url);
      const position = new vscode.Position(i, startIndex + urlIndex);
      links.push({ url, position });
      offset = startIndex + match[0].length;
    }
  }

  return links;
}

export async function checkLinkValidity(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();
  const links = extractLinks(text);

  for (const link of links) {
    const valid = await isAccessibleLink(link.url);
    if (!valid) {
      const range = new vscode.Range(link.position, link.position.translate(0, link.url.length));
      const diagnostic = new vscode.Diagnostic(range, `Invalid link: ${link.url}`, vscode.DiagnosticSeverity.Warning);
      diagnostic.source = 'link-validity-check';
      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}
