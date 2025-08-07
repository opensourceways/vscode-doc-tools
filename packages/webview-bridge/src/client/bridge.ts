import { BroadcastT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';
import { createInvokeMessage, createInvokeIdBuilder, createBroadcastMessage } from '../utils/message';

const [createMessageId, removeMessageId] = createInvokeIdBuilder();
const symbolInstance = Symbol('symbolInstance');
const symbolResolveMap = Symbol('symbolResolveMap');
const symbolParent = Symbol('symbolParent');
const symbolBroadcastListener = Symbol('symbolBroadcastListener');

export class Bridge {
  private static [symbolInstance]: Bridge;

  // @ts-expect-error iframe下不存在acquireVsCodeApi
  private [symbolParent] = window?.acquireVsCodeApi ? acquireVsCodeApi() : window?.parent;
  private [symbolResolveMap] = new Map<string, (value: any) => void>();
  private [symbolBroadcastListener] = new Set<(message: BroadcastT) => void>();

  /**
   * 获取实例
   * @returns {Bridge} 返回 Bridge 实例
   */
  static getInstance() {
    if (!Bridge[symbolInstance]) {
      new Bridge(symbolInstance);
    }

    return Bridge[symbolInstance];
  }

  /**
   * 私有构造函数
   * @param symbol instance symbol
   */
  private constructor(symbol: Symbol) {
    if (symbol !== symbolInstance) {
      throw new Error('please use `ClientBridge.getInstance()`');
    }

    // 监听插件返回的消息
    window.addEventListener('message', (evt: MessageEvent<MessageT>) => {
      const { operation, source, data } = evt.data;
      if (source !== SOURCE_TYPE.server) {
        return;
      }

      // invoke
      if (operation === OPERATION_TYPE.invoke && this[symbolResolveMap].get(data?.id)) {
        this[symbolResolveMap].get(data.id)!(data.result);
        removeMessageId(data.id);
        return;
      }

      // broadcast
      if (operation === OPERATION_TYPE.broadcast) {
        for (const listener of this[symbolBroadcastListener].values()) {
          try {
            listener(data);
          } catch {
            // nothing
          }
        }
        return;
      }
    });

    Bridge[symbolInstance] = this;
  }

  /**
   * 发送消息
   * @param {MessageT} message 发送的消息
   */
  postMessage(message: MessageT) {
    this[symbolParent].postMessage(message, '*');
  }

  /**
   * 调用插件暴露的方法
   * @param {string} functionName 调用函数名
   * @param {any[]} args 传递参数
   * @returns {Promise<T>} 返回一个执行结果的 promise
   */
  invoke<T = unknown>(functionName: string, ...args: any[]) {
    return new Promise<T>((resolve) => {
      const id = createMessageId();
      this[symbolResolveMap].set(id, resolve);

      this.postMessage(
        createInvokeMessage({
          source: SOURCE_TYPE.client,
          data: {
            id,
            name: functionName,
            args,
          },
        })
      );
    });
  }

  /**
   * 发送广播
   * @param {string} name 广播名
   * @param {any[]} extras 附带数据
   */
  broadcast(name: string, ...extras: any[]) {
    this.postMessage(
      createBroadcastMessage({
        source: SOURCE_TYPE.client,
        data: {
          name,
          extras,
        },
      })
    );
  }

  /**
   * 添加广播监听
   * @param {Function} callback 监听回调
   */
  addBroadcastListener(callback: (message: BroadcastT) => void) {
    this[symbolBroadcastListener].add(callback);
  }

  /**
   * 移除广播监听
   * @param {Function} callback 监听回调
   */
  removeBroadcastListener(callback: (message: BroadcastT) => void) {
    this[symbolBroadcastListener].delete(callback);
  }
}
