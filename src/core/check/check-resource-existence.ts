import * as vscode from 'vscode';
import path from 'path';

import { isConfigEnabled } from '@/utils/common';
import { geFilterMdContent } from '@/utils/markdwon';
import { isAccessibleLink } from '@/utils/request';

import defaultWhitelistUrls from '@/config/whitelist-urls';

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

  const whiteList = vscode.workspace.getConfiguration('docTools.check.url').get<string[]>('whiteList', []);
  const allWhiteList = Array.isArray(whiteList) ? [...whiteList, ...defaultWhitelistUrls] : defaultWhitelistUrls;
  const text = geFilterMdContent(document.getText());
  for (const item of extractLinks(text)) {
    if (await isAccessibleLink(item.link, path.dirname(document.uri.fsPath), allWhiteList)) {
      continue;
    }

    const range = new vscode.Range(document.positionAt(item.startPos), document.positionAt(item.endPos));
    const diagnostic = new vscode.Diagnostic(range, `Non-existent resource: ${item.link}`, vscode.DiagnosticSeverity.Warning);
    diagnostic.source = 'resource-existence-check';
    diagnostics.push(diagnostic);
  }

  return diagnostics;
}

/**
 * 获取资源链接有效性错误可执行的 action
 * @param context code action 上下文
 * @returns 返回可以执行的 action
 */
export function getResourceExistenceCodeActions(context: vscode.CodeActionContext) {
  const actions: vscode.CodeAction[] = [];
  if (!isConfigEnabled('docTools.check.resourceExistence')) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== 'resource-existence-check') {
      return;
    }

    const link = item.message.replace('Non-existent resource: ', '');
    if (!link.startsWith('http')) {
      return;
    }

    const whiteListAction = new vscode.CodeAction('添加地址白名单', vscode.CodeActionKind.QuickFix);
    whiteListAction.command = {
      command: 'doc.tools.url.add.whitelist',
      title: '添加地址白名单',
      arguments: [link],
    };
    actions.push(whiteListAction);
  });

  return actions;
}
