import * as vscode from 'vscode';
import fs from 'fs';
import { execMdInTocCheck } from 'checkers';

import { isConfigEnabled } from '@/utils/common';

/**
 * 检查 markdown 是否加入 _toc.yaml
 * @param document 文档对象
 */
export async function checkMdInToc(document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.toc')) {
    return;
  }

  const fsPath = fs.realpathSync.native(document.uri.fsPath).replace(/\\/g, '/');

  const [isInToc] = await execMdInTocCheck(fsPath);
  if (!isInToc) {
    vscode.window.showInformationMessage(`友情提示：${fsPath.split('/').pop()} 未加入到任何_toc.yaml文件`);
  }
}
