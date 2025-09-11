import { DEFAULT_WHITELIST_NAMES, execCheckFileNaming } from 'checkers';

import { formatLog } from '../utils/common';
import { createOutputItem } from '../utils/output';

export function execCheckFileNamingCi(filePath: string) {
  if (!execCheckFileNaming(filePath.split('/').pop()!, DEFAULT_WHITELIST_NAMES)) {
    const output = createOutputItem({
      filePath,
      checkType: 'file-naming-check',
      message: '文件名不符合小写字母加下划线连接的命名规范',
    });

    formatLog(output);
    return [output];
  }

  return [];
}
