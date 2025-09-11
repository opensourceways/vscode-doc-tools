import path from 'path';
import { execCheckToc } from 'checkers';

import { formatLog } from '../utils/common';
import { createOutputItem } from '../utils/output';

export async function execCheckTocCi(content: string, basePath: string, filePath: string) {
  const results = await execCheckToc(content, path.dirname(path.join(basePath, filePath)));
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
