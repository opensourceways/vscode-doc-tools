import { parseDocument, isMap, isSeq, ParsedNode } from 'yaml';
import { getLinkStatus } from 'shared';

import { LocaleT, ResultT } from '../@types/result';

export const TOC_CHECK = 'toc-check';

const ALLOWED_KEYS_MAP: Record<
  string,
  {
    checkValue?: (value: unknown, tocDir?: string, signal?: AbortSignal) => Promise<LocaleT | undefined>;
  }
> = {
  label: {
    checkValue: async (value: unknown) => {
      if (typeof value !== 'string') {
        return {
          zh: `label 值只能为字符串`,
          en: `label value can only be a string.`,
        };
      } else if (value.trim() === '') {
        return {
          zh: `label 值不能为空字符串`,
          en: `label value cannot be an empty string.`,
        };
      }
    },
  },
  description: {
    checkValue: async (value: unknown) => {
      if (typeof value !== 'string') {
        return {
          zh: `description 值只能为字符串`,
          en: `description value can only be a string.`,
        };
      } else if (value.trim() === '') {
        return {
          zh: `description 值不能为空字符串`,
          en: `description value cannot be an empty string.`,
        };
      }
    },
  },
  isManual: {
    checkValue: async (value: unknown) => {
      if (typeof value !== 'boolean') {
        return {
          zh: `isManual 值只能为 boolean`,
          en: `isManual value can only be a boolean.`,
        };
      }
    },
  },
  sections: {
    checkValue: async (value: unknown) => {
      if (!Array.isArray(value)) {
        return {
          zh: `sections 值只能为数组`,
          en: `sections value can only be an array.`,
        };
      }
    },
  },
  href: {
    checkValue: async (value: unknown, tocDir?: string, signal?: AbortSignal) => {
      if (typeof value !== 'string' && typeof value !== 'object') {
        return {
          zh: `href 值只能为字符串或对象`,
          en: `href value can only be a string or object.`,
        };
      } else if (typeof value === 'string') {
        if (value.trim() === '') {
          return {
            zh: `href 值不能为空字符串`,
            en: `href value cannot be an empty string.`,
          };
        } else {
          const status = await getLinkStatus(value, tocDir, [], signal);
          if (status === 404) {
            return {
              zh: '文档资源不存在',
              en: 'Document resource does not exist.',
            };
          }
        }
      }
    },
  },
  upstream: {
    checkValue: async (value: unknown, _?: string, signal?: AbortSignal) => {
      if (typeof value !== 'string') {
        return {
          zh: `upstream 值只能为字符串`,
          en: `upstream can only be a string.`,
        };
      } else if (value.trim() === '') {
        return {
          zh: `upstream 值不能为空字符串`,
          en: `upstream value cannot be an empty string.`,
        };
      } else if (!value.startsWith('http')) {
        return {
          zh: `upstream 值必须以 http 开头`,
          en: `upstream must start with http.`,
        };
      }

      const status = await getLinkStatus(value, '', [], signal);
      if (status === 404) {
        return {
          zh: `文档资源不存在`,
          en: `Document resource does not exist.`,
        };
      }
    },
  },
  path: {
    checkValue: async (value: unknown) => {
      if (typeof value !== 'string') {
        return {
          zh: `path 值只能为字符串`,
          en: `path value can only be a string.`,
        };
      } else if (value.trim() === '') {
        return {
          zh: `path 值不能为空字符串`,
          en: `path value cannot be an empty string.`,
        };
      }
    },
  },
};

async function visitToc(node: ParsedNode, tocDir: string, results: ResultT[], signal?: AbortSignal, firstCall = false) {
  // 处理对象
  if (isMap(node)) {
    for (const { key, value } of node.items) {
      if (signal?.aborted) {
        throw new Error('aborted');
      }

      const keyString = key.toString();
      if (!ALLOWED_KEYS_MAP[keyString]) {
        results.push({
          name: TOC_CHECK,
          type: 'error',
          content: keyString,
          start: key.range[0],
          end: key.range[1],
          message: {
            zh: `_toc.yaml 不允许该字段：${keyString}`,
            en: '_toc.yaml does not allow this field: ${keyString}.',
          },
        });

        continue;
      }

      if (value && ALLOWED_KEYS_MAP[keyString].checkValue) {
        const val = value.toJSON();
        const message = await ALLOWED_KEYS_MAP[keyString].checkValue(val, tocDir, signal);
        if (message) {
          results.push({
            name: TOC_CHECK,
            type: 'error',
            content: val,
            start: value.range[0],
            end: value.range[1],
            message,
          });
        }
      }

      const items = node.items.filter(({ key }) => key.toString() === keyString);
      if (items.length > 1) {
        results.push({
          name: TOC_CHECK,
          type: 'error',
          content: keyString,
          start: key.range[0],
          end: key.range[1],
          message: {
            zh: `${keyString} 字段重复`,
            en: `${keyString} field repeated.`,
          },
        });
      }

      if (keyString === 'label') {
        if (node.items.length === 1) {
          results.push({
            name: TOC_CHECK,
            type: 'error',
            content: keyString,
            start: key.range[0],
            end: key.range[1],
            message: {
              zh: `缺少 href 或 sections 字段`,
              en: `Missing href or sections field.`,
            },
          });
        }

        continue;
      }

      if (keyString === 'href') {
        if (value) {
          await visitToc(value, tocDir, results, signal);
        }

        continue;
      }

      if (keyString === 'sections') {
        if (!node.items.some(({ key }) => key.toString() === 'label')) {
          results.push({
            name: TOC_CHECK,
            type: 'error',
            content: keyString,
            start: key.range[0],
            end: key.range[1],
            message: {
              zh: `缺少 label 字段`,
              en: `Missing label field.`,
            },
          });
        }

        if (value) {
          await visitToc(value, tocDir, results, signal);
        }

        continue;
      }

      if (keyString === 'upstream') {
        if (node.items.some(({ key }) => key.toString() === 'href')) {
          results.push({
            name: TOC_CHECK,
            type: 'error',
            content: keyString,
            start: key.range[0],
            end: key.range[1],
            message: {
              zh: `upstream 字段不允许与 href 字段同时存在，请检查缩进是否正确`,
              en: `upstream field cannot exist with href field, please check indentation.`,
            },
          });
        }

        continue;
      }

      if (keyString === 'path') {
        if (node.items.some(({ key }) => key.toString() === 'href')) {
          results.push({
            name: TOC_CHECK,
            type: 'error',
            content: keyString,
            start: key.range[0],
            end: key.range[1],
            message: {
              zh: `path 字段不允许与 href 字段同时存在，请检查缩进是否正确`,
              en: `path field cannot exist with href field, please check indentation.`,
            },
          });
        }

        if (!node.items.some(({ key }) => key.toString() === 'upstream')) {
          results.push({
            name: TOC_CHECK,
            type: 'error',
            content: keyString,
            start: key.range[0],
            end: key.range[1],
            message: {
              zh: `需要添加 upstream 字段才可使用 path 字段`,
              en: `Need to add the upstream field to use the path field.`,
            },
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
      if (signal?.aborted) {
        throw new Error('aborted');
      }

      await visitToc(item, tocDir, results, signal);
    }

    return;
  }

  // 首次调用，并且转换成非对象或者数组
  if (firstCall) {
    results.push({
      name: TOC_CHECK,
      type: 'error',
      content: '',
      start: node.range[0],
      end: node.range[1],
      message: {
        zh: `_toc.yaml 转换失败！请检测是否按格式编写 _toc.yaml`,
        en: `_toc.yaml conversion failed! Please check whether _toc.yaml is written in the correct format.`,
      },
    });
  }
}

/**
 * 检查 _toc.yaml
 * @param {string} content _toc.yaml 内容
 * @param {string} tocDir _toc.yaml 所在目录
 * @param {AbortSignal} signal 中断信号
 * @returns {ResultT[]} 返回检查结果
 */
export async function execTocCheck(content: string, tocDir: string, signal?: AbortSignal) {
  const results: ResultT[] = [];

  try {
    const toc = parseDocument(content);
    await visitToc(toc.contents!, tocDir, results, signal, true);
  } catch (err: any) {
    // nothing
  }

  return results;
}
