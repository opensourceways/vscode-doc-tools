import { BroadcastT, InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';

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

export function createInvokeMessage<R = any>(opts: { source: SOURCE_TYPE; data: InvokeT<R> }): MessageT<InvokeT<R>> {
  return {
    source: opts.source,
    operation: OPERATION_TYPE.invoke,
    data: opts.data,
  };
}

export function createBroadcastMessage<E = any>(opts: { source: SOURCE_TYPE; data: BroadcastT<E> }): MessageT<BroadcastT> {
  return {
    source: opts.source,
    operation: OPERATION_TYPE.broadcast,
    data: opts.data,
  };
}
