import { DEFAULT_WHITELIST_NAMES, execCheckFileNamingConsistency } from 'checkers';
import { createOutputItem } from '../utils/output';
import { formatLog } from '@/utils/common';

export async function execCheckFileNamingConsistencyCi(filePath: string) {
  const [isFileNamingConsistency, similarfilePath] = await execCheckFileNamingConsistency(filePath, DEFAULT_WHITELIST_NAMES);
  if (!isFileNamingConsistency) {
    const output = createOutputItem({
      filePath,
      checkType: 'file-naming-consistency-check',
      message: similarfilePath ? '中英文文档名称不一致' : `缺少对应的${filePath.includes('/zh/') ? '英文' : '中文'}文档`,
    });

    formatLog(output);
    return [output];
  }

  return [];
}
