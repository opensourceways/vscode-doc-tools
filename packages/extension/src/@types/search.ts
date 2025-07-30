export interface SearchResultT<M = any> {
  content: string;
  start: number;
  end: number;
  meta?: M;
}