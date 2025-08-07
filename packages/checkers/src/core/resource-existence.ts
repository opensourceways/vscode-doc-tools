import { getLinkStatus } from 'shared';

import { CheckResultT } from '../@types/result';

const REGEX = [
  /!\[.*?\]\((.*?)\)/g, // 提取 ![xxx](xxx) 语法的链接
  /<img\s+[^>]*src="([^"]+)"[^>]*>/gi, // 提取 img 标签的链接
  /<image\s+[^>]*src="([^"]+)"[^>]*>/gi, // 提取 image 标签的链接
  /<video\s+[^>]*src="([^"]+)"[^>]*>/gi, // 提取 video 标签的链接
];

/**
 * 提取链接
 * @param {string} content 内容
 * @param {string} prefixPath 文件前缀地址
 * @param {string[]} whiteList 地址白名单
 * @param {AbortSignal} signal 中断信号
 * @returns {CheckResultT<number>[]} 返回检查结果
 */
export async function execResourceExistenceCheck(content: string, prefixPath: string, whiteList: string[], signal?: AbortSignal) {
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

      // 跳过白名单链接
      if (set.has(match[1])) {
        continue;
      }

      const link = match[1];
      const status = await getLinkStatus(link, prefixPath, whiteList, signal);

      // 跳过100 - 400之间的状态码
      if (status >= 100 && status < 400) {
        continue;
      }

      const start = match.index + match[0].indexOf(link, 3);
      const end = start + link.length;

      results.push({
        content: link,
        message: `${status === 499 ? '访问超时' : '链接无法访问'} (Non-existent resource): ${link}`,
        start,
        end,
        extras: status,
      });
    }
  }

  return results;
}
