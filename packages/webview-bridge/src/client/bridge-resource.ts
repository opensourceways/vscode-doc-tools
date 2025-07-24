import { Bridge } from './bridge';

export class ResourceBridge {
  /**
   * 查看源文件
   * @param {string} fsPath 文件路径
   * @returns
   */
  static viewSource(fsPath: string): Promise<void> {
    return Bridge.getInstance().invoke<void>('viewSource', fsPath);
  }
}
