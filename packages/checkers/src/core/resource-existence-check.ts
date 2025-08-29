import { getLinkStatus } from 'shared';

import { ResultT } from '../@types/result';

export const RESOURCE_EXISTENCE_CHECK = 'resource-existence-check';

const REGEX = [
  /!\[.*?\]\((.*?)\)/g, // 提取 ![xxx](xxx) 语法的链接
  /<img\s+[^>]*src="([^"]+)"[^>]*>/gi, // 提取 img 标签的链接
  /<image\s+[^>]*src="([^"]+)"[^>]*>/gi, // 提取 image 标签的链接
  /<video\s+[^>]*src="([^"]+)"[^>]*>/gi, // 提取 video 标签的链接
];

/**
 * 提取链接
 * @param {string} content 内容
 * @param {string} opts.prefixPath 文件前缀地址
 * @param {string[]} opts.whiteList 地址白名单
 * @param {boolean} opts.disableCheckExternalUrl 禁止检测外链
 * @param {boolean} opts.disableCheckInternalUrl 禁止检测内链
 * @param {AbortSignal} opts.signal 中断信号
 * @returns {ResultT<number>[]} 返回检查结果
 */
export async function execResourceExistenceCheck(
  content: string,
  opts: {
    prefixPath: string;
    whiteList?: string[];
    disableCheckExternalUrl?: boolean;
    disableCheckInternalUrl?: boolean;
    signal?: AbortSignal;
  }
) {
  const { 
    prefixPath, 
    whiteList = [], 
    disableCheckExternalUrl = false, 
    disableCheckInternalUrl = false,
    signal, 
  } = opts;
  const results: ResultT<number>[] = [];
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
      if (disableCheckExternalUrl && link.startsWith('http')) {
        continue;
      } else if (disableCheckInternalUrl && !link.startsWith('http')) {
        continue;
      }

      const status = await getLinkStatus(link, prefixPath, whiteList, signal);

      // 跳过100 - 400之间的状态码
      if (status >= 100 && status < 400) {
        continue;
      }

      const start = match.index + match[0].indexOf(link, 3);
      const end = start + link.length;

      results.push({
        name: RESOURCE_EXISTENCE_CHECK,
        type: status === 404 ? 'error' : 'warning',
        content: link,
        start,
        end,
        extras: status,
        message: {
          zh: status === 499 ? '访问超时' : '资源链接无法访问',
          en: status === 499 ? 'Timeout' : 'Invalid resource link',
        },
      });
    }
  }

  return results;
}
