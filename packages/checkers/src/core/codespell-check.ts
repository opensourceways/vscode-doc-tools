import { spellCheckDocument, type ValidationIssue } from 'cspell-lib';

import { type ResultT } from '../@types/result';

export const CODESPELL_CHECK = 'codespell-check';

/**
 * codespell 检查
 * @param {string} content 内容
 * @param {string[]} whiteList 单词白名单
 * @returns {ResultT<string[] | undefined>[]} 返回检查结果
 */
export async function execCodespellCheck(content: string, whiteList: string[]) {
  const results = await spellCheckDocument(
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
      words: whiteList,
      suggestionsTimeout: 2000,
      ignoreRegExpList: [
        '/\\[.*?\\]\\(.*?\\)/g', // 匹配Markdown链接语法：[文本](URL)
        '/<[^>]*?>/g', // 匹配HTML标签：<tag>content</tag> 或 <tag/>
        '[\\u4e00-\\u9fa5]', // 匹配中文字符
      ],
    }
  );

  return results.issues.map<ResultT<string[] | undefined>>((issue: ValidationIssue) => {
    return {
      name: CODESPELL_CHECK,
      type: 'warning',
      content: issue.text,
      start: issue.offset,
      end: issue.offset + issue.text.length,
      extras: issue.suggestions,
      message: {
        zh: `单词拼写错误：${issue.text}`,
        en: `Spelling mistake: ${issue.text}.`,
      },
    };
  });
}
