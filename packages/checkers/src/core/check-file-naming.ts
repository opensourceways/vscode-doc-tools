export const FILE_NAMING_CHECK = 'file-naming-check';

export function isSnakeCase(str: string) {
  const snakeCaseRegex = /^[a-z0-9]*(_[a-z0-9]+)*$/;
  return snakeCaseRegex.test(str);
}

/**
 * 检查文件名称是否符合命名规范
 * @param {string} name 名称
 * @param {string[]} nameWhiteList 名字白名单
 * @returns {boolean} 返回检查结果
 */
export function execCheckFileNaming(name: string, nameWhiteList: string[] = []) {
  return nameWhiteList.includes(name) || isSnakeCase(name);
}
