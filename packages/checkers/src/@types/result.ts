export interface CheckResultT<E = any> {
  content: string; // 检测内容
  message: string; // 错误信息
  start: number; // 错误起始位置
  end: number; // 错误结束位置
  extras?: E; // 额外的数据
}

export interface ResultT<E = any> {
  name: string; // 错误名称
  type: 'error' | 'warning' | 'info';
  content: string; // 检测内容
  start: number; // 错误起始位置
  end: number; // 错误结束位置
  extras?: E; // 额外的数据
  message: { // 错误信息
    zh: string;
    en: string;
  }; 
}