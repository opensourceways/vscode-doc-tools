import { OutputItemT } from "../@types/output";

export function getLineRange(content: string, startPos: number, endPos: number) {
  const lines = content.split('\n');
  let currentPos = 0;
  let startLine = 1;
  let endLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length + 1; // +1 for \n

    // 检查起始位置是否在当前行
    if (startPos >= currentPos && startPos < currentPos + lineLength) {
      startLine = i + 1;
    }

    // 检查结束位置是否在当前行
    if (endPos >= currentPos && endPos < currentPos + lineLength) {
      endLine = i + 1;
      break;
    }

    currentPos += lineLength;
  }

  return {
    startLine,
    endLine,
  };
}

export function formatLog(output: OutputItemT) {
  console.log('--------------------------------------------------');
  console.log('[文件路径]：', output.filePath);
  if (output.position) {
    console.log('[错误位置]：', output.position);
  }
  
  console.log('[检查类型]：', output.checkType);
  console.log('[错误信息]：', output.message);

  if (output.content) {
    console.log('[错误内容]：', output.content);
  }
}
