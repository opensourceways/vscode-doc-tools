import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

import type { TocItem } from '@/@types/toc';
import { getFileContent, getYamlContent } from '@/utils/file';
import { getMarkdownTitle } from '@/utils/markdwon';

/**
 * 获取已经加入 toc item 的 markdown 路径
 * @param {TocItem[]} sections toc item数组
 * @param {string} dirPath 目标路径
 * @param {Map<string, TocItem>} map 已收集的map，首次调用无需传递，用于递归收集传参
 * @returns {Map<string, TocItem>} 已收集的map
 */
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

/**
 * 获取 toc item
 * @param {string} dirPath 目标路径
 * @returns {TocItem} 返回 toc item
 */
function getManualToc(dirPath: string) {
  // 获取原本的_toc.yaml
  const toc = getYamlContent<TocItem>(path.join(dirPath, '_toc.yaml'));
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
      const completedPath = path.join(targetPath, name).replace(/\\/g, '/');

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
      const title = getMarkdownTitle(getFileContent(completedPath));
      if (!title) {
        vscode.window.showWarningMessage(`标题不存在：${name}`);
        return;
      }

      // 跳过已有的md
      const relativePath = `.${completedPath.replace(dirPath, '')}`;
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

/**
 * 生成指南 _toc.yaml
 * @param {vscode.Uri} uri 目标目录 uri
 * @returns 
 */
export async function genTocManual(uri: vscode.Uri) {
  const dirPath = uri.fsPath.replace(/\\/g, '/');

  if (!fs.existsSync(dirPath)) {
    vscode.window.showErrorMessage(`路径不存在：${dirPath}`);
    return;
  }

  if (!fs.statSync(dirPath).isDirectory()) {
    vscode.window.showErrorMessage(`非目录路径：${dirPath}`);
    return;
  }

  if (!dirPath.includes('docs/zh') && !dirPath.includes('docs/en')) {
    vscode.window.showErrorMessage(`非文档下的 zh 或 en 目录：${dirPath}`);
    return;
  }

  const toc = getManualToc(dirPath);
  if (toc.sections?.length === 0) {
    vscode.window.showErrorMessage(`未收集到有效的 markdown 信息，请检查当前目录下是否存在 markdown，或 markdown 是否存在标题。目录路径：（${dirPath}）`);
    return;
  }

  const tocPath = path.join(dirPath, '_toc.yaml');
  fs.writeFileSync(tocPath, yaml.dump(toc), 'utf8');
  const doc = await vscode.workspace.openTextDocument(tocPath);
  vscode.window.showTextDocument(doc);
}
