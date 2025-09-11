import { execSync } from 'child_process';

/**
 * 获取仓库变更的文件列表
 * @param {string} repoPath 仓库存放路径
 * @returns {string[]} 文件列表
 */
export function getGitChangedFiles(repoPath: string) {
  try {
    return execSync(`git log -1 --name-only --pretty=format: --diff-filter=AMR`, {
      cwd: repoPath,
      encoding: 'utf-8',
    })
      .trim()
      .split('\n');
  } catch {
    return [];
  }
}
