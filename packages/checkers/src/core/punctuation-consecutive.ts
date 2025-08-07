import { getMarkdownFilterContent } from 'shared';
import type { CheckResultT } from '../@types/result';

const rightEnPunctuationSet = new Set<string>(')]}>"\'`');
const enPunctuationSet = new Set<string>('.!?;:,"\'()[]{}`');

const rightZhPunctuationSet = new Set<string>('）】》');
const endZhPunctuationSet = new Set<string>('。！？；：”、，—－～');
const zhPunctuationSet = new Set<string>('。！？；：，“”‘’（）【】《》—－～·…、￥');

const allPunctuationSet = new Set([...Array.from(enPunctuationSet), ...Array.from(zhPunctuationSet)]);
const validConsecutivePunctuation = new Set<string>([
  '...',
  '……',
  ...Array.from(enPunctuationSet).flatMap((end) => Array.from(rightEnPunctuationSet).map((right) => end + right)),
  ...Array.from(rightEnPunctuationSet).flatMap((right) => Array.from(enPunctuationSet).map((end) => right + end)),
  ...Array.from(rightZhPunctuationSet).flatMap((right) => Array.from(endZhPunctuationSet).map((end) => right + end)),
]);

/**
 * 检查文本中是否有连续标点符号
 * @param {string} content 内容
 * @returns {CheckResultT[]} 返回检测到的连续标点符号
 */
export function execPunctuationConsecutiveCheck(content: string): CheckResultT[] {
  const results: CheckResultT[] = [];
  const filterContent = getMarkdownFilterContent(content, {
    disableHeading: true,
    disableList: true,
    disableLink: true,
    disableRefLink: true,
    disableImage: true,
    disableBold: true,
    disableItalic: true,
    disableVitepressAlertLine: true,
  });

  // 遍历文本查找连续标点符号
  for (let i = 0; i < filterContent.length - 1; i++) {
    const currentChar = filterContent[i];

    // 如果当前字符是标点符号
    if (allPunctuationSet.has(currentChar)) {
      // 查找连续标点符号的完整序列
      let consecutiveSequence = currentChar;
      let j = i + 1;

      // 继续查找后续的连续标点符号
      while (j < filterContent.length && allPunctuationSet.has(filterContent[j])) {
        consecutiveSequence += filterContent[j];
        j++;
      }

      // 如果序列长度大于1，则为连续标点符号
      if (consecutiveSequence.length > 1) {
        // 只返回非法的连续标点符号
        if (!validConsecutivePunctuation.has(consecutiveSequence)) {
          // 创建符合 CheckResultT 格式的结果
          results.push({
            content: consecutiveSequence,
            message: `连续的标点符号`,
            start: i,
            end: i + consecutiveSequence.length,
          });
        }

        // 跳过已检查的部分
        i = j - 1;
      }
    }
  }

  return results;
}
