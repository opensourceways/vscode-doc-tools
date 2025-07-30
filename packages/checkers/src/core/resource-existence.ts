import { isAccessibleLink } from 'shared';

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
 * @returns {CheckResultT<string>[]} 返回检查结果
 */
export async function execResourceExistenceCheck(content: string, prefixPath: string, whiteList: string[]) {
  const results: CheckResultT<string>[] = [];
  const set = new Set(whiteList);

  for (const reg of REGEX) {
    for (const match of content.matchAll(reg)) {
      // 跳过空字符串
      if (!match[1]) {
        continue;
      }

      // 跳过白名单链接
      if (set.has(match[1])) {
        continue;
      }

      const link = match[1];
      const res = await isAccessibleLink(link, prefixPath);

      // 跳过成功链接
      if (res === 'success') {
        continue;
      }

      const start = match.index + match[0].indexOf(link);
      const end = start + link.length;

      results.push({
        content: link,
        message: `${res === 'notFound' ? '资源链接无法访问' : '访问超时'} (Non-existent resource): ${link}`,
        start,
        end,
        extras: res,
      });
    }
  }

  return results;
}
