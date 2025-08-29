import * as vscode from 'vscode';
import fs from 'fs';
import { execFileNamingCheck } from 'checkers';

import { isConfigEnabled } from '@/utils/common';

/**
 * 是否启用，过渡性配置，用于迁移配置项
 * @returns 是否启用
 */
function isEnabled() {
  if (isConfigEnabled('docTools.check.name')) {
    vscode.workspace.getConfiguration('docTools.check.fileNaming.enable').update('enable', true, vscode.ConfigurationTarget.Global)
    vscode.workspace.getConfiguration('docTools.check.name').update('enable', undefined, vscode.ConfigurationTarget.Global);
    return true;
  }

  return isConfigEnabled('docTools.check.fileNaming.enable');
}

/**
 * 检查 文件/目录命名规范
 * @param document 文档对象
 * @returns {boolean} 加入返回 true，未加入返回 false
 */
export async function checkFileNaming(document: vscode.TextDocument) {
  if (!isEnabled()) {
    return;
  }

  const config = vscode.workspace.getConfiguration('docTools.check.name');
  const whiteList = config.get<string[]>('whiteList', []);
  const fsPath = fs.realpathSync.native(document.uri.fsPath).replace(/\\/g, '/');

  if (!execFileNamingCheck(fsPath.split('/').pop() || '', whiteList)) {
    vscode.window.showInformationMessage(`友情提示：${fsPath.split('/').pop()} 不符合小写字母加下划线连接的命名规范`);
  }
}
