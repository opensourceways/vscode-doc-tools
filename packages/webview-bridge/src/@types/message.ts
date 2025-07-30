// 消息来源类型
export enum SOURCE_TYPE {
  client = 'client', // 来自客户端
  server = 'server', // 来自服务端
}

// 消息操作类型
export enum OPERATION_TYPE {
  broadcast = 'broadcast', // 广播
  invoke = 'invoke', // 调用方法
}

// 消息类型
export interface MessageT<T = any> {
  source: SOURCE_TYPE; // 消息来源
  operation?: OPERATION_TYPE; // 操作类型
  data: T; // 消息数据
}

// 调用方法消息
export interface InvokeT<R = any> {
  id: string; // 回调id
  name: string; // 方法名
  args?: any[]; // 参数
  result?: R; // 结果
}

// 广播消息
export interface BroadcastT<E = any> {
  name: string; // 广播名
  extras?: E; // 额外数据
}

