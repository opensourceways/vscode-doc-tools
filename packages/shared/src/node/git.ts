import { execSync } from 'child_process';

/**
 * 获取仓库变更的文件列表
 * @param {string} repoPath 仓库存放路径
 * @returns {string[]} 文件列表
 */
export function getGitChangedFiles(repoPath: string) {
  try {
    const lines = execSync(`git show --numstat`, {
      cwd: repoPath,
      encoding: 'utf-8',
    })
      .trim()
      .split('\n');

    const changed: string[] = [];
    for (const line of lines) {
      const sp = line.split(/\t/);
      if (sp.length < 3) {
        continue;
      }
      
      const additions = Number(sp[0].trim());
      if (isNaN(additions)) {
        continue;
      }

      const deletions = Number(sp[1].trim());
      // 跳过删除
      if (additions === 0 && deletions > 0) {
        continue;
      }

      let filePath = sp[2].trim();
      if (filePath.includes('=>')) {
        filePath = filePath.split('{')[0] + filePath.split('=>')[1].replace('}', '').replace('{', '').trim();
      }

      changed.push(filePath);
    }

    return changed;
  } catch {
    return [];
  }
}
