import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { stringify } from 'yaml';
import { existsAsync, getFileContentAsync, getMarkdownPureTitle, getMarkdownTitle, getYamlAsync } from 'shared';

import type { TocItem } from '@/@types/toc';
import { triggerPreviewMarkdownContentChange } from './cmd-preview-markdown';

/**
 * 获取已经加入 toc item 的 markdown 路径
 * @param {TocItem[]} sections toc item数组
 * @param {string} dirPath 目标路径
 * @param {Map<string, TocItem>} map 已收集的map，首次调用无需传递，用于递归收集传参
 * @returns {Map<string, TocItem>} 已收集的map
 */
async function checkAndGetHrefMap(sections: TocItem[], dirPath: string, map = new Map<string, TocItem>()) {
  for (let i = sections.length - 1; i >= 0; i--) {
    const item = sections[i];

    // 有可能是远程地址跳过
    if (typeof item.href !== 'string') {
      continue;
    }

    // 存在则加入map，不存在则移除元素
    if (await existsAsync(path.join(dirPath, item.href))) {
      map.set(item.href, item);
    } else {
      sections.splice(i, 1);
    }

    if (item.sections?.length) {
      await checkAndGetHrefMap(item.sections, dirPath, map);
    }
  }

  return map;
}

/**
 * 获取 toc item
 * @param {string} dirPath 目标路径
 * @returns {TocItem} 返回 toc item
 */
async function getManualToc(dirPath: string) {
  // 获取原本的_toc.yaml
  const toc = await getYamlAsync<TocItem>(path.join(dirPath, '_toc.yaml'), {});
  toc.isManual = true;
  if (!toc.label) {
    toc.label = '';
  }

  if (!Array.isArray(toc.sections)) {
    toc.sections = [];
  }

  // 获取已有href
  const hrefMap = await checkAndGetHrefMap(toc.sections, dirPath);

  // 遍历目录加入sections
  const walkDir = async (targetPath: string) => {
    for (const name of fs.readdirSync(targetPath)) {
      const completePath = path.join(targetPath, name).replace(/\\/g, '/');

      // 目录继续处理
      if (fs.statSync(completePath).isDirectory()) {
        walkDir(completePath);
        continue;
      }

      // 跳过非md文件
      if (!name.endsWith('.md')) {
        continue;
      }

      // 跳过没有标题的md
      const content = await getFileContentAsync(completePath);
      const title = getMarkdownPureTitle(getMarkdownTitle(content));
      if (!title) {
        vscode.window.showWarningMessage(`标题不存在：${name}`);
        continue;
      }

      // 跳过已有的md
      const relativePath = `.${completePath.replace(dirPath, '')}`;
      const item = hrefMap.get(relativePath);
      if (item) {
        // 更新label
        if (item.label !== title) {
          item.label = title;
        }

        continue;
      }

      toc.sections!!.push({
        label: title,
        href: relativePath,
      });
    }
  };

  await walkDir(dirPath);

  return toc;
}

/**
 * 生成指南 _toc.yaml
 * @param {vscode.Uri} uri 目标目录 uri
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

  const toc = await getManualToc(dirPath);
  if (toc.sections?.length === 0) {
    vscode.window.showErrorMessage(`未收集到有效的 markdown 信息，请检查当前目录下是否存在 markdown，或 markdown 是否存在标题。目录路径：（${dirPath}）`);
    return;
  }

  const tocPath = path.join(dirPath, '_toc.yaml');
  fs.writeFileSync(tocPath, stringify(toc), 'utf8');
  const doc = await vscode.workspace.openTextDocument(tocPath);
  vscode.window.showTextDocument(doc);
  triggerPreviewMarkdownContentChange(doc);
}
