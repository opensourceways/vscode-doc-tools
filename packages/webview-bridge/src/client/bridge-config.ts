import { Bridge } from './bridge';

export class ConfigBridge {
  /**
   * 添加文件/目录命名规范白名单
   * @param {string} name 名称
   */
  static addCheckNameWhiteList(name: string): Promise<void> {
    return Bridge.getInstance().invoke<void>('addCheckNameWhiteList', name);
  }
}
