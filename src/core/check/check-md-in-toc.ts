import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

import { getYamlContent } from '@/utils/file';
import { TocItem } from '@/@types/toc';
import { isConfigEnabled } from '@/utils/common';
import { isMdInToc } from '@/utils/markdwon';

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
