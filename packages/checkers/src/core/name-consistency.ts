import fs from 'fs';
import path from 'path';
import { existsAsync, readdirAsync } from 'shared';
import { CheckResultT } from 'src/@types/result';

/**
 * 检查中英文文档名称一致性
 * @param {string} mdPath markdown 文件路径
 * @param {string[]} nameWhiteList 名字白名单
 * @returns {Promise<[boolean, string?]>} 返回检查结果，第一个成员代码是否一致，第二个成员是返回名字相近的文件路径
 */
export async function execNameConsistencyCheck(mdPath: string, nameWhiteList: string[] = []): Promise<[boolean, string?]> {
  const mdName = mdPath.replace(/\\/g, '/').split('/').pop()!;
  if (nameWhiteList.includes(mdName)) {
    return [true];
  }

  const localePath = mdPath.includes('/zh/') ? mdPath.replace('/zh/', '/en/') : mdPath.replace('/en/', '/zh/');
  if (await existsAsync(localePath)) {
    return [true];
  }

  const filenames = await readdirAsync(path.dirname(localePath));
  const snakeLowerName = mdName.toLowerCase().replace(/-/g, '_');
  for (const filename of filenames) {
    if (filename.toLowerCase().replace(/-/g, '_') === snakeLowerName) {
      return [false, path.join(path.dirname(localePath), filename).replace(/\\/g, '/')];
    }
  }

  return [false];
}

/**
 * 遍历目录
 * @param {string} dirPath 目录路径
 * @param {string[]} nameWhiteList 名字白名单
 * @param {CheckResultT<string>[]} results 之前收集的结果
 * @returns {CheckResultT<string>[]} 返回检查结果
 */
async function walkDir(dirPath: string, nameWhiteList: string[] = [], results: CheckResultT<string>[] = []) {
  const files = await readdirAsync(dirPath);
  for (const name of files) {
    const completePath = path.join(dirPath, name).replace(/\\/g, '/');
    if (fs.statSync(completePath).isDirectory()) {
      await walkDir(completePath, nameWhiteList, results);
    } else if (name.endsWith('.md') && !nameWhiteList.includes(name)) {
      const [result, filePath] = await execNameConsistencyCheck(completePath, nameWhiteList);
      if (!result) {
        results.push({
          content: completePath,
          message: filePath ? '中英文名称不一致' : completePath.includes('/zh/') ? '不存在对应的英文文档' : '不存在对应的中文文档',
          start: 0,
          end: 0,
          extras: filePath || '',
        });
      }
    }
  }

  return results;
}

/**
 * 检查中英文文档名称一致性
 * @param {string} dirPath 目录路径
 * @param {string[]} nameWhiteList 名字白名单
 * @returns {Promise<[boolean, string?]>} 返回检查结果，第一个成员代码是否一致，第二个成员是返回名字相近的名称
 */
export function execMultiNameConsistencyCheck(dirPath: string, nameWhiteList: string[] = []): Promise<CheckResultT<string>[]> {
  return walkDir(dirPath, nameWhiteList);
}
