import { InvokeT, MessageT, OPERATION_TYPE, SOURCE_TYPE } from '../@types/message';

export function createInvokeMessage<R = any>(opts: { id: string; source: SOURCE_TYPE; data: InvokeT<R> }): MessageT<InvokeT<R>> {
  return {
    id: opts.id,
    source: opts.source,
    operation: OPERATION_TYPE.invoke,
    data: opts.data,
  };
}
