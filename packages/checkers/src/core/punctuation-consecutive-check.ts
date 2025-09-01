import { getMarkdownFilterContent } from 'shared';
import type { ResultT } from '../@types/result';

export const PUNCTUATION_CONSECTIVE_CHECK = 'punctuation-consecutive-check';

const PUNCTUATIONS_MAP: Record<string, Set<string>> = {
  '.': new Set('.)]}>"\'`'),
  '!': new Set(')]}>"\'`'),
  '?': new Set(')]}>"\'`'),
  ';': new Set(')]}>"\'`'),
  ':': new Set(''),
  ',': new Set(''),
  '。': new Set('“”‘’（【《'),
  '！': new Set('“”‘’（【《'),
  '？': new Set('“”‘’（【《'),
  '；': new Set('“”‘’（【《'),
  '：': new Set('“‘（【《'),
  '，': new Set('“‘（【《'),
  '”': new Set('。！？；：，）】》—－～…、（“”‘’（【《'),
  '’': new Set('。！？；：，）】》—－～…、“”‘’（【《'),
  '（': new Set('“‘【《'),
  '）': new Set('。！？；：，”’—－～…、'),
  '【': new Set('“‘（《'),
  '】': new Set('。！？；：，”’—－～…、'),
  '《': new Set('“‘（【'),
  '》': new Set('。！？；：，”’—－～…、）】》'),
  '、': new Set('“‘（【《'),
  '～': new Set('“‘（【《'),
  '—': new Set('“‘（【《'),
  '－': new Set('“‘（【《'),
  '…': new Set('…“‘（【《'),
}

const PUNCTUATIONS = new Set(Object.keys(PUNCTUATIONS_MAP));

/**
 * 检查文本中是否有连续标点符号
 * @param {string} content 内容
 * @returns {ResultT[]} 返回检测到的连续标点符号
 */
export function execPunctuationConsecutiveCheck(content: string): ResultT[] {
  const results: ResultT[] = [];
  const filterContent = getMarkdownFilterContent(content, {
    disableLink: true,
    disableRefLink: true,
    disableImage: true,
  });

  for (let i = 0; i < filterContent.length - 1; i++) {
    // 当前不是标点符号，跳过
    if (!PUNCTUATIONS.has(filterContent[i])) {
      continue;
    }

    // 下一个不是标点符号，跳过
    if (!PUNCTUATIONS.has(filterContent[i + 1])) {
      i++;
      continue;
    }

    // 下一个字符允许紧挨着当前字符，跳过
    if (PUNCTUATIONS_MAP[filterContent[i]].has(filterContent[i + 1])) {
      continue;
    }

    results.push({
      name: PUNCTUATION_CONSECTIVE_CHECK,
      type: 'info',
      content: filterContent[i] + filterContent[i + 1],
      start: i,
      end: i + 2,
      message: {
        zh: `连续的标点符号：${filterContent[i] + filterContent[i + 1]}`,
        en: `Consecutive punctuations: ${filterContent[i] + filterContent[i + 1]}`,
      },
    });
  }

  return results;
}
