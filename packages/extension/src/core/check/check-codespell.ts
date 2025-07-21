import * as vscode from 'vscode';
import { spellCheckDocument } from 'cspell-lib';

import defaultWhitelistWords from '@/config/whitelist-words';
import { isConfigEnabled } from '@/utils/common';

// 错误单词提示记录
const wordsMap = new Map<string, string[]>();

/**
 * codespell 检查
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkCodespell(content: string, document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.codespell')) {
    return [];
  }

  const whiteList = vscode.workspace.getConfiguration('docTools.check.codespell').get<string[]>('whiteList', []);
  const result = await spellCheckDocument(
    {
      uri: 'text.txt',
      text: content,
      languageId: 'markdown',
      locale: 'en, en-US',
    },
    {
      generateSuggestions: true,
      noConfigSearch: true,
    },
    {
      allowCompoundWords: true,
      words: Array.isArray(whiteList) ? [...whiteList, ...defaultWhitelistWords] : defaultWhitelistWords,
      suggestionsTimeout: 2000,
      ignoreRegExpList: [
        '/\\[.*?\\]\\(.*?\\)/g', // 匹配Markdown链接语法：[文本](URL)
        '/<[^>]*?>/g',  // 匹配HTML标签：<tag>content</tag> 或 <tag/>
        '[\\u4e00-\\u9fa5]',  // 匹配中文字符
      ],
    }
  );

  const diagnostics: vscode.Diagnostic[] = [];
  result.issues.forEach((issue: any) => {
    if (Array.isArray(issue.suggestions)) {
      wordsMap.set(issue.text, issue.suggestions);
    }

    const start = document.positionAt(issue.offset);
    const end = document.positionAt(issue.offset + issue.text.length);
    const range = new vscode.Range(start, end);
    const diagnostic = new vscode.Diagnostic(range, `单词拼写错误 (CodeSpell warning): ${issue.text}`, vscode.DiagnosticSeverity.Information);
    diagnostic.source = 'codespell-check';
    diagnostic.code = issue.text;
    diagnostics.push(diagnostic);
  });

  return diagnostics;
}

/**
 * 获取 codespell 可执行的 action
 * @param {vscode.CodeActionContext} context code action 上下文
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.CodeAction[]} 返回可以执行的 action
 */
export function getCodespellCodeActions(context: vscode.CodeActionContext, document: vscode.TextDocument) {
  const actions: vscode.CodeAction[] = [];
  if (!isConfigEnabled('docTools.check.codespell')) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== 'codespell-check') {
      return;
    }

    const suggestions = wordsMap.get(item.code as string);
    if (!Array.isArray(suggestions)) {
      return;
    }

    suggestions.forEach((word) => {
      const action = new vscode.CodeAction(word, vscode.CodeActionKind.QuickFix);
      action.edit = new vscode.WorkspaceEdit();
      action.edit.replace(document.uri, item.range, word);
      actions.push(action);
    });

    const whiteListAction = new vscode.CodeAction('添加单词白名单', vscode.CodeActionKind.QuickFix);
    whiteListAction.command = {
      command: 'doc.tools.codespell.add.whitelist',
      title: '添加单词白名单',
      arguments: [item.code],
    };
    actions.push(whiteListAction);
  });

  return actions;
}
