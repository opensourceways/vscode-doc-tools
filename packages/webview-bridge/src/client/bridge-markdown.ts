import { Bridge } from "./bridge";

export class MarkdownBridge {
  /**
   * 获取 markdown 内容
   * @returns 返回一个包含 markdown 内容的 Promise
   */
  static getMarkdownContent(): Promise<string> {
    return Bridge.getInstance().invoke<string>('getMarkdownContent');
  }

  /**
   * 获取 markdown 转换过后的 html 内容
   * @returns 返回一个包含 html 内容的 Promise
   */
  static getMarkdownHtml(): Promise<string> {
    return Bridge.getInstance().invoke<string>('getMarkdownHtml');
  }
}