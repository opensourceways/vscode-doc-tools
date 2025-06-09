import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

import type { TocItem, Toc } from '../@types/toc.js';
import { getFileContent, getYamlContent } from '../utils/file.js';
import { getTitle } from '../utils/markdwon.js';

function checkAndGetHrefMap(sections: TocItem[], dirPath: string, map = new Map<string, TocItem>()) {
  for (let i = sections.length - 1; i >= 0; i--) {
    const item = sections[i];

    // 有可能是远程地址跳过
    if (typeof item.href !== 'string') {
      continue;
    }

    // 存在则加入map，不存在则移除元素
    if (fs.existsSync(path.join(dirPath, item.href))) {
      map.set(item.href, item);
    } else {
      sections.splice(i, 1);
    }

    if (item.sections?.length) {
      checkAndGetHrefMap(item.sections, dirPath, map);
    }
  }

  return map;
}

function getManualToc(dirPath: string) {
  // 获取原本的_toc.yaml
  const toc = getYamlContent(path.join(dirPath, '_toc.yaml')) as Toc;
  toc.isManual = true;
  if (!toc.label) {
    toc.label = '';
  }

  if (!Array.isArray(toc.sections)) {
    toc.sections = [];
  }

  // 获取已有href
  const hrefMap = checkAndGetHrefMap(toc.sections, dirPath);

  // 遍历目录加入sections
  const walkDir = (targetPath: string) => {
    fs.readdirSync(targetPath).forEach((name) => {
      const completedPath = path.join(targetPath, name);

      // 目录继续处理
      if (fs.statSync(completedPath).isDirectory()) {
        walkDir(completedPath);
        return;
      }

      // 跳过非md文件
      if (!name.endsWith('.md')) {
        return;
      }

      // 跳过没有标题的md
      const title = getTitle(getFileContent(completedPath));
      if (!title) {
        return;
      }

      // 跳过已有的md
      const relativePath = `.${completedPath.replace(dirPath, '').replace(/\\/g, '/')}`;
      const item = hrefMap.get(relativePath);
      if (item) {
        // 更新label
        if (item.label !== title) {
          item.label = title;
        }

        return;
      }

      toc.sections!!.push({
        label: title,
        href: relativePath,
      });
    });
  };

  walkDir(dirPath);

  return toc;
}

export default async function genToc(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    vscode.window.showErrorMessage(`${dirPath} 不存在`);
  }

  if (!fs.statSync(dirPath).isDirectory()) {
    vscode.window.showErrorMessage(`${dirPath} 不是一个目录`);
  }

  const toc = getManualToc(dirPath);
  const tocPath = path.join(dirPath, '_toc.yaml');
  fs.writeFileSync(tocPath, yaml.dump(toc), 'utf8');
  const doc = await vscode.workspace.openTextDocument(tocPath);
  vscode.window.showTextDocument(doc);
}
