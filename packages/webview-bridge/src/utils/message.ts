import { BroadcastT, InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';

/**
 * 创建 invoke id 生成器
 */
export function createInvokeIdBuilder() {
  const set = new Set<string>();

  const createMessageId = () => {
    let id = `invoke-${new Date().getTime()}-${Math.random()}-${Math.random()}`;
    while (set.has(id)) {
      id = `${new Date().getTime()}-${Math.random()}-${Math.random()}`;
    }

    set.add(id);
    return id;
  };

  const removeMessageId = (id: string) => {
    set.delete(id);
  };

  return [createMessageId, removeMessageId] as [() => string, (id: string) => void];
}

/**
 * 创建调用方法消息
 * @param {SOURCE_TYPE} opts.source 消息来源
 * @param {InvokeT<R>} opts.data 数据
 * @returns {MessageT<InvokeT<R>>} 返回消息对象
 */
export function createInvokeMessage<R = any>(opts: { source: SOURCE_TYPE; data: InvokeT<R> }): MessageT<InvokeT<R>> {
  return {
    source: opts.source,
    operation: OPERATION_TYPE.invoke,
    data: opts.data,
  };
}

/**
 * 创建广播消息
 * @param {SOURCE_TYPE} opts.source 消息来源
 * @param {BroadcastT<E>} opts.data 数据
 * @returns {MessageT<BroadcastT<E>>} 返回消息对象
 */
export function createBroadcastMessage<E = any>(opts: { source: SOURCE_TYPE; data: BroadcastT<E> }): MessageT<BroadcastT<E>> {
  return {
    source: opts.source,
    operation: OPERATION_TYPE.broadcast,
    data: opts.data,
  };
}
