export * from './markdown-symbol';

// 常用中文标点符号
export const SET_CHINESE_PUNCTUATION = new Set('，。！？；：“”‘’「」『』（）【】《》…～');

// 所有中文标点符号
export const SET_ALL_CHINESE_PUNCTUATION = new Set(`“”‘’。，、；：？！（）【】《》〈〉「」『』〖〗〔〕·—…～`);

// 常用英文标点符号
export const SET_ENGLISH_PUNCTUATION = new Set(`.?!,;:"'()`);

// 所有英文标点符号
export const SET_ALL_ENGLISH_PUNCTUATION = new Set(`!"#$%&'()*+,-./:;<=>?@[]^_\`{|}~`);

// 常见中文汉字
export const TEXT_REGEX_CHINESE = '[\\u4e00-\\u9fa5]';
