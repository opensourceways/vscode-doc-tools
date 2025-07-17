import { MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';
import { createInvokeMessage } from '../utils/message';

const symbolInstance = Symbol('symbolInstance');
const symbolResolveMap = Symbol('symbolResolveMap');
const symbolParent = Symbol('symbolParent');

export class Bridge {
  private static [symbolInstance]: Bridge;

  // @ts-expect-error iframe下不存在acquireVsCodeApi
  private [symbolParent] = window?.acquireVsCodeApi ? acquireVsCodeApi() : window?.parent;
  private [symbolResolveMap] = new Map<string, (value: any) => void>();

  /**
   * 获取实例
   * @returns ClientBridge
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
      const { id, operation, source, data } = evt.data;
      if (source !== SOURCE_TYPE.server || operation !== OPERATION_TYPE.invoke || !this[symbolResolveMap].get(id)) {
        return;
      }

      this[symbolResolveMap].get(id)!!(data.result);
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
   * @returns 返回一个执行结果的 promise
   */
  invoke<T = unknown>(functionName: string, ...args: any[]) {
    return new Promise<T>((resolve) => {
      const id = `${new Date().getTime()}-${Math.random()}-${Math.random()}`;
      this[symbolResolveMap].set(id, resolve);

      this.postMessage(createInvokeMessage({
        id,
        source: SOURCE_TYPE.client,
        data: {
          name: functionName,
          args,
        },
      }));
    });
  }
}
