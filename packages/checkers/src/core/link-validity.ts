import { getLinkStatus } from 'shared';

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
 * @param {AbortSignal} signal 中断信号
 * @returns {CheckResultT<number>[]} 返回检查结果
 */
export async function execLinkValidityCheck(content: string, prefixPath: string, whiteList: string[], signal?: AbortSignal) {
  const results: CheckResultT<number>[] = [];
  const set = new Set(whiteList);

  for (const reg of REGEX) {
    for (const match of content.matchAll(reg)) {
      if (signal?.aborted) {
        throw new Error('aborted');
      }

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
      const status = await getLinkStatus(link, prefixPath, whiteList, signal);

      // 跳过100 - 400之间的状态码
      if (status >= 100 && status < 400) {
        continue;
      }

      const start = match.index + (match[0].startsWith('<http') ? 1 : match[0].indexOf(match[1], 2));
      const end = start + match[1].length;
      
      results.push({
        content: match[1],
        message: `${status === 499 ? '访问超时' : '链接无法访问'} (Invalid link): ${match[1]}`,
        start,
        end,
        extras: status,
      });
    }
  }

  return results;
}
