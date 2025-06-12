import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

import { getYamlContent } from '../utils/file.js';
import { TocItem } from '../@types/toc.js';

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

export async function checkMdInToc(document: vscode.TextDocument) {
  const mdPath = path.dirname(document.uri.fsPath).replace(/\\/g, '/');
  let dirArr = mdPath.split('/');
  
  while (dirArr.length) {
    const dirPath = dirArr.join('/');
    const tocPath = path.join(dirPath, '_toc.yaml');
    if (fs.existsSync(tocPath)) {
      const yamlObj = getYamlContent(tocPath) as TocItem;
      if (isMdInToc(yamlObj, dirPath, mdPath)) {
        return;
      }
    }

    dirArr.pop();
  }

  vscode.window.showInformationMessage(`友情提示：${document.uri.path.split('/').pop()} 未加入到任何_toc.yaml文件`);
}
