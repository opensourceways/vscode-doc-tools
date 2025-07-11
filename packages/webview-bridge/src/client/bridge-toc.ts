import { Bridge } from './bridge';

export class TocBridge {
  /**
   * 获取 manual toc
   * @returns 返回一个包含 manual toc 内容的 Promise
   */
  static getManualToc(): Promise<Record<string, any> | null> {
    return Bridge.getInstance().invoke<Record<string, any> | null>('getToc');
  }
}
