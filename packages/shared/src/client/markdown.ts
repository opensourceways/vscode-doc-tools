import {
  TEXT_REGEX_MD_BLOCKQUOTE,
  TEXT_REGEX_MD_BOLD,
  TEXT_REGEX_MD_CODE,
  TEXT_REGEX_MD_COMMENT,
  TEXT_REGEX_MD_HEADING,
  TEXT_REGEX_MD_HR,
  TEXT_REGEX_MD_IMAGE,
  TEXT_REGEX_MD_ITALIC,
  TEXT_REGEX_MD_LINK,
  TEXT_REGEX_MD_LIST,
  TEXT_REGEX_MD_REF_LINK,
  TEXT_REGEX_MD_STRIKETHROUGH,
  TEXT_REGEX_MD_TABLE,
  TEXT_REGEX_MD_VP_ALERT_LINE,
} from '../const';

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
 * 去除一些 md 符号，只保留标题文本
 * @param {string} title 标题
 * @returns {string} 返回标题
 */
export function getMarkdownPureTitle(title: string) {
  return title
    .replace(/\*\*([^*]+)\*\*/g, '$1') // 去除加粗（**）
    .replace(/\*([^*]+)\*/g, '$1') // 去除斜体（*）
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 去除链接
    .replace(/<[^>]+>/g, '') // 去除 HTML 标签
    .replace(/`/g, ''); // 去除反引号
}

/**
 * 获取指定等级的标题
 * @param {string} content markdown 内容
 * @param {number} level 标题等级 h1-h6
 * @returns {string[]} 返回匹配的标题
 */
export function getMarkdownLevelTitles(content: string, level = 1) {
  if (!content || isNaN(level) || level < 1 || level > 6) {
    return [];
  }

  const result: string[] = [];
  const titlePrefix = `${Array(level).fill('#').join('')} `;
  content.split('\n').forEach((line) => {
    const tirmStr = line.trim();
    if (tirmStr.startsWith(titlePrefix)) {
      const title = line.replace(titlePrefix, '').trim();
      if (title) {
        result.push(getMarkdownPureTitle(title));
      }
    }
  });

  return result;
}

/**
 * 去除一些 md 符号，只保留文本
 * @param {string} title 标题
 * @returns {string} 返回标题 id
 */
export function getMarkdownTitleId(title: string) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase();
}

/**
 * 获取屏蔽某些 markdown 语法后的内容
 * @param {string} content markdown 内容
 * @returns {string} 返回过滤后的内容
 */
export function getMarkdownFilterContent(
  content: string,
  {
    disableHtmlComment = false,
    disableCode = false,
    disableHeading = false,
    disableBlockQuote = false,
    disableHr = false,
    disableList = false,
    disableTable = false,
    disableBold = false,
    disableItalic = false,
    disableStrikethrough = false,
    disableImage = false,
    disableLink = false,
    disableRefLink = false,
    disableVitepressAlertLine = false,
  }
) {
  const regs = [];
  if (disableHtmlComment) {
    regs.push(TEXT_REGEX_MD_COMMENT);
  }

  if (disableCode) {
    regs.push(TEXT_REGEX_MD_CODE);
  }

  if (disableHeading) {
    regs.push(TEXT_REGEX_MD_HEADING);
  }

  if (disableBlockQuote) {
    regs.push(TEXT_REGEX_MD_BLOCKQUOTE);
  }

  if (disableHr) {
    regs.push(TEXT_REGEX_MD_HR);
  }

  if (disableList) {
    regs.push(TEXT_REGEX_MD_LIST);
  }

  if (disableTable) {
    regs.push(TEXT_REGEX_MD_TABLE);
  }

  if (disableBold) {
    regs.push(TEXT_REGEX_MD_BOLD);
  }

  if (disableItalic) {
    regs.push(TEXT_REGEX_MD_ITALIC);
  }

  if (disableStrikethrough) {
    regs.push(TEXT_REGEX_MD_STRIKETHROUGH);
  }

  if (disableImage) {
    regs.push(TEXT_REGEX_MD_IMAGE);
  }

  if (disableLink) {
    regs.push(TEXT_REGEX_MD_LINK);
  }

  if (disableRefLink) {
    regs.push(TEXT_REGEX_MD_REF_LINK);
  }

  if (disableVitepressAlertLine) {
    regs.push(TEXT_REGEX_MD_VP_ALERT_LINE);
  }

  return content.replace(new RegExp(regs.join('|'), 'g'), (text) => {
    return text.replace(/\S/g, '\u200B');
  });
}
