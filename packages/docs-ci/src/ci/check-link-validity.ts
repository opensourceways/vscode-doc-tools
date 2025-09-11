import path from 'path';
import { DEFAULT_WHITELIST_URLS, execCheckLinkValidity } from 'checkers';

import { formatLog } from '../utils/common';
import { createOutputItem } from '../utils/output';

export async function execCheckLinkValidityCi(content: string, basePath: string, filePath: string) {
  const results = await execCheckLinkValidity(content, {
    whiteList: DEFAULT_WHITELIST_URLS,
    prefixPath: path.dirname(path.join(basePath, filePath)),
  });

  return results.map((item) => {
    const output = createOutputItem({
      fileContent: content,
      filePath,
      checkType: item.name,
      message: item.message.zh,
      errorContent: item.content,
      errorContentStartIndex: item.start,
      errorContentEndIndex: item.end,
    });

    formatLog(output);
    return output;
  });
}
