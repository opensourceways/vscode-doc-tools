import * as vscode from 'vscode';
import { hasChinese, SET_CHINESE_PUNCTUATION } from 'shared';

import { SearchResultT } from '@/@types/search';
import { isConfigEnabled } from '@/utils/common';

function searchPunctuationBlankSpace(content: string) {
  const result: SearchResultT[] = [];
  if (!hasChinese(content)) {
    return result;
  }

  for (let i = 0; i < content.length; i++) {

    if (content[i] === '\u200B' || !SET_CHINESE_PUNCTUATION.has(content[i]) ) {
      continue;
    }

    if (content[i + 1] === ' ' && content[i + 2] === '|') {
      continue;
    }

    if (content[i + 1] === ' ') {
      let start = i + 1;
      let end = i + 2;
      while (content[end] === ' ') {
        end++;
      }

      result.push({
        content: ' ',
        start,
        end,
      });
    }

    if (content[i - 1] === ' ') {
      let start = i - 1;
      let end = i;
      while (content[start - 1] === ' ') {
        start--;
      }

      result.push({
        content: ' ',
        start,
        end,
      });
    }
  }

  return result;
}

/**
 * 检查中文标点符号前后是否有多余空格
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkPunctuationBlankSpace(content: string, document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.punctuationBlankSpace')) {
    return [];
  }

  return searchPunctuationBlankSpace(content).map((item) => {
    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, `存在多余的空格 (Extra blank spaces)`, vscode.DiagnosticSeverity.Information);
    diagnostic.source = 'punctuation-blank-space-check';
    return diagnostic;
  });
}

/**
 * 获取标签不闭合可执行的 action
 * @param {vscode.CodeActionContext} context code action 上下文
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.CodeAction[]} 返回可以执行的 action
 */
export function getPunctuationBlankSpaceCodeActions(context: vscode.CodeActionContext, document: vscode.TextDocument) {
  const actions: vscode.CodeAction[] = [];
  if (!isConfigEnabled('docTools.check.punctuationBlankSpace')) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== 'punctuation-blank-space-check') {
      return;
    }

    const escapeAction = new vscode.CodeAction('删除空格', vscode.CodeActionKind.QuickFix);
    escapeAction.edit = new vscode.WorkspaceEdit();
    escapeAction.edit.replace(document.uri, item.range, '');
    actions.push(escapeAction);
  });

  return actions;
}
