export interface LocaleT {
  zh: string; // 中文
  en: string; // 英文
}

export interface ResultT<E = any> {
  name: string; // 错误名称
  type: 'error' | 'warning' | 'info';
  content: string; // 检测内容
  start: number; // 错误起始位置
  end: number; // 错误结束位置
  extras?: E; // 额外的数据
  message: LocaleT; // 错误消息
}