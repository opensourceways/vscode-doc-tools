import fs from 'fs';
import path from 'path';

/**
 * 创建 fetch 请求
 * @param url 请求地址
 * @param opts 配置项参数
 * @returns {Promise<Response>} 返回请求结果
 */
export function createHeadRequest(
  url: string,
  opts?: {
    timeout: number;
    controller?: AbortController;
  }
) {
  const { timeout = 10 * 1000, controller = new AbortController() } = opts || {};

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  const response = fetch(url, {
    method: 'HEAD',
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timer);
  });

  return response;
}

/**
 * 判断是不是一个内网地址
 * @param {string} ip ip
 * @returns {boolean} 返回判断结果
 */
export function isPrivateIP(ip: string) {
  return /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})$/.test(ip);
}

/**
 * 判断链接是否可访问
 * @param {string} link 链接地址
 * @param {string} prefixPath 文件前缀地址
 * @returns {Promise<boolean>} 返回判断结果
 */
export function isAccessibleLink(link: string, prefixPath = '', whitelist: string[] = []) {
  // localhost跳过
  const noHttpUrl = link.replace('http://', '').replace('https://', '');
  if (noHttpUrl.startsWith('localhost')) {
    return Promise.resolve(true);
  }

  // 内网地址跳过
  if (isPrivateIP(noHttpUrl.split(':')?.[0]) || isPrivateIP(noHttpUrl.split('/')?.[0])) {
    return Promise.resolve(true);
  }

  // 白名单跳过
  if (whitelist.some(item => new RegExp(item).test(link))) {
    return Promise.resolve(true);
  }

  // 链接
  if (link.startsWith('http')) {
    return isAccessibleHttpLink(link);
  }

  // 本地文件
  return Promise.resolve(fs.existsSync(path.join(prefixPath, link)));
}

/**
 * 判断 http 链接是否可访问
 * @param {string} url 链接地址
 * @returns {Promise<boolean>} 返回判断结果
 */
export const isAccessibleHttpLink = (() => {
  const map = new Map<string, boolean | number>();

  return async (url: string) => {
    try {
      if (typeof map.get(url) === 'boolean') {
        return map.get(url) as boolean;
      }

      const res = await createHeadRequest(url, {
        timeout: 5 * 1000,
      });

      if (res.status === 200) {
        map.set(url, true);
        return true;
      }
    } catch {}

    let record = map.get(url);
    if (typeof record === 'boolean') {
      return record;
    }

    if (record === undefined) {
      record = 0;
    }

    record++;
    map.set(url, record >= 3 ? false : record);

    return false;
  };
})();
