import { Bridge } from './bridge';

export class PageBridge {
  /**
   * 设置标题
   * @param {string} title 标题
   * @returns
   */
  static setWebviewTitle(title: string): Promise<void> {
    return Bridge.getInstance().invoke<void>('setWebviewTitle', title);
  }
}
