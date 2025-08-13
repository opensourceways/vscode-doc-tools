import fs from 'fs';
import path from 'path';
import { CheckResultT } from '../@types/result';

export function isSnakeCase(str: string) {
  const snakeCaseRegex = /^[a-z0-9\.\+]*(_[a-z0-9\.\+]+)*$/;
  return snakeCaseRegex.test(str);
}

/**
 * 遍历目录
 * @param {string} dirPath 目录路径
 * @param {string[]} nameWhiteList 名字白名单
 * @param {CheckResultT<string>[]} results 之前收集的结果
 * @returns {CheckResultT<string>[]} 返回检查结果
 */
function walkDir(dirPath: string, nameWhiteList: string[] = [], results: CheckResultT<string>[] = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((name) => {
    const completePath = path.join(dirPath, name);
    const stas = fs.statSync(completePath);

    if ((stas.isDirectory() || name.endsWith('.md')) && !name.includes('_LTS_SP') && !nameWhiteList.includes(name) && !isSnakeCase(name)) {
      let tempPath = completePath.replace(/\\/g, '/');
      tempPath = tempPath.startsWith('/') ? `.${tempPath}` : tempPath;
      results.push({
        content: tempPath,
        message: '',
        start: 0,
        end: 0,
        extras: stas.isDirectory() ? 'directory' : 'file',
      });
    }

    if (fs.statSync(completePath).isDirectory()) {
      walkDir(completePath, nameWhiteList, results);
    }
  });

  return results;
}

/**
 * 检查文件/目录名是否符合命名规范
 * @param {string} dirPath 目录路径
 * @param {string[]} nameWhiteList 名字白名单
 * @returns {CheckResultT<string>[]} 返回检查结果
 */
export function execFilenameAndDirnameCheck(dirPath: string, nameWhiteList: string[] = []) {
  return walkDir(dirPath, nameWhiteList);
}

/**
 * 检查名称是否符合命名规范
 * @param {string} name 名称
 * @param {string[]} nameWhiteList 名字白名单
 * @returns {boolean} 返回检查结果
 */
export function execNameCheck(name: string, nameWhiteList: string[] = []) {
  return nameWhiteList.includes(name) || isSnakeCase(name);
}
