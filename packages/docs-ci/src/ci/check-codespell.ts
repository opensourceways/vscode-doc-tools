import { DEFAULT_WHITELIST_WORDS, execCheckCodespell } from 'checkers';

import { formatLog } from '../utils/common';
import { createOutputItem } from '../utils/output';

export async function execCheckCodespellCi(content: string, filePath: string) {
  const results = await execCheckCodespell(content, DEFAULT_WHITELIST_WORDS);

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
