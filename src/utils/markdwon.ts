import path from 'path';
import { TocItem } from '@/@types/toc';

/**
 * 获取 markdown 标题
 * @param {string} content markdown 内容
 * @returns {string} 返回标题
 */
export function getMarkdownTitle(content: string) {
  for (const line of content.split('\n')) {
    if (line.trim().startsWith('# ')) {
      return line.replace('# ', '').trim();
    }
  }

  return '';
}

/**
 * 获取屏蔽 html 注释和代码块的 markdown 内容
 * @param {string} content markdown 内容
 * @returns {string} 返回过滤后的内容
 */
export function getMarkdownFilterContent(content: string) {
  return content.replace(/<!--[\s\S]*?-->|```[\s\S]*?```|`[^`]*`/g, (text) => {
    return text.replace(/\S/g, ' ');
  });
}

/**
 * 判断 markdown 是否加入 _toc.yaml
 * @param {TocItem} toc toc item
 * @param {string} dirPath 当前目录
 * @param {string} mdPath markdown 路径
 * @returns {boolean} 加入返回 true，未加入返回 false
 */
export function isMdInToc(toc: TocItem, dirPath: string, mdPath: string) {
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
