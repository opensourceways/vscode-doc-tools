export enum SOURCE_TYPE {
  client = 'client',
  server = 'server',
}

export enum OPERATION_TYPE {
  broadcast = 'broadcast',
  invoke = 'invoke',
}

export interface InvokeT<R = any> {
  id: string;
  name: string;
  args?: any[];
  result?: R;
}

export interface BroadcastT<E = any> {
  name: string;
  extras?: E;
}

export interface MessageT<T = any> {
  source: SOURCE_TYPE;
  operation?: OPERATION_TYPE;
  data: T;
}
