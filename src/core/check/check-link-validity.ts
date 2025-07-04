import * as vscode from 'vscode';
import path from 'path';

import { isConfigEnabled } from '@/utils/common';
import { geFilterMdContent } from '@/utils/markdwon';
import { isAccessibleLink } from '@/utils/request';

import defaultWhitelistUrls from '@/config/whitelist-urls';

const REGEX = [
  /(?<!\!)\[.*?\]\((.+?)\)/g, // 匹配 [xx](xxx) 链接
  /<(http[^>]+)>/g, // 匹配 <链接地址> 格式的链接
  /<a[^>]*href=["']([^"]+?)["'][^>]*>/gi, // 匹配 <a> 标签链接
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
 * 检查链接有效性
 * @param document 文档对象
 * @returns 返回错误 Diagnostic 提示数组
 */
export async function checkLinkValidity(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  if (!isConfigEnabled('docTools.check.linkValidity')) {
    return diagnostics;
  }

  const whiteList = vscode.workspace.getConfiguration('docTools.check.url').get<string[]>('whiteList', []);
  const allWhiteList = Array.isArray(whiteList) ? [...whiteList, ...defaultWhitelistUrls] : defaultWhitelistUrls;
  const text = geFilterMdContent(document.getText());
  const links = extractLinks(text);
  for (const item of links) {
    // 跳过锚点
    if (item.link.startsWith('#')) {
      continue;
    }

    // 去除锚点
    if (item.link.includes('#')) {
      item.link = item.link.split('#')[0];
    }

    if (await isAccessibleLink(item.link, path.dirname(document.uri.fsPath), allWhiteList)) {
      continue;
    }

    const range = new vscode.Range(document.positionAt(item.startPos), document.positionAt(item.endPos));
    const diagnostic = new vscode.Diagnostic(range, `Invalid link: ${item.link}`, vscode.DiagnosticSeverity.Warning);
    diagnostic.source = 'link-validity-check';
    diagnostics.push(diagnostic);
  }

  return diagnostics;
}

/**
 * 获取链接有效性错误可执行的 action
 * @param context code action 上下文
 * @returns 返回可以执行的 action
 */
export function getLinkValidityCodeActions(context: vscode.CodeActionContext) {
  const actions: vscode.CodeAction[] = [];
  if (!isConfigEnabled('docTools.check.linkValidity')) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== 'link-validity-check') {
      return;
    }

    const link = item.message.replace('Invalid link: ', '');
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
