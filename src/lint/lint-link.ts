import * as vscode from 'vscode';

async function isLinkValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    return false;
  }
}

function extractLinks(text: string): { url: string; position: vscode.Position }[] {
  const markdownLinkRegex = /!?\[.*?\]\((http[^)]+)\)/g; // 匹配普通链接
  const aTagRegex = /<a[^>]*href=["'](http[^"]+)["'][^>]*>/g; // 匹配 <a> 标签链接
  const angleBracketRegex = /<(http[^>]+)>/g; // 匹配 <链接地址> 格式的链接
  const links: { url: string; position: vscode.Position }[] = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let offset = 0;

    // 匹配普通链接
    let match;
    while ((match = markdownLinkRegex.exec(line)) !== null) {
      const url = match[1];
      console.log(match[0])
      if (!match[0].startsWith('!')) {
        const position = new vscode.Position(i, match.index + offset);
        links.push({ url, position });
        offset += match[0].length;
      }
    }

    // 匹配 <a> 标签链接
    offset = 0;
    while ((match = aTagRegex.exec(line)) !== null) {
      const url = match[1];
      const position = new vscode.Position(i, match.index + offset);
      links.push({ url, position });
      offset += match[0].length;
    }

    // 匹配 <链接地址> 格式的链接
    offset = 0;
    while ((match = angleBracketRegex.exec(line)) !== null) {
      const url = match[1];
      const position = new vscode.Position(i, match.index + offset);
      links.push({ url, position });
      offset += match[0].length;
    }
  }

  return links;
}

export default async function lintImgLink(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();
  const links = extractLinks(text);

  for (const link of links) {
    const valid = await isLinkValid(link.url);
    if (!valid) {
      const range = new vscode.Range(link.position, link.position.translate(0, link.url.length));
      const diagnostic = new vscode.Diagnostic(range, `Invalid link: ${link.url}`, vscode.DiagnosticSeverity.Error);
      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}
