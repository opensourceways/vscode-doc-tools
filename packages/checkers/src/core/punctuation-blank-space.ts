import { hasChinese, SET_CHINESE_PUNCTUATION } from 'shared';

import { CheckResultT } from '../@types/result';

/**
 * 检查中文标点符号前后是否有多余空格
 * @param {string} content 内容
 * @returns {CheckResultT[]} 返回检查结果
 */
export function execPunctuationBlankSpaceCheck(content: string) {
  const results: CheckResultT[] = [];
  if (!hasChinese(content)) {
    return results;
  }

  for (let i = 0; i < content.length; i++) {
    // 跳过非目标空格内容
    if (content[i] === '\u200B' || !SET_CHINESE_PUNCTUATION.has(content[i])) {
      continue;
    }

    // 跳过一些紧挨着 markdown 语法符号的情况
    if (content[i - 1] === ' ') {
      if (
        content[i - 2] === '#' ||
        content[i - 2] === '>' ||
        content[i - 2] === '.' ||
        content[i - 2] === '-' ||
        content[i - 2] === '*' ||
        content[i - 2] === '+' ||
        content[i - 2] === '|'
      ) {
        continue;
      }
    } 
    
    if (content[i + 1] === ' ') {
      let start = i + 1;
      let end = i + 2;
      while (content[end] === ' ') {
        end++;
      }

      // 跳过有可能是 markdown 表格的情况
      if (content[end] === '|') {
        continue;
      }

      results.push({
        content: ' ',
        message: `存在多余的空格 (Extra blank spaces)`,
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

      // 跳过有可能是 markdown 表格的情况
      if (content[start] === '|') {
        continue;
      }

      results.push({
        content: ' ',
        message: `存在多余的空格 (Extra blank spaces)`,
        start,
        end,
      });
    }
  }

  return results;
}
