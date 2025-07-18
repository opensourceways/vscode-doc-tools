import { Bridge } from "./bridge";

export class MarkdownBridge {
  /**
   * 获取 markdown 内容
   * @param {string} mdPath markdown 文件路径
   * @returns 返回一个包含 markdown 内容的 Promise
   */
  static getMarkdownContent(mdPath: string): Promise<string> {
    return Bridge.getInstance().invoke<string>('getMarkdownContent', mdPath);
  }

  /**
   * 获取 markdown 转换过后的 html 内容
   * @param {string} mdPath markdown 文件路径
   * @returns 返回一个包含 html 内容的 Promise
   */
  static getMarkdownHtml(mdPath: string): Promise<string> {
    return Bridge.getInstance().invoke<string>('getMarkdownHtml', mdPath);
  }
}