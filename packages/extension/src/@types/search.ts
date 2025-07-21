export interface SearchResultT<T = any> {
  content: string;
  start: number;
  end: number;
  meta?: T;
}