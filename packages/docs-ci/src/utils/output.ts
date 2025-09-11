import { OutputItemT } from '../@types/output';
import { getLineRange } from './common';

export function createOutputItem(info: {
  filePath: string;
  checkType?: string;
  message: string;
  fileContent?: string;
  errorContent?: string;
  errorContentStartIndex?: number;
  errorContentEndIndex?: number;
}) {
  const item: Record<string, any> = {
    filePath: info.filePath,
    message: info.message,
  };

  if (info.checkType) {
    item.checkType = info.checkType;
  }

  if (info.errorContent) {
    item.content = info.errorContent;
  }

  if (info.fileContent && info.errorContentStartIndex !== undefined && info.errorContentEndIndex !== undefined) {
    const { startLine, endLine } = getLineRange(info.fileContent, info.errorContentStartIndex, info.errorContentEndIndex);
    if (startLine === endLine) {
      item.position = `第 ${startLine} 行`;
    } else {
      item.position = `第 ${startLine} - ${endLine} 行`;
    }
  }

  return item as OutputItemT;
}
