import { hasChinese, SET_CHINESE_PUNCTUATION, SET_ENGLISH_PUNCTUATION } from 'shared';

import { CheckResultT } from '../@types/result';

/**
 * 检查中文标点符号前后是否有多余空格
 * @param {string} content 内容
 * @returns {CheckResultT[]} 返回检查结果
 */
function execZhCheck(content: string) {
  const results: CheckResultT[] = [];

  for (let i = 0; i < content.length; i++) {
    // 跳过非符号内容
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
        message: `存在多余的空格`,
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
        message: `存在多余的空格`,
        start,
        end,
      });
    }
  }

  return results;
}

/**
 * 检查英文标点符号前后是否有多余空格
 * @param {string} content 内容
 * @returns {CheckResultT[]} 返回检查结果
 */
function execEnCheck(content: string) {
  const results: CheckResultT[] = [];
  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    // 跳过非符号内容
    if (char === '\u200B' || !SET_ENGLISH_PUNCTUATION.has(char)) {
      continue;
    }

    // 跳过 ![image](image.jpg) 图片写法
    if (char === '!' && content[i - 1] === ' ' && content[i + 1] !== '[') {
      i++;
      continue;
    }

    // 收集前面的空格
    let start = i;
    if (char !== '"' && char !== "'" && char !== '(') {
      while (content[start - 1] === ' ') {
        start--;
      }
    }

    // 如果 start 不等于 i，则说明前面有多余空格
    if (start !== i) {
      results.push({
        content: content.slice(start, i + 1),
        message: `${char} 前面存在多余空格`,
        start: start,
        end: i + 1,
      });
    }

    // 收集后面的空格
    let end = i;
    while (content[end + 1] === ' ' && content[end + 2] === ' ') {
      end = end + 2;
    }

    // 如果 end 不等于 i，则说明后面有多余空格
    if (end !== i) {
      results.push({
        content: content.slice(i, end + 1),
        message: `${char} 后面存在多余空格`,
        start: i,
        end: end + 1,
      });
    }
  }
  return results;
}

/**
 * 检查标点符号前后是否有多余空格
 * @param {string} content 内容
 * @returns {CheckResultT[]} 返回检查结果
 */
export function execPunctuationBlankSpaceCheck(content: string) {
  return hasChinese(content) ? execZhCheck(content) : execEnCheck(content);
}
