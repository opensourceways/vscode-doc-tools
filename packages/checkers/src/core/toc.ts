import yaml from 'js-yaml';
import { isAccessibleLink } from 'shared';

import { TocItem } from '../@types/toc';
import { CheckResultT } from '../@types/result';

const ALLOWED_KEYS = ['label', 'description', 'isManual', 'sections', 'href', 'upstream', 'path'];

/**
 * 收集错误提示
 * @param {string} content _toc.yaml 内容
 * @param {string} text 错误文本
 * @param {string} message 提示消息
 * @returns {CheckResultT[]} 返回结果
 */
function collectInvalidResults(content: string, text: string, message: string) {
  const results: CheckResultT[] = [];
  for (const match of content.matchAll(new RegExp(text, 'g'))) {
    results.push({
      content: text,
      message,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return results;
}

/**
 * 遍历收集 toc 错误
 * @param {string} content _toc.yaml 内容
 * @param {TocItem} item toc item
 * @param {string} tocDir _toc.yaml 所在目录
 * @param {CheckResultT[]} results 已收集的结果
 * @param {Set<string>} handled 已处理的错误，首次调用无需传递，用于递归收集传参
 */
async function walkToc(content: string, item: TocItem, tocDir: string, results: CheckResultT[], handled = new Set<string>()) {
  // 检查 key
  for (const key of Object.keys(item)) {
    if (!ALLOWED_KEYS.includes(key) && !handled.has(`${key}:`)) {
      results.push(...collectInvalidResults(content, `${key}:`, `_toc.yaml 不允许该 key 值 (Not allowed key): ${key}.`));
      handled.add(`${key}:`);
    }
  }

  // 检查isManual，只能为 true 或 false
  if (item.isManual && typeof item.isManual !== 'boolean' && !handled.has(`isManual:\\s+${item.isManual}`)) {
    results.push(
      ...collectInvalidResults(
        content,
        `isManual:\\s+${item.isManual}`,
        `isManual 只能为 true 或 false (Not allowed value: ${item.isManual}. The value of isManual can only be true or false.)`
      )
    );
    handled.add(`isManual:\\s+${item.isManual}`);
  }

  // 检查链接有效性
  if (item.href) {
    const url = typeof item.href === 'string' ? item.href : item.href.upstream;
    if (url && !handled.has(`href:\\s+${url}`)) {
      const valid = await isAccessibleLink(url, tocDir);
      if (valid !== 'success') {
        results.push(...collectInvalidResults(content, `href:\\s+${url}`, `文档资源不存在 (Non-existent doc in toc): ${url}.`));
      }

      handled.add(`href:\\s+${url}`);
    }
  }

  // 继续递归遍历
  if (Array.isArray(item.sections)) {
    for (const child of item.sections) {
      await walkToc(content, child, tocDir, results, handled);
    }
  }
}

/**
 * 检查 _toc.yaml
 * @param {string} content _toc.yaml 内容
 * @param {string} tocDir _toc.yaml 所在目录
 * @returns {CheckResultT[]} 返回检查结果
 */
export async function execTocCheck(content: string, tocDir: string) {
  const results: CheckResultT[] = [];

  try {
    const obj = yaml.load(content) as TocItem;
    await walkToc(content, obj, tocDir, results);
  } catch (err: any) {
    if (err?.mark) {
      const arr = content.split('\n');
      let start = err.mark.column;
      for (let i = 0; i < err.mark.line; i++) {
        start += arr[i].length + 1;
      }

      results.push({
        content: '',
        message: err.message,
        start,
        end: start + arr[err.mark.line].trim().length,
      });
    }
  }

  return results;
}
