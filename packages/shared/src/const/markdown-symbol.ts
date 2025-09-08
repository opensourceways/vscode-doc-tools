// 注释：<!-- xxx -->
export const TEXT_REGEX_MD_COMMENT = '(<!--.*?-->)';

// 代码块
export const TEXT_REGEX_MD_CODE = '(```[\\s\\S]*?```)';

// 行内代码块
export const TEXT_REGEX_MD_INLINE_CODE = '((?<!\\\\)`{1,2}[^`\\n]+?(?<!\\\\)`{1,2}(?=\\s|[^`]|$))';

// 标题：h1-h6
export const TEXT_REGEX_MD_HEADING = '((?:^|\\n)\\s*#{1,6}\\s.*(?=\\n|$))';

// 区块引用
export const TEXT_REGEX_MD_BLOCKQUOTE = '((?:^|\\n)\\s*>\\s.*(?=\\n|$))';

// 分隔线
export const TEXT_REGEX_MD_HR = '((?:^|\\n)\\s*(?:\\*{3,}|-{3,}|_{3,})(?=\\n|$))';

// 无序/有序列表项
export const TEXT_REGEX_MD_LIST = '((?:^|\\n)(?:[+-]|\\d+\\.)\\s.*(?=\\n|$))';

// 表格
export const TEXT_REGEX_MD_TABLE = '((?:^|\\n)\\s*\\|.*\\|.*(?=\\n|$))';

// **加粗** 与 __加粗__
export const TEXT_REGEX_MD_BOLD = '(\\*\\*.*?\\*\\*)|(__.*?__)';

// *斜体* 与 _斜体_
export const TEXT_REGEX_MD_ITALIC = '(\\*.*?\\*)|(_.*?_)';

// ~~删除线~~
export const TEXT_REGEX_MD_STRIKETHROUGH = '(~~.*?~~)';

// 图片：![...](...)
export const TEXT_REGEX_MD_IMAGE = '(!\\[[^\\]]*\\]\\([^)]+\\))';

// 普通链接：[...](...)
export const TEXT_REGEX_MD_LINK = '((?<!!)\\[[^\\]]*\\]\\([^)]+\\)|<[^>]*?>)';

// 引用链接：[...][...]
export const TEXT_REGEX_MD_REF_LINK = '(\\[[^\\]]+\\]\\[[^\\]]*\\])';

// vitepress alert 块标识行
export const TEXT_REGEX_MD_VP_ALERT_LINE = '((?:^|\\n)\\s*>\\s*\\[!NOTE\\]|\\[!TIP\\]|\\[!IMPORTANT\\]|\\[!WARNING\\]|\\[!CAUTION\\].*(?=\\n|$))';
