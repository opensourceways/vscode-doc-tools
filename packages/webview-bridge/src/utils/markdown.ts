import * as vscode from 'vscode';
import path from 'path';
import { createMarkdownRenderer } from 'markdown';
import { getBase64Image } from './resource';

const REG_IMG_TAG = /<img\s+[^>]*src="([^"]+)"[^>]*>/;

export function createDocMarkdownRenderer(uri: vscode.Uri) {
  const fsDir = path.dirname(uri.fsPath);
  return createMarkdownRenderer(fsDir, {
    math: true,
    theme: {
      light: 'light-plus',
      dark: 'dark-plus',
    },
    config: (md) => {
      md.renderer.rules.code_inline = (tokens, idx) => {
        const content = tokens[idx].content;
        // 转义
        const escapedContent = md.utils.escapeHtml(content);
        // 处理双花括号
        return `<code v-pre>${escapedContent}</code>`;
      };

      // 替换 {{ }} 内容
      md.renderer.rules.text = (tokens, idx) => {
        const content = tokens[idx].content;
        const escapedContent = md.utils.escapeHtml(content);
        if (/{{(.*?)}}/g.test(content)) {
          return `<span v-pre>${escapedContent}</span>`;
        }
        return escapedContent;
      };

      // 标题处理
      md.renderer.rules.heading_open = function (tokens, idx, options, _, self) {
        const aIndex = tokens[idx].attrIndex('id');
        const id = tokens[idx].attrs?.[aIndex]?.[1];
        const tag = tokens[idx].tag;
        const render = self.renderToken(tokens, idx, options);
        return `${render}${tag === 'h1' || tag === 'h2' ? `<MarkdownTitle title-id="${id || ''}">` : ''}`;
      };

      md.renderer.rules.heading_close = function (tokens, idx, options, _, self) {
        const tag = tokens[idx].tag;
        return `${tag === 'h1' || tag === 'h2' ? '</MarkdownTitle>' : ''}${self.renderToken(tokens, idx, options)}`;
      };

      // 图片
      const imageRender = md.renderer.rules.image;
      md.renderer.rules.image = (tokens, idx, options, env, self) => {
        const srcIndex = tokens[idx].attrIndex('src');
        if (tokens[idx]?.attrs?.[srcIndex]?.[1]) {
          tokens[idx].attrs[srcIndex][1] = getBase64Image(path.join(fsDir, tokens[idx].attrs[srcIndex][1]));
        }

        return `<MarkdownImage>${imageRender!(tokens, idx, options, env, self)}</MarkdownImage>`;
      };

      // 处理文档里写的html标签
      const defaultHtmlBlockRender = md.renderer.rules.html_block;
      md.renderer.rules.html_block = (tokens, idx, options, env, self) => {
        const content = tokens[idx].content;
        let renderContent = defaultHtmlBlockRender!!(tokens, idx, options, env, self);
        if (content.includes('<img')) {
          const match = renderContent.match(REG_IMG_TAG);
          if (match) {
            renderContent = renderContent.replace(match[1], getBase64Image(path.join(fsDir, match[1])));
          }

          return `<MarkdownImage>${renderContent.replace(/(width|height)=['|"](.*?)['|"]/g, '')}</MarkdownImage>`;
        }

        return renderContent;
      };

      const defaultHtmlInlineRender = md.renderer.rules.html_inline;
      md.renderer.rules.html_inline = function (tokens, idx, options, env, self) {
        const content = tokens[idx].content;
        let renderContent = defaultHtmlInlineRender!!(tokens, idx, options, env, self);
        if (content.includes('<img')) {
          const match = renderContent.match(REG_IMG_TAG);
          if (match) {
            renderContent = renderContent.replace(match[1], getBase64Image(path.join(fsDir, match[1])));
          }

          return `<MarkdownImage>${renderContent.replace(/(width|height)=['|"](.*?)['|"]/g, '')}</MarkdownImage>`;
        }

        return renderContent;
      };
    },
  });
}

/**
 * 去除一些 md 符号，只保留文本
 * @param {string} href 链接
 */
export function getMarkdownTitleId(title: string) {
  return title
    .replace(/\*\*([^*]+)\*\*/g, '$1') // 去除加粗（**）
    .replace(/\*([^*]+)\*/g, '$1') // 去除斜体（*）
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 去除链接
    .replace(/<[^>]+>/g, '') // 去除 HTML 标签
    .replace(/`/g, '') // 去除反引号
    .normalize('NFKD')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '')
    .replace(/[\u0300-\u036F]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase();
}

export function getMarkdownLevelTitles(content: string, level = 1) {
  if (!content || isNaN(level) || level < 1 || level > 6) {
    return [];
  }

  const result: string[] = [];
  const titlePrefix = Array(level).fill('#').join('');
  content.split('\n').forEach((line) => {
    const tirmStr = line.trim();
    if (tirmStr.startsWith(titlePrefix)) {
      const title = line.replace(titlePrefix, '').trim();
      if (title) {
        result.push(title);
      }
    }
  });

  return result;
}
