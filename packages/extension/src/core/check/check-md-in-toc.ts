import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

import { getYamlContent } from '@/utils/file';
import { TocItem } from '@/@types/toc';
import { isConfigEnabled } from '@/utils/common';

/**
 * 判断 markdown 是否加入 _toc.yaml
 * @param {TocItem} toc toc item
 * @param {string} dirPath 当前目录
 * @param {string} mdPath markdown 路径
 * @returns {boolean} 加入返回 true，未加入返回 false
 */
function isMdInToc(toc: TocItem, dirPath: string, mdPath: string) {
  if (toc && typeof toc.href === 'string' && path.join(dirPath, toc.href).replace(/\\/g, '/') === mdPath) {
    return true;
  }

  if (Array.isArray(toc.sections)) {
    for (const item of toc.sections) {
      if (isMdInToc(item, dirPath, mdPath)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 检查 markdown 是否加入 _toc.yaml
 * @param document 文档对象
 * @returns 
 */
export async function checkMdInToc(document: vscode.TextDocument) {
  if (!isConfigEnabled('docTools.check.toc')) {
    return;
  }

  const mdPath = document.uri.fsPath.replace(/\\/g, '/');
  let dirArr = mdPath.split('/');

  while (dirArr.length) {
    const dirPath = dirArr.join('/');
    const tocPath = path.join(dirPath, '_toc.yaml');
    if (fs.existsSync(tocPath)) {
      const yamlObj = getYamlContent<TocItem>(tocPath);
      if (isMdInToc(yamlObj, dirPath, mdPath)) {
        return;
      }
    }

    dirArr.pop();
  }

  vscode.window.showInformationMessage(`友情提示：${document.uri.path.split('/').pop()} 未加入到任何_toc.yaml文件`);
}
