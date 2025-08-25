import { CheckResultT } from '../@types/result';

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
export function execPunctuationPairCheck(content: string): CheckResultT[] {
  const stack: { char: string; position: number }[] = [];
  const results: CheckResultT[] = [];

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
          content: char,
          message: `未匹配成对的符号: ${char}`,
          start: i,
          end: i + 1,
        });
        continue;
      }

      // 检查是否匹配
      const lastOpener = stack.pop()!;
      if (PAIR_SYMBOLS[lastOpener.char] !== char) {
        results.push({
          content: lastOpener.char,
          message: `符号不匹配: ${lastOpener.char}；应该对应 ${PAIR_SYMBOLS[lastOpener.char]}，但实际是 ${char}`,
          start: lastOpener.position,
          end: lastOpener.position + 1,
        });
      }
    }
  }

  // 检查是否有未闭合的开符号
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    results.push({
      content: unclosed.char,
      message: `未匹配成对的符号: ${unclosed.char}`,
      start: unclosed.position,
      end: unclosed.position + 1,
    });
  }

  return results;
}
