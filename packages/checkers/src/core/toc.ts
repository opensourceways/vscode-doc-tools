import { parseDocument, isMap, isSeq, ParsedNode } from 'yaml';
import { getLinkStatus } from 'shared';

import { CheckResultT } from '../@types/result';

const ALLOWED_KEYS_MAP: Record<
  string,
  {
    checkValue?: (value: unknown, tocDir?: string) => Promise<string | undefined> | string | undefined;
  }
> = {
  label: {
    checkValue: (value: unknown) => {
      if (typeof value !== 'string') {
        return `label 只能为字符串`;
      } else if (value.trim() === '') {
        return `label 不能为空字符串`;
      }
    },
  },
  description: {
    checkValue: (value: unknown) => {
      if (typeof value !== 'string') {
        return `description 只能为字符串`;
      } else if (value.trim() === '') {
        return `description 不能为空字符串`;
      }
    },
  },
  isManual: {
    checkValue: (value: unknown) => {
      if (typeof value !== 'boolean') {
        return `isManual 只能为 true/false`;
      }
    },
  },
  sections: {
    checkValue: (value: unknown) => {
      if (!Array.isArray(value)) {
        return `sections 只能为数组`;
      }
    },
  },
  href: {
    checkValue: async (value: unknown, tocDir?: string) => {
      if (typeof value !== 'string' && typeof value !== 'object') {
        return `href 只能为字符串或者对象`;
      } else if (typeof value === 'string') {
        const status = await getLinkStatus(value, tocDir);
        if (status === 404) {
          return `文档资源不存在: ${value}.`;
        }
      }
    },
  },
  upstream: {
    checkValue: async (value: unknown) => {
      if (typeof value !== 'string') {
        return `upstream 只能为字符串`;
      } else if (value.trim() === '') {
        return `upstream 不能为空字符串`;
      } else if (!value.startsWith('http')) {
        return `upstream 只能为 http(s) 地址`;
      }

      const status = await getLinkStatus(value);
      if (status === 404) {
        return `文档资源不存在: ${value}.`;
      }
    },
  },
  path: {
    checkValue: (value: unknown) => {
      if (typeof value !== 'string') {
        return `path 只能为字符串`;
      } else if (value.trim() === '') {
        return `path 不能为空字符串`;
      }
    },
  },
};

async function visitToc(node: ParsedNode, tocDir: string, results: CheckResultT[], firstCall = false) {
  // 处理对象
  if (isMap(node)) {
    for (const { key, value } of node.items) {
      const keyString = key.toString();
      if (!ALLOWED_KEYS_MAP[keyString]) {
        results.push({
          content: keyString,
          message: `_toc.yaml 不允许该字段：${keyString}`,
          start: key.range[0],
          end: key.range[1],
        });

        continue;
      }

      if (value && ALLOWED_KEYS_MAP[keyString].checkValue) {
        const message = await ALLOWED_KEYS_MAP[keyString].checkValue(value.toJSON(), tocDir);
        if (message) {
          results.push({
            content: keyString,
            message,
            start: value.range[0],
            end: value.range[1],
          });
        }
      }

      if (keyString === 'label') {
        if (node.items.length === 1) {
          results.push({
            content: keyString,
            message: `缺少 href 或 sections 字段`,
            start: key.range[0],
            end: key.range[1],
          });
        }

        continue;
      }

      if (keyString === 'href') {
        if (value) {
          await visitToc(value, tocDir, results);
        }

        continue;
      }

      if (keyString === 'sections') {
        if (!node.items.some(({ key }) => key.toString() === 'label')) {
          results.push({
            content: keyString,
            message: `缺少 label 字段`,
            start: key.range[0],
            end: key.range[1],
          });
        }

        if (value) {
          await visitToc(value, tocDir, results);
        }

        continue;
      }

      if (keyString === 'upstream') {
        if (node.items.some(({ key }) => key.toString() === 'href')) {
          results.push({
            content: keyString,
            message: `upstream 字段不允许与 href 字段同时存在，请检查缩进是否正确`,
            start: key.range[0],
            end: key.range[1],
          });
        }

        continue;
      }

      if (keyString === 'path') {
        if (node.items.some(({ key }) => key.toString() === 'href')) {
          results.push({
            content: keyString,
            message: `path 字段不允许与 href 字段同时存在，请检查缩进是否正确`,
            start: key.range[0],
            end: key.range[1],
          });
        }

        if (!node.items.some(({ key }) => key.toString() === 'upstream')) {
          results.push({
            content: keyString,
            message: `需要添加 upstream 字段才可使用 path 字段`,
            start: key.range[0],
            end: key.range[1],
          });
        }

        continue;
      }
    }

    return;
  }

  // 处理数组
  if (isSeq(node)) {
    for (const item of node.items) {
      await visitToc(item, tocDir, results);
    }

    return;
  }

  // 首次调用，并且转换成非对象或者数组
  if (firstCall) {
    results.push({
      content: '',
      message: `_toc.yaml 转换失败！请检测是否按格式编写 _toc.yaml`,
      start: node.range[0],
      end: node.range[1],
    });
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
    const toc = parseDocument(content);
    await visitToc(toc.contents!, tocDir, results, true);
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
