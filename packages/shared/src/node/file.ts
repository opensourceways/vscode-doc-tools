import path from 'path';
import fs from 'fs';
import fsAsnyc from 'fs/promises';

import yaml from 'js-yaml';

/**
 * 获取文件内容
 * @param {string} fsPath 文件路径
 * @param {string} defaultVal 失败默认返回，默认为空字符
 * @param {BufferEncoding} encoding 文件编码，默认为utf8
 * @returns {string} 返回文件内容
 */
export function getFileContent(fsPath: string, defaultVal = '', encoding: BufferEncoding = 'utf8') {
  try {
    return fs.readFileSync(fsPath, encoding);
  } catch {
    return defaultVal;
  }
}

/**
 * 获取文件内容 （异步）
 * @param {string} fsPath 文件路径
 * @param {string} defaultVal 失败默认返回，默认为空字符
 * @param {BufferEncoding} encoding 文件编码，默认为utf8
 * @returns {string} 返回文件内容
 */
export async function getFileContentAsync(fsPath: string, defaultVal = '', encoding: BufferEncoding = 'utf8') {
  try {
    return await fsAsnyc.readFile(fsPath, encoding);
  } catch {
    return defaultVal;
  }
}

/**
 * 获取 yaml （异步）
 * @param {string} fsPath yaml 文件路径
 * @param {any} defaultVal 获取失败返回的默认值，默认为null
 * @param {BufferEncoding} encoding 文件编码，默认为utf8
 * @returns {Promise<T>} 返回 yaml 转换过后的对象
 */
export async function getYamlAsync<T>(fsPath: string, defaultVal: any = null, encoding: BufferEncoding = 'utf8') {
  try {
    if (fs.existsSync(fsPath)) {
      return yaml.load(await fsAsnyc.readFile(fsPath, encoding)) as T;
    }
  } catch {
    // nothing
  }

  return defaultVal as T;
}

/**
 * 将给定路径的图像文件转换为Base64编码的字符串
 * @param {string} fsPath 图像路径
 * @returns {string} Base64编码的图像字符串
 */
export function getBase64Image(fsPath: string) {
  try {
    return `data:image/png;base64,${fs.readFileSync(fsPath, { encoding: 'base64' })}`;
  } catch {
    return `data:image/png;base64,`;
  }
}

/**
 * 枚举目录
 * @param targetPath 路径
 * @returns {Promise<string[]>} 返回枚举结果
 */
export async function readdirAsync(targetPath: string) { 
  try {
    return await fsAsnyc.readdir(targetPath);
  } catch {
    return [];
  }
}

export async function existsAsync(targetPath: string) { 
  try {
    if (!fs.existsSync(targetPath)) {
      return false;
    }

    const name = path.basename(targetPath);
    const realName = path.basename(await fsAsnyc.realpath(targetPath));
    return name === realName;
  } catch {
    return false;
  }
}