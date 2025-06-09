import fs from 'fs';
import yaml from 'js-yaml';

export function getFileContent(fsPath: string) {
  try {
    return fs.readFileSync(fsPath, 'utf8');
  } catch {
    return '';
  }
}

export function getYamlContent<T>(fsPath: string) {
  try {
    if (fs.existsSync(fsPath)) {
      return yaml.load(fs.readFileSync(fsPath, 'utf8')) as T;
    }
  } catch {}

  return {} as T;
}
