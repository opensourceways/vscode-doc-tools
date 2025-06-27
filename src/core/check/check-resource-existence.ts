import * as vscode from 'vscode';

import { isConfigEnabled, isValidLink } from '@/utils/common';
import { geFilterMdContent } from '@/utils/markdwon';

const REGEX = [
  /!\[.*?\]\((.*?)\)/g, // 提取 ![xxx](xxx) 语法的链接
  /<img\s+[^>]*src="([^"]+)"[^>]*>/gi, // 提取 img 标签的链接
  /<image\s+[^>]*src="([^"]+)"[^>]*>/gi, // 提取 image 标签的链接
  /<video\s+[^>]*src="([^"]+)"[^>]*>/gi, // 提取 video 标签的链接
];

/**
 * 提取链接
 * @param text 文本
 * @returns 返回提取的链接数组
 */
function extractLinks(text: string) {
  const links: { link: string; startPos: number; endPos: number }[] = [];
  for (const reg of REGEX) {
    for (const match of text.matchAll(reg)) {
      if (!match[1]) {
        continue;
      }

      const link = match[1];
      const startPos = match.index + match[0].indexOf(link);
      const endPos = startPos + link.length;

      links.push({
        link,
        startPos,
        endPos,
      });
    }
  }

  return links;
}

/**
 * 检查资源链接有效性
 * @param document 文档对象
 * @returns 返回错误 Diagnostic 提示数组
 */
export async function checkResourceExistence(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  if (!isConfigEnabled('docTools.check.resourceExistence')) {
    return diagnostics;
  }

  const text = geFilterMdContent(document.getText());
  for (const item of extractLinks(text)) {
    if (await isValidLink(item.link, document)) {
      continue;
    }

    const range = new vscode.Range(document.positionAt(item.startPos), document.positionAt(item.endPos));
    const diagnostic = new vscode.Diagnostic(range, `Non-existent resource: ${item.link}`, vscode.DiagnosticSeverity.Warning);
    diagnostic.source = 'resource-existence-check';
    diagnostics.push(diagnostic);
  }

  return diagnostics;
}
