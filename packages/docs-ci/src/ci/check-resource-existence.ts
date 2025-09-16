import path from 'path';
import { execCheckResourceExistence } from 'checkers';

import { formatLog } from '../utils/common';
import { createOutputItem } from '../utils/output';

export async function execCheckResourceExistenceCi(content: string, basePath: string, filePath: string) {
  const results = await execCheckResourceExistence(content, {
    prefixPath: path.dirname(path.join(basePath, filePath)),
  });

  return results.filter((item) => {
    return item.extras === 404;
  }).map((item) => {
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
