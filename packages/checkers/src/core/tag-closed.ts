import { CheckResultT } from 'src/@types/result';

/**
 * 检查 html 标签是否闭合
 * @param {string} content markdown 内容
 * @returns {CheckResultT[]} 返回检查结果
 */
export function execTagClosedCheck(content: string) {
  const results: CheckResultT[] = [];

  const record: { tag: string; match: RegExpExecArray }[] = []; // 保存标签及其起始位置
  const selfClosedTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

  // 正则表达式，匹配 HTML 标签、被转义的标签
  const REGEX_TAG = /(?<!\\)<\/?([a-zA-Z]+[a-zA-Z0-9\-]+)([^>]*?)>|(?<!\\)<([a-zA-Z]+[a-zA-Z0-9\-]+)([^>]*?)\/>|\\<([a-zA-Z]+[^>]*?)>|<([a-zA-Z]+[^>]*?)\\>/g;

  for (const match of content.matchAll(REGEX_TAG)) {
    // 跳过链接
    if (
      match[0].startsWith('<') &&
      match[0].endsWith('>') &&
      !match[0].includes('href=') &&
      !match[0].includes('src=') &&
      (match[0].includes('://') || match[0].includes('@'))
    ) {
      continue;
    }

    // 转义的标签
    if (match[0].startsWith('\\<') || match[0].endsWith('\\>')) {
      // 处于 html 标签中不允许使用 \<xx\> \<xx> <xx\> 写法
      if (record.length > 0) {
        results.push({
          content: match[0],
          message: `未闭合的 html 标签 (Unclosed html tag): ${match[0]}.\\<或\\>的转义写法不允许在标签嵌套中使用`,
          start: match.index,
          end: match.index + match[0].length,
        });
      }
      continue;
    }

    // 跳过已闭合标签
    if (match[0].startsWith('<') && match[0].endsWith('/>')) {
      continue;
    }

    // 跳过自闭合标签
    if (match[1] && selfClosedTags.has(match[1]?.toLowerCase())) {
      continue;
    }

    // 跳过tag非字母开头
    if (match[1] && !/^[a-zA-Z]/.test(match[1])) {
      continue;
    }

    const tag = match[1]?.toLowerCase();
    const isEndTag = tag && match[0].startsWith('</');

    // 非 </xx> 结束标签保存记录
    if (!isEndTag) {
      record.push({
        tag,
        match,
      });
      continue;
    }

    // </xx> 寻找对应的 <xx>
    let tagMacthed = false;
    for (let i = record.length - 1; i >= 0; i--) {
      if (record[i].tag === tag) {
        tagMacthed = true;
        record.splice(i, 1);
        break;
      }
    }

    if (!tagMacthed) {
      results.push({
        content: match[0],
        message: `未闭合的 html 标签 (Unclosed html tag): <${tag}>`,
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // 检查剩余的标签
  while (record.length > 0) {
    const { tag, match } = record.pop()!;

    results.push({
      content: match[0],
      message: `未闭合的 html 标签 (Unclosed html tag): <${tag}>`,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return results;
}
