import path from 'path';
import { getFileContentAsync, getLinkStatus, getMarkdownIds } from 'shared';

import { ResultT } from '../@types/result';

export const LINK_VALIDITY_CHECK = 'link-validity-check';

const EN_DESCRIPTION: Record<string, string> = {
  '锚点无法访问': 'Invalid anchor.',
  '链接无法访问': 'Invalid link.',
  '访问超时': 'Timeout.',
};

const REGEX = [
  /(?<!\!)\[.*?\]\((.+?)\)/g, // 匹配 [xx](xxx) 链接
  /<(http[^>]+)>/g, // 匹配 <链接地址> 格式的链接
  /<a[^>]*href=["']([^"]+?)["'][^>]*>/gi, // 匹配 <a> 标签链接
];

/**
 * 检查链接有效性
 * @param {string} content 内容
 * @param {string} opts.prefixPath 文件前缀地址
 * @param {string[]} opts.whiteList 地址白名单
 * @param {boolean} opts.disableCheckExternalUrl 禁止检测外链
 * @param {boolean} opts.disableCheckInternalUrl 禁止检测内链
 * @param {boolean} opts.disableCheckAnchor 禁止检测链接锚点
 * @param {AbortSignal} opts.signal 中断信号
 * @returns {ResultT<number>[]} 返回检查结果
 */
export async function execCheckLinkValidity(
  content: string,
  opts: {
    prefixPath: string;
    whiteList?: string[];
    disableCheckExternalUrl?: boolean;
    disableCheckInternalUrl?: boolean;
    disableCheckAnchor?: boolean;
    signal?: AbortSignal;
  }
) {
  const { prefixPath, whiteList = [], disableCheckExternalUrl = false, disableCheckInternalUrl = false, disableCheckAnchor = false, signal } = opts;
  const results: ResultT<number>[] = [];
  const set = new Set(whiteList);
  let idsMap = new Map<string, Set<string>>();

  for (const reg of REGEX) {
    for (const match of content.matchAll(reg)) {
      if (signal?.aborted) {
        throw new Error('aborted');
      }

      const macthedLink = match[1].trim();

      // 跳过空字符串
      if (!macthedLink) {
        continue;
      }

      // 跳过白名单链接
      if (set.has(macthedLink)) {
        continue;
      }

      let status = 0;
      let zhMsg = '';
      const [link, anchor] = macthedLink.split('#');

      // 判断链接是否有效
      if (link) {
        if (disableCheckExternalUrl && link.startsWith('http')) {
          continue;
        } else if (disableCheckInternalUrl && !link.startsWith('http')) {
          continue;
        }

        status = await getLinkStatus(link, prefixPath, whiteList, signal);
        if (status >= 100 && status < 400) {
          if (!disableCheckAnchor && link.startsWith('.') && anchor) {
            const mdPath = path.join(prefixPath, decodeURI(link.replace('.html', '.md')));
            if (!idsMap.get(mdPath)) {
              const mdContent = await getFileContentAsync(mdPath);
              idsMap.set(mdPath, getMarkdownIds(mdContent));
            }

            if (idsMap.get(mdPath)!.has(anchor)) {
              continue;
            } else {
              status = 404;
              zhMsg = '锚点无法访问';
            }
          } else {
            continue;
          }
        } else if (status === 499) {
          zhMsg = '访问超时';
        } else {
          zhMsg = '链接无法访问';
        }
      } else if (!disableCheckAnchor && anchor) {
        if (!idsMap.get('.')) {
          idsMap.set('.', getMarkdownIds(content));
        }

        if (idsMap.get('.')!.has(anchor)) {
          continue;
        } else {
          status = 404;
          zhMsg = '锚点无法访问';
        }
      }

      const start = match.index + (match[0].startsWith('<http') ? 1 : match[0].indexOf(match[1], 2));
      const end = start + match[1].length;

      results.push({
        name: LINK_VALIDITY_CHECK,
        type: status === 404 ? 'error' : 'warning',
        content: macthedLink,
        start,
        end,
        extras: status,
        message: {
          zh: zhMsg,
          en: EN_DESCRIPTION[zhMsg],
        },
      });
    }
  }

  return results;
}
