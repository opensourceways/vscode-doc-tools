import { isAccessibleLink } from 'shared';

import { CheckResultT } from '../@types/result';

const REGEX = [
  /(?<!\!)\[.*?\]\((.+?)\)/g, // 匹配 [xx](xxx) 链接
  /<(http[^>]+)>/g, // 匹配 <链接地址> 格式的链接
  /<a[^>]*href=["']([^"]+?)["'][^>]*>/gi, // 匹配 <a> 标签链接
];

/**
 * 检查链接有效性
 * @param {string} content 内容
 * @param {string} prefixPath 文件前缀地址
 * @param {string[]} whiteList 地址白名单
 * @returns {CheckResultT<string>[]} 返回检查结果
 */
export async function execLinkValidityCheck(content: string, prefixPath: string, whiteList: string[]) {
  const results: CheckResultT<string>[] = [];
  const set = new Set(whiteList);

  for (const reg of REGEX) {
    for (const match of content.matchAll(reg)) {
      // 跳过空字符串
      if (!match[1]) {
        continue;
      }

      // 跳过锚点链接
      if (match[1].startsWith('#')) {
        continue;
      }

      // 跳过白名单链接
      if (set.has(match[1])) {
        continue;
      }

      const link = match[1].split('#')[0];
      const res = await isAccessibleLink(link, prefixPath);

      // 跳过成功链接
      if (res === 'success') {
        continue;
      }

      const start = match.index + match[0].indexOf(match[1]);
      const end = start + match[1].length;
      
      results.push({
        content: match[1],
        message: `${res === 'notFound' ? '链接无法访问' : '访问超时'} (Invalid link): ${match[1]}`,
        start,
        end,
        extras: res,
      });
    }
  }

  return results;
}
