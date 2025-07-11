import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { getMarkdownLevelTitles, getMarkdownTitleId } from './markdown';

/**
 * 判断 markdown 是否加入 _toc.yaml
 * @param {Record<string, any>} toc toc item
 * @param {string} dirPath 当前目录
 * @param {string} mdPath markdown 路径
 * @returns {boolean} 加入返回 true，未加入返回 false
 */
function isMdInToc(toc: Record<string, any>, dirPath: string, mdPath: string) {
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

function parseToc(toc: Record<string, any>, tocDirPath: string, mdPath: string) {
  if (!toc) {
    return;
  }

  toc.id = `${Math.random()}-${Math.random()}`;
  if (typeof toc.href === 'string') {
    toc.type = 'page';
    toc.href = path.join(tocDirPath, toc.href).replace(/\\/g, '/');
    if (toc.href === mdPath && !Array.isArray(toc.sections)) {
      toc.sections = getMarkdownLevelTitles(fs.readFileSync(toc.href, 'utf-8')).map((item) => ({
        type: 'anchor',
        label: item,
        id: `${Math.random()}-${Math.random()}`,
        href: `${mdPath}#${getMarkdownTitleId(item)}`,
      }));
    }
  } else {
    toc.type = 'menu';
  }

  if (Array.isArray(toc.sections)) {
    for (const item of toc.sections) {
      parseToc(item, tocDirPath, mdPath);
    }
  }
}

export async function getRelativeToc(fsPath: string) {
  if (!fs.existsSync(fsPath)) {
    return null;
  }

  const mdPath = fsPath.replace(/\\/g, '/');
  let dirArr = mdPath.split('/');
  let dirPath = '';
  let found = false;
  let yamlObj: Record<string, any> | null = null;

  while (dirArr.length) {
    dirPath = dirArr.join('/');
    const tocPath = path.join(dirPath, '_toc.yaml');
    if (fs.existsSync(tocPath)) {
      try {
        yamlObj = yaml.load(fs.readFileSync(tocPath, 'utf8')) as Record<string, any>;
        if (isMdInToc(yamlObj, dirPath, mdPath)) {
          found = true;
          break;
        }
      } catch {
        // nothing to do
      }
    }

    dirArr.pop();
  }

  if (found) {
    parseToc(yamlObj!, dirPath, mdPath);
    return yamlObj;
  }

  return null;
}
