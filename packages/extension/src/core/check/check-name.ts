import * as vscode from 'vscode';
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

  if (!execNameCheck(document.uri.path.split('/').pop() || '', whiteList)) {
    vscode.window.showInformationMessage(`友情提示：${document.uri.path.split('/').pop()} 不符合小写字母加下划线连接的命名规范`);
  }
}
