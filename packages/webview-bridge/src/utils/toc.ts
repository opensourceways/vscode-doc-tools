import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
import { getFileContentAsync, getGitUrlInfo, getMarkdownLevelTitles, getMarkdownTitleId } from 'shared';

/**
 * 转换 upstream
 * @param {object} item item
 * @returns {boolean} 返回转换是否成功
 */
function parseUpstream(item: Record<string, any>) {
  let result = false;

  try {
    // 解析url获取仓库信息
    const { repo, locations } = getGitUrlInfo(item.href.upstream);
    item.upstream = item.href.upstream.replace('_toc.yaml', '');
    if (item.href.path) {
      item.path = item.href.path;
      item.href = path.join(item.href.path, '_toc.yaml');
    } else {
      item.href = path.join(repo, ...locations.slice(2));
    }

    result = true;
  } catch (err) {
    // nothing
  }

  return result;
}

/**
 * 获取 id
 * @param {object} item 菜单项
 * @returns {string} 返回id
 */
function getId(item: Record<string, any>, recordIds: Set<string>) {
  if (item.href && !recordIds.has(item.href)) {
    recordIds.add(item.href);
    return item.href;
  }

  if (item.path && !recordIds.has(item.path)) {
    recordIds.add(item.path);
    return item.path;
  }

  if (item.label) {
    if (!recordIds.has(item.label)) {
      recordIds.add(item.label);
      return item.label;
    } else {
      let i = 1;
      while (recordIds.has(`${item.label}${i}`)) {
        i++;
      }
      return `${item.label}${i}`;
    }
  }

  return String(Math.random());
}

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

/**
 * 转换 toc
 * @param {Record<string, any>} toc toc
 * @param {string} tocDirPath toc 目录
 * @param {Set<string>} recordIds 记录的 id
 */
function parseToc(toc: Record<string, any>, tocDirPath: string, recordIds = new Set<string>()) {
  if (!toc) {
    return;
  }

  if (Array.isArray(toc.sections)) {
    for (const item of toc.sections) {
      parseToc(item, tocDirPath, recordIds);
    }
  }

  if (typeof toc?.href?.upstream === 'string' && !parseUpstream(toc)) {
    return;
  }

  if (typeof toc.href === 'string') {
    toc.type = 'page';
    toc.href = path.join(tocDirPath, toc.href).replace(/\\/g, '/');
    toc.id = getId(toc, recordIds);

    if (!Array.isArray(toc.sections)) {
      if (fs.existsSync(toc.href)) {
        toc.sections = getMarkdownLevelTitles(fs.readFileSync(toc.href, 'utf-8'), 2).map((item) => {
          return {
            type: 'anchor',
            label: item,
            id: `${toc.id}#${getMarkdownTitleId(item)}`,
            href: `${toc.href}#${getMarkdownTitleId(item)}`,
          };
        });
      } else {
        toc.nonexistent = true;
      }
    }
  } else {
    toc.id = getId(toc, recordIds);
    toc.type = 'menu';
  }
}

/**
 * 通过 markdown 路径获取相关的 toc
 * @param {string} fsPath md 路径
 * @returns {Record<string, any>} 返回 toc
 */
export async function getTocByMdPath(fsPath: string) {
  if (!fs.existsSync(fsPath)) {
    return null;
  }

  const mdPath = fsPath.replace(/\\/g, '/');
  let dirArr = mdPath.split('/');
  let dirPath = '';
  let found = false;
  let tocPath: string | null = null;
  let tocObj: Record<string, any> | null = null;

  while (dirArr.length) {
    dirPath = dirArr.join('/');
    tocPath = path.join(dirPath, '_toc.yaml');
    if (fs.existsSync(tocPath)) {
      try {
        const content = await getFileContentAsync(tocPath);
        tocObj = yaml.load(content) as Record<string, any>;
        if (isMdInToc(tocObj, dirPath, mdPath)) {
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
    parseToc(tocObj!, dirPath);
    return {
      tocPath: tocPath!.replace(/\\/g, '/'),
      tocObj,
    };
  }

  return null;
}
