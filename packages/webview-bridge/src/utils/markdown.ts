import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import { getBase64Image } from 'shared';

import { createMarkdownRenderer } from 'markdown';

const REG_IMG_TAG = /<img\s+[^>]*src="([^"]+)"[^>]*>/;

/**
 * 转换图片地址
 * @param {string} srcPath 图片路径
 * @param {string} basePath base路径
 * @param {string} webview webview
 * @param {vscode.Webview} base64Image 是否图片都使用 base64 图片
 * @returns {string} 图片地址
 */
function parseImageUrl(srcPath: string, basePath: string, webview: vscode.Webview, base64Image = false) {
  const completePath = path.join(basePath, srcPath);
  return base64Image ? getBase64Image(completePath) : webview.asWebviewUri(vscode.Uri.file(completePath)).toString();
}

/**
 * 创建 markdown 文档渲染器
 * @param {string} srcDir 文档的源目录
 * @param {vscode.Webview} webview webview
 * @param {boolean} base64Image 是否图片都使用 base64 图片
 * @returns {Promise<MarkdownItAsync>} 返回 MarkdownItAsync 实例
 */
export function createDocMarkdownRenderer(srcDir: string, webview: vscode.Webview, base64Image = false) {
  const fsDir = path.dirname(srcDir);
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
          tokens[idx].attrs[srcIndex][1] = parseImageUrl(decodeURIComponent(tokens[idx].attrs[srcIndex][1]), fsDir, webview, base64Image);
        }

        return `<MarkdownImage>${imageRender!(tokens, idx, options, env, self)}</MarkdownImage>`;
      };

      // 处理文档里写的html标签
      const defaultHtmlBlockRender = md.renderer.rules.html_block;
      md.renderer.rules.html_block = (tokens, idx, options, env, self) => {
        const content = tokens[idx].content;
        let renderContent = defaultHtmlBlockRender!!(tokens, idx, options, env, self);

        // 处理图片标签
        if (content.includes('<img')) {
          const match = renderContent.match(REG_IMG_TAG);
          if (match) {
            const src = parseImageUrl(decodeURIComponent(match[1]), fsDir, webview, base64Image);
            renderContent = renderContent.replace(match[1], src);
          }

          return `<MarkdownImage>${renderContent.replace(/(width|height)=['|"](.*?)['|"]/g, '')}</MarkdownImage>`;
        }

        // 处理链接
        if (content.startsWith('<a ')) {
          renderContent = renderContent.replace(/<a\s+([^>]*)href="([^"]*)"([^>]*)>/g, (match, before, url, after) => {
            if (url.startsWith('.')) {
              const [filePath] = url.split('#');
              const newUrl = fs.existsSync(path.join(fsDir, filePath))
                ? `doctools://markdown?fsPath=${path.join(fsDir, url).replace(/\\/g, '/')}`
                : 'doctools://tip?type=non-exists';
              return `<a ${before}href="${newUrl}"${after}>`;
            }

            return match;
          });
        }

        return renderContent;
      };

      const defaultHtmlInlineRender = md.renderer.rules.html_inline;
      md.renderer.rules.html_inline = function (tokens, idx, options, env, self) {
        const content = tokens[idx].content;
        let renderContent = defaultHtmlInlineRender!!(tokens, idx, options, env, self);

        // 处理图片
        if (content.includes('<img')) {
          const match = renderContent.match(REG_IMG_TAG);
          if (match) {
            const src = parseImageUrl(decodeURIComponent(match[1]), fsDir, webview, base64Image);
            renderContent = renderContent.replace(match[1], src);
          }

          return `<MarkdownImage>${renderContent.replace(/(width|height)=['|"](.*?)['|"]/g, '')}</MarkdownImage>`;
        }

        // 处理链接
        if (content.includes('<a ')) {
          renderContent = renderContent.replace(/<a\s+([^>]*)href="([^"]*)"([^>]*)>/g, (match, before, url, after) => {
            if (url.startsWith('.')) {
              const [filePath] = url.split('#');
              const newUrl = fs.existsSync(path.join(fsDir, filePath))
                ? `doctools://markdown?fsPath=${path.join(fsDir, url).replace(/\\/g, '/')}`
                : 'doctools://tip?type=non-exists';
              return `<a ${before}href="${newUrl}"${after}>`;
            }
            return match;
          });
        }

        return renderContent;
      };

      // 链接
      md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        const hrefIndex = token.attrIndex('href');
        if (hrefIndex >= 0) {
          const href = tokens[idx].attrs![hrefIndex][1];
          if (href.startsWith('.')) {
            const [filePath] = href.split('#');
            tokens[idx].attrs![hrefIndex][1] = fs.existsSync(path.join(fsDir, filePath))
              ? `doctools://markdown?fsPath=${path.join(fsDir, href).replace(/\\/g, '/')}`
              : 'doctools://tip?type=non-exists';
          }
        }

        return self.renderToken(tokens, idx, options);
      };
    },
  });
}
