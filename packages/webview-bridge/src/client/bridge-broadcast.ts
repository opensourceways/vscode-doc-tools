import { BroadcastT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';
import { Bridge } from './bridge';

const symbolIsInit = Symbol('symbolIsInit');
const symbolIInit = Symbol('symbolInit');
const symbolListenerMap = Symbol('symbolListenerMap');
const symbolAddListener = Symbol('symbolAddListener');
const symbolRemoveListener = Symbol('symbolRemoveListener');
const symbolCallback = Symbol('symbolCallback');

export class BroadcastBridge {
  private static [symbolIsInit] = false;
  private static [symbolListenerMap] = new Map<string, Set<(...args: any[]) => void>>();

  /**
   * 私有方法：初始化添加 message 监听
   */
  private static [symbolIInit]() {
    if (this[symbolIsInit]) {
      return;
    }
    
    this[symbolIsInit] = true;
    Bridge.getInstance().addBroadcastListener((data: BroadcastT) => {
      const { name, extras } = data;
      BroadcastBridge[symbolCallback](name, extras);
    });
  }

  /**
   * 私有方法：添加广播回调
   * @param {string} name 广播名称
   * @param {Function} callback 回调函数
   */
  private static [symbolAddListener](name: string, callback: (...args: any[]) => void) {
    if (!this[symbolIsInit]) {
      this[symbolIInit]();
    }

    if (!(this[symbolListenerMap].get(name) instanceof Set)) {
      this[symbolListenerMap].set(name, new Set());
    }

    this[symbolListenerMap].get(name)!.add(callback);
  }

  /**
   * 私有方法：移除广播回调
   * @param {string} name 广播名称
   * @param {Function} callback 回调函数
   */
  private static [symbolRemoveListener](name: string, callback: (...args: any[]) => void) {
    if (!(this[symbolListenerMap].get(name) instanceof Set)) {
      return;
    }

    this[symbolListenerMap].get(name)!.delete(callback);
  }

  /**
   * 私有方法：触发回调
   * @param {string} name 广播名称
   * @param {any[]} extras 回调参数
   */
  private static [symbolCallback](name: string, extras: any[]) {
    const callbacks = this[symbolListenerMap].get(name);
    if (!callbacks) {
      return;
    }

    callbacks.forEach((callback) => callback(...extras));
  }

  /**
   * 添加 markdown change 监听
   * @param {Function} callback 回调方法
   */
  static addMarkdownContentChangeListener(callback: (mdPath: string) => void) {
    this[symbolAddListener]('onMarkdownContentChange', callback);
  }

  /**
   * 移除 markdown change 监听
   * @param {Function} callback 回调方法
   */
  static removeMarkdownContentChangeListener(callback: (mdPath: string) => void) {
    this[symbolRemoveListener]('onMarkdownContentChange', callback);
  }

  /**
   * 添加 _toc.yaml change 监听
   * @param {Function} callback 回调方法
   */
  static addTocContentChangeListener(callback: (tocPath: string) => void) {
    this[symbolAddListener]('onTocContentChange', callback);
  }

  /**
   * 移除 _toc.yaml change 监听
   * @param {Function} callback 回调方法
   */
  static removeTocContentChangeListener(callback: (tocPath: string) => void) {
    this[symbolRemoveListener]('onTocContentChange', callback);
  }

  /**
   * 添加 异步任务输出 监听
   * @param {Function} callback 回调方法
   */
  static addAsyncTaskOutputListener(callback: (...args: any[]) => void) {
    this[symbolAddListener]('onAsyncTaskOutput', callback);
  }

  /**
   * 移除 异步任务输出 监听
   * @param {Function} callback 回调方法
   */
  static removeAsyncTaskOutputListener(callback: (...args: any[]) => void) {
    this[symbolRemoveListener]('onAsyncTaskOutput', callback);
  }
}
