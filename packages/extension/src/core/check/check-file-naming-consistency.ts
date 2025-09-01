import * as vscode from 'vscode';
import fs from 'fs';
import { execFileNamingConsistencyCheck } from 'checkers';

import { isConfigEnabled } from '@/utils/common';

/**
 * 是否启用，过渡性配置，用于迁移配置项
 * @returns 是否启用
 */
function isEnabled() {
  if (isConfigEnabled('docTools.check.nameConsistency')) {
    vscode.workspace.getConfiguration('docTools.check.fileNamingConsistency').update('enable', true, vscode.ConfigurationTarget.Global)
    vscode.workspace.getConfiguration('docTools.check.nameConsistency').update('enable', undefined, vscode.ConfigurationTarget.Global);
    return true;
  }

  return isConfigEnabled('docTools.check.fileNamingConsistency');
}

/**
 * 检查中英文文档名称一致性
 * @param document 文档对象
 * @returns {boolean} 加入返回 true，未加入返回 false
 */
export async function checkFileNamingConsistency(document: vscode.TextDocument) {
  if (!isEnabled()) {
    return;
  }

  const fsPath = fs.realpathSync.native(document.uri.fsPath).replace(/\\/g, '/');
  if (!fsPath.includes('/zh/') && !fsPath.includes('/en/')) {
    return;
  }

  const [result, filePath] = await execFileNamingConsistencyCheck(fsPath, ['README.md']);
  if (result) {
    return;
  }

  if (filePath) {
    vscode.window.showInformationMessage(`友情提示：${fsPath.split('/').pop()} 中英文文档名称不一致`);
  } else {
    vscode.window.showInformationMessage(`友情提示：${fsPath.split('/').pop()} 缺少对应的${fsPath.includes('/zh/') ? '英文' : '中文'}文档`);
  }
}
