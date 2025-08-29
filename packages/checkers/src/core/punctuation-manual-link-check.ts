import { hasChinese } from 'shared';

import { ResultT } from '../@types/result';

export const PUNCTUATION_MANUAL_LINK_CHECK = 'punctuation-manual-link-check';

const REGEX = [
  /(?<!\!)\[(.*?)\]\(.+?\)/g, // 匹配 [xx](xxx) 链接
  /<a[^>]*href=["'][^"]+?["'][^>]*>(.+?)<\/a[^>]*>/gi, // 匹配 a 标签链接
];

/**
 * 检查外链手册是否有书名号
 * @param {string} content 内容
 * @returns {ResultT<string>[]} 返回检查结果
 */
export function execPunctuationManualLinkCheck(content: string) {
  const results: ResultT<string>[] = [];
  if (!hasChinese(content)) {
    return results;
  }

  for (const reg of REGEX) {
    for (const match of content.matchAll(reg)) {
      // 跳过空字符串
      if (!match[1]) {
        continue;
      }

      // 跳过非指南/手册
      if (!match[1].includes('指南') && !match[1].includes('手册')) {
        continue;
      }

      const name = match[1].trim();

      // 跳过已经被书名号包裹的
      if (name.includes('《') && name.includes('》')) {
        continue;
      }

      const start = match.index + match[0].indexOf(match[1]);
      results.push({
        name: PUNCTUATION_MANUAL_LINK_CHECK,
        type: 'info',
        content: match[1],
        start,
        end: start + match[1].length,
        extras: name,
        message: {
          zh: `请使用书名号包裹，如《${name}》`,
          en: `Please use bookmarks to wrap the book name, such as 《${name}》`,
        },
      });
    }
  }

  return results;
}
