import { execCheckTagClosed } from 'checkers';

import { formatLog } from '../utils/common';
import { createOutputItem } from '../utils/output';

export async function execCheckTagClosedCi(content: string, filePath: string) {
  const results = await execCheckTagClosed(content);
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
    output.message = output.message.replace(/</g, '\\<');
    output.content = output.content!.replace(/</g, '\\<');
    return output;
  });
}
