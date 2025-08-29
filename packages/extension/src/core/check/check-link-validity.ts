import * as vscode from 'vscode';
import path from 'path';
import { execLinkValidityCheck, LINK_VALIDITY_CHECK } from 'checkers';

import defaultWhitelistUrls from '@/config/whitelist-urls';
import { isConfigEnabled } from '@/utils/common';

/**
 * 检查链接有效性
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkLinkValidity(content: string, document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.linkValidity')) {
    return [];
  }

  const whiteListConfig = vscode.workspace.getConfiguration('docTools.check.url').get<string[]>('whiteList', []);
  const whiteList = Array.isArray(whiteListConfig) ? [...whiteListConfig, ...defaultWhitelistUrls] : defaultWhitelistUrls;
  let results = await execLinkValidityCheck(content, {
    whiteList,
    prefixPath: path.dirname(document.uri.fsPath),
  });

  if (isConfigEnabled('docTools.check.linkValidity.only404')) {
    results = results.filter((item) => item.extras === 404);
  }

  return results.map((item) => {
    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, item.message.zh, item.type === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning);
    diagnostic.source = LINK_VALIDITY_CHECK;
    diagnostic.code = item.content;

    return diagnostic;
  });
}

/**
 * 获取链接有效性错误可执行的 action
 * @param {vscode.CodeActionContext} context code action 上下文
 * @returns {vscode.CodeAction[]} 返回可以执行的 action
 */
export function getLinkValidityCodeActions(context: vscode.CodeActionContext) {
  const actions: vscode.CodeAction[] = [];
  if (!isConfigEnabled('docTools.check.linkValidity')) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== LINK_VALIDITY_CHECK) {
      return;
    }

    const link = item.code as string;
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
