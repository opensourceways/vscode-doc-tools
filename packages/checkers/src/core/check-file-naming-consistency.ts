import path from 'path';
import { existsAsync, readdirAsync } from 'shared';

export const FILE_NAMING_CONSISTENCY_CHECK = 'file-naming-consistency-check';

/**
 * 检查中英文文档名称一致性
 * @param {string} mdPath markdown 文件路径
 * @param {string[]} nameWhiteList 名字白名单
 * @returns {Promise<[boolean, string?]>} 返回检查结果，第一个成员代码是否一致，第二个成员是返回名字相近的文件路径
 */
export async function execCheckFileNamingConsistency(mdPath: string, nameWhiteList: string[] = []): Promise<[boolean, string?]> {
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
