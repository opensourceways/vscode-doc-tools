import { SET_ALL_CHINESE_PUNCTUATION, SET_ALL_ENGLISH_PUNCTUATION } from '../const';

/**
 * 判断字符串是否至少包含一个中文字符
 * @param {string} str 待检测文本
 * @returns {boolean} true：包含中文；false：无中文
 */
export function hasChinese(str: string): boolean {
  return /[\u4e00-\u9fa5]/u.test(str);
}

/**
 * 判断给定字符是否为英文字母（仅 A-Z 或 a-z）。
 * @param {string} char 待检测的单字符。
 * @returns {boolean} true 表示是英文字母，false 表示不是。
 */
export function isEnglishLetter(char: string): boolean {
  if (typeof char !== 'string' || !char) {
    return false;
  }

  const code: number = char.codePointAt(0) ?? 0;
  return (code >= 0x0041 && code <= 0x005a) || (code >= 0x0061 && code <= 0x007a);
}

/**
 * 判断给定字符是否为十进制数字（0–9）。
 * @param {string} char 待检测的单字符。
 * @returns {boolean} true 表示是数字字符，false 表示不是。
 */
export function isDigit(char: string): boolean {
  if (typeof char !== 'string' || !char) {
    return false;
  }

  const code: number = char.codePointAt(0) ?? 0;
  return code >= 0x0030 && code <= 0x0039;
}

/**
 * 判断给定字符是否为中文或英文标点符号
 * @param {string} char 要检测的单个字符
 * @returns {boolean} true 表示是标点；false 表示不是
 */
export function isPunctuation(char: string): boolean {
  if (typeof char !== 'string' || !char) {
    return false;
  }

  return SET_ALL_ENGLISH_PUNCTUATION.has(char) || SET_ALL_CHINESE_PUNCTUATION.has(char);
}
