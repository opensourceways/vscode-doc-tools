import * as vscode from 'vscode';
import { SET_CHINESE_PUNCTUATION, SET_ENGLISH_PUNCTUATION, getMarkdownFilterContent, hasChinese, isDigit, isEnglishLetter, isPunctuation } from 'shared';

import { isConfigEnabled } from '@/utils/common';
import { SearchResultT } from '@/@types/search';

function searchEnContent(content: string) {
  const result: SearchResultT<string>[] = [];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\u200B' || !SET_CHINESE_PUNCTUATION.has(content[i])) {
      continue;
    }

    result.push({
      content: content[i],
      start: i,
      end: i + 1,
    });
  }

  return result;
}

function searchZhContent(content: string) {
  const result: SearchResultT<string>[] = [];
  const filterContent = getMarkdownFilterContent(content, {
    disableList: true,
    disableLink: true,
    disableRefLink: true,
    disableImage: true,
    disableBold: true,
    disableItalic: true,
    disableVitepressAlertLine: true,
  });

  for (let i = 0; i < filterContent.length; i++) {
    if (filterContent[i] === '\u200B' || !SET_ENGLISH_PUNCTUATION.has(filterContent[i])) {
      continue;
    }

    if (
      (isEnglishLetter(filterContent[i + 1]) || isDigit(filterContent[i + 1]) || isPunctuation(filterContent[i + 1]) || filterContent[i + 1] === ' ') &&
      (isEnglishLetter(filterContent[i - 1]) || isDigit(filterContent[i - 1]) || isPunctuation(filterContent[i - 1]) || filterContent[i - 1] === ' ')
    ) {
      continue;
    }

    if (filterContent[i] === '.' && isDigit(filterContent[i - 1]) && filterContent[i + 1] === ' ') {
      continue;
    }

    result.push({
      content: filterContent[i],
      start: i,
      end: i + 1,
    });
  }

  return result;
}

function searchPunctuationMixing(content: string) {
  return hasChinese(content) ? searchZhContent(content) : searchEnContent(content);
}

/**
 * 检查中英文标点符号是否混用
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkPunctuationMixing(content: string, document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.punctuationMixing')) {
    return [];
  }

  return searchPunctuationMixing(content).map((item) => {
    const range = new vscode.Range(document.positionAt(item.start), document.positionAt(item.end));
    const diagnostic = new vscode.Diagnostic(range, `中英文符号混用 (Mixing Punctuation): ${item.content}\n如需屏蔽此检测，可以在前后加空格，若后面接标点符号可不加空格。\n例句1：添加 .png 后缀\n例句2：添加到 _toc.yaml。\n例句3：1. 这是一个有序列表`, vscode.DiagnosticSeverity.Information);
    diagnostic.code = item.content;
    diagnostic.source = 'punctuation-mixing-check';
    return diagnostic;
  });
}
