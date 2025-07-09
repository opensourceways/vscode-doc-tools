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
  })
}
