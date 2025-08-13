import * as vscode from 'vscode';
import { execNameConsistencyCheck } from 'checkers';

import { isConfigEnabled } from '@/utils/common';

/**
 * 检查中英文文档名称一致性
 * @param document 文档对象
 * @returns {boolean} 加入返回 true，未加入返回 false
 */
export async function checkNameConsistency(document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.nameConsistency')) {
    return;
  }

  const fsPath = document.uri.fsPath.replace(/\\/g, '/');
  if (!fsPath.includes('/zh/') && !fsPath.includes('/en/')) {
    return;
  }

  const [result, filePath] = await execNameConsistencyCheck(fsPath, ['README.md']);
  if (!result && filePath) {
    vscode.window.showInformationMessage(`友情提示：${fsPath.split('/').pop()} 中英文文档名称不一致`);
  }
}
