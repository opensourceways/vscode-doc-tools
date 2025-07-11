import fs from 'fs';

/**
 * 将给定路径的图像文件转换为Base64编码的字符串
 * @param {string} fsPath 图像路径
 * @returns Base64编码的图像字符串，或者空字符串如果发生错误
 */
export function getBase64Image(fsPath: string) {
  try {
    // 读取文件内容并以Base64格式编码，然后将其转换为Data URL格式返回
    return `data:image/png;base64,${fs.readFileSync(fsPath, { encoding: 'base64' })}`;
  } catch (error) {
    // 如果发生错误（例如文件不存在或无法读取），则返回空的Data URL字符串
    return `data:image/png;base64,`;
  }
}
