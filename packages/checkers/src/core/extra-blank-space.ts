import { CheckResultT } from '../@types/result';

const ZH_SPACE_REGEX = /[\u4e00-\u9fa5]( +)[\u4e00-\u9fa5]/g;

/**
 * 执行中文之间多余空格检查
 * @param content 待检查的文本内容
 * @returns 检查结果
 */
export function execExtraBlankSpaceCheck(content: string): CheckResultT[] {
  const results: CheckResultT[] = [];
  for (const match of content.matchAll(ZH_SPACE_REGEX)) {
    results.push({
      content: match[0],
      message: `中文之间存在多余空格`,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return results;
}
