import path from 'path';
import { existsAsync, getYamlAsync } from 'shared';

import { TocItem } from '../@types/toc';

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
 * @param {string} markdownPath markdown 路径
 * @returns {Promise<[boolean, string?]>} 返回检查结果，第一个元素为是否加入，第二个元素为 _toc.yaml 路径
 */
export async function execCheckMdInToc(markdownPath: string): Promise<[boolean, string?]> {
  const mdPath = markdownPath.replace(/\\/g, '/');
  let isInToc = false;
  let dirArr = mdPath.split('/');
  let tocPath = '';

  while (dirArr.length) {
    const dirPath = dirArr.join('/');
    tocPath = path.join(dirPath, '_toc.yaml');
    if (await existsAsync(tocPath)) {
      const yamlObj = await getYamlAsync<TocItem>(tocPath);
      if (isMdInToc(yamlObj, dirPath, mdPath)) {
        isInToc = true;
        break;
      }
    }

    dirArr.pop();
  }

  return [isInToc, isInToc ? tocPath : undefined];
}
