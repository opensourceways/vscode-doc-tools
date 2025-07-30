export interface TocItem {
  label: string; // 名称
  isManual?: boolean; // 是否为手册
  href?: string | { // 链接
    upstream: string;
    path?: string;
  };
  sections?: TocItem[]; // 子节点
}