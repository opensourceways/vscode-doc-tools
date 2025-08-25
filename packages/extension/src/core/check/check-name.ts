import * as vscode from 'vscode';
import fs from 'fs';
import { execNameCheck } from 'checkers';

import { isConfigEnabled } from '@/utils/common';

/**
 * 检查 文件/目录命名规范
 * @param document 文档对象
 * @returns {boolean} 加入返回 true，未加入返回 false
 */
export async function checkName(document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.name')) {
    return;
  }

  const config = vscode.workspace.getConfiguration('docTools.check.name');
  const whiteList = config.get<string[]>('whiteList', []);
  const fsPath = fs.realpathSync.native(document.uri.fsPath).replace(/\\/g, '/');

  if (!execNameCheck(fsPath.split('/').pop() || '', whiteList)) {
    vscode.window.showInformationMessage(`友情提示：${fsPath.split('/').pop()} 不符合小写字母加下划线连接的命名规范`);
  }
}
