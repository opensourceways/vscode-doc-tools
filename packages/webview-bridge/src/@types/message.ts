export enum SOURCE_TYPE {
  client = 'client',
  server = 'server',
}

export enum OPERATION_TYPE {
  postMessage = 'postMessage',
  invoke = 'invoke',
}

export interface InvokeT<R = any> {
  name: string;
  args?: any[];
  result?: R;
}

export interface MessageT<T = any> {
  id: string;
  source: SOURCE_TYPE;
  operation?: OPERATION_TYPE;
  data: T;
}
