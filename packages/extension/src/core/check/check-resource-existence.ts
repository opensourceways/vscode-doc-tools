import * as vscode from 'vscode';
import path from 'path';

import { isConfigEnabled } from '@/utils/common';
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
 * @param {string} text 文本
 * @returns {{ link: string; startPos: number; endPos: number }[]} 返回提取的链接数组
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
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkResourceExistence(content: string, document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  if (!isConfigEnabled('docTools.check.resourceExistence')) {
    return diagnostics;
  }

  const whiteList = vscode.workspace.getConfiguration('docTools.check.url').get<string[]>('whiteList', []);
  const allWhiteList = Array.isArray(whiteList) ? [...whiteList, ...defaultWhitelistUrls] : defaultWhitelistUrls;
  for (const item of extractLinks(content)) {
    const result = await isAccessibleLink(item.link, path.dirname(document.uri.fsPath), allWhiteList);
    if (result !== 'notFound') {
      continue;
    }

    const range = new vscode.Range(document.positionAt(item.startPos), document.positionAt(item.endPos));
    if (result === 'notFound') {
      const diagnostic = new vscode.Diagnostic(range, `资源链接无法访问 (Non-existent resource): ${item.link}`, vscode.DiagnosticSeverity.Error);
      diagnostic.source = 'resource-existence-check';
      diagnostics.push(diagnostic);
    } else {
      const diagnostic = new vscode.Diagnostic(range, `访问超时 (Non-existent resource): ${item.link}`, vscode.DiagnosticSeverity.Warning);
      diagnostic.source = 'resource-existence-check';
      diagnostics.push(diagnostic);
    }
  }

  return diagnostics;
}

/**
 * 获取资源链接有效性错误可执行的 action
 * @param {vscode.CodeActionContext} context code action 上下文
 * @returns {vscode.CodeAction[]} 返回可以执行的 action
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

    const link = item.message.split(': ')[1];
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
