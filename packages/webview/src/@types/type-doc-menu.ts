export interface DocMenuT {
  id: string;
  label: string;
  href?: string;
  description?: string;
  type: string;
  isManual?: boolean;
  upstream?: string;
  path?: string;
  sections?: Array<DocMenuT>;
}
