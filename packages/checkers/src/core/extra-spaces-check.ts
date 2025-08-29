import { ResultT } from '../@types/result';

const ZH_SPACE_REGEX = /[\u4e00-\u9fa5]( +)[\u4e00-\u9fa5]/g;

export const EXTRA_SPACES_CHECK = 'extra-spaces-check';

/**
 * 中文之间多余空格检查
 * @param content 待检查的文本内容
 * @returns {ResultT[]} 检查结果
 */
export function execExtraSpacesCheck(content: string): ResultT[] {
  const results: ResultT[] = [];
  for (const match of content.matchAll(ZH_SPACE_REGEX)) {
    const start = match.index + match[0].indexOf(match[1]);
    const end = start + match[1].length;
    results.push({
      name: EXTRA_SPACES_CHECK,
      type: 'info',
      content: match[0],
      start,
      end,
      message: {
        zh: `中文之间存在多余空格`,
        en: `Extra spaces`,
      },
    });
  }

  return results;
}
