import { ResultT } from '../@types/result';

export const PUNCTUATION_PAIR_CHECK = 'punctuation-pair-check';

// 定义成对符号映射关系
const PAIR_SYMBOLS: Record<string, string> = {
  '「': '」',
  '『': '』',
  '（': '）',
  '【': '】',
  '《': '》',
  '〈': '〉',
  '“': '”',
  '‘': '’',
  '[': ']',
  '{': '}',
  '(': ')',
};

// 定义开符号集合
const OPEN_SYMBOLS = new Set(Object.keys(PAIR_SYMBOLS));

// 定义闭符号集合
const CLOSE_SYMBOLS = new Set(Object.values(PAIR_SYMBOLS));

/**
 * 执行中文标点符号配对检查
 * @param content 待检查的文本内容
 * @returns 检查结果
 */
export function execCheckPunctuationPair(content: string): ResultT[] {
  const stack: { char: string; position: number }[] = [];
  const results: ResultT[] = [];

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    // 如果是开符号，入栈
    if (OPEN_SYMBOLS.has(char)) {
      stack.push({
        char,
        position: i,
      });
    }

    // 如果是闭符号
    else if (CLOSE_SYMBOLS.has(char)) {
      // 检查栈是否为空（没有对应的开符号）
      if (stack.length === 0) {
        results.push({
          name: PUNCTUATION_PAIR_CHECK,
          type: 'info',
          content: char,
          start: i,
          end: i + 1,
          message: {
            zh: `未匹配成对的标点符号: ${char}`,
            en: `Unmatched punctuation: ${char}`,
          },
        });
        continue;
      }

      // 检查是否匹配
      const lastOpener = stack.pop()!;
      if (PAIR_SYMBOLS[lastOpener.char] !== char) {
        results.push({
          name: PUNCTUATION_PAIR_CHECK,
          type: 'info',
          content: lastOpener.char,
          start: lastOpener.position,
          end: lastOpener.position + 1,
          message: {
            zh: `标点符号不匹配: ${lastOpener.char}；应该对应 ${PAIR_SYMBOLS[lastOpener.char]}，但实际是 ${char}`,
            en: `Punctuation does not match: ${lastOpener.char}. It should be ${PAIR_SYMBOLS[lastOpener.char]}, but actually is ${char}`,
          },
        });
      }
    }
  }

  // 检查是否有未闭合的开符号
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    results.push({
      name: PUNCTUATION_PAIR_CHECK,
      type: 'info',
      content: unclosed.char,
      start: unclosed.position,
      end: unclosed.position + 1,
      message: {
        zh: `未匹配成对的标点符号: ${unclosed.char}`,
        en: `Unmatched punctuation: ${unclosed.char}`,
      },
    });
  }

  return results;
}
