import { SET_CHINESE_PUNCTUATION, SET_ENGLISH_PUNCTUATION, getMarkdownFilterContent, hasChinese, isDigit, isEnglishLetter, isPunctuation } from 'shared';

import { CheckResultT } from '../@types/result';

/**
 * 检测英文标点符号混用
 * @param {string} content 待检测内容
 * @returns {CheckResultT[]} 返回检查结果
 */
function getEnPunctuationMixing(content: string) {
  const results: CheckResultT[] = [];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\u200B' || !SET_CHINESE_PUNCTUATION.has(content[i])) {
      continue;
    }

    results.push({
      content: content[i],
      message: `中英文符号混用 (Mixing Punctuation): ${content[i]}\n如需屏蔽此检测，可以在前后加空格，若后面接标点符号可不加空格。\n例句1：添加 .png 后缀\n例句2：添加到 _toc.yaml。\n例句3：1. 这是一个有序列表`,
      start: i,
      end: i + 1,
    });
  }

  return results;
}

/**
 * 检测中文标点符号混用
 * @param {string} content 待检测内容
 * @returns {CheckResultT[]} 返回检查结果
 */
function getZhPunctuationMixing(content: string) {
  const results: CheckResultT[] = [];
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

    results.push({
      content: filterContent[i],
      message: `中英文符号混用 (Mixing Punctuation): ${filterContent[i]}\n如需屏蔽此检测，可以在前后加空格，若后面接标点符号可不加空格。\n例句1：添加 .png 后缀\n例句2：添加到 _toc.yaml。\n例句3：1. 这是一个有序列表`,
      start: i,
      end: i + 1,
    });
  }

  return results;
}

/**
 * 获取中英文标点符号是否混用
 * @param {string} content 待检测内容
 * @returns {CheckResultT[]} 返回检查结果
 */
export function execPunctuationMixingCheck(content: string) {
  return hasChinese(content) ? getZhPunctuationMixing(content) : getEnPunctuationMixing(content);
}
