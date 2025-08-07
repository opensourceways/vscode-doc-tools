import { Bridge } from './bridge';

export class ConfigBridge {
  /**
   * 添加文件/目录命名规范白名单
   * @param {string} name 名称
   */
  static addCheckNameWhiteList(name: string): Promise<void> {
    return Bridge.getInstance().invoke<void>('addCheckNameWhiteList', name);
  }

  /**
   * 添加地址白名单
   * @param {string} url
   */
  static addUrlWhiteList(url: string): Promise<void> {
    return Bridge.getInstance().invoke<void>('addUrlWhiteList', url);
  }
}
