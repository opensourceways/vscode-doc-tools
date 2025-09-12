import { DEFAULT_MD_CONFIG, execMarkdownlint } from 'checkers';

import { formatLog } from '../utils/common';
import { createOutputItem } from '../utils/output';

export async function execMarkdownlintCi(content: string, filePath: string) {
  const [results] = await execMarkdownlint(content, DEFAULT_MD_CONFIG);
  return results.map((item) => {
    const output = createOutputItem({
      fileContent: content,
      filePath,
      checkType: item.name,
      message: `${item.extras?.split(',')?.[0] || ''}：${item.message.zh}`,
      errorContent: item.content,
      errorContentStartIndex: item.start,
      errorContentEndIndex: item.end,
    });

    formatLog(output);
    return output;
  });
}
