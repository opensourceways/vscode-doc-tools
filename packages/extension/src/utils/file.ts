import fs from 'fs';
import yaml from 'js-yaml';

/**
 * 获取文件内容
 * @param {string} fsPath 文件路径
 * @returns {string} 返回文件内容
 */
export function getFileContent(fsPath: string) {
  try {
    return fs.readFileSync(fsPath, 'utf8');
  } catch {
    return '';
  }
}

/**
 * 获取 yaml 内容
 * @param {string} fsPath yaml 文件路径
 * @param {object} defaultVal 获取失败返回的默认值，可空
 * @returns {T} 返回 yaml 转换过后的对象
 */
export function getYamlContent<T>(fsPath: string, defaultVal = {}) {
  try {
    if (fs.existsSync(fsPath)) {
      return yaml.load(fs.readFileSync(fsPath, 'utf8')) as T;
    }
  } catch {}

  return defaultVal as T;
}
