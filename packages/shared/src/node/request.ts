import fs from 'fs';
import path from 'path';

/**
 * 创建 fetch 请求
 * @param {string} url 请求地址
 * @param {number} opts.timeout 超时时间，单位ms，默认 10 * 1000 ms，可空
 * @returns {Promise<Response>} 返回请求结果
 */
export function createHeadRequest(
  url: string,
  opts?: {
    timeout: number;
    signal?: AbortSignal;
  }
) {
  const controller = new AbortController();
  const { timeout = 10 * 1000, signal } = opts || {};
  const abortFunc = () => {
    controller.abort();
    signal?.removeEventListener('abort', abortFunc);
  };

  signal?.addEventListener('abort', abortFunc);
  const timer = setTimeout(abortFunc, timeout);

  const response = fetch(url, {
    method: 'HEAD',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    },
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFunc);
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
 * 获取链接状态码
 * @param {string} link 链接地址
 * @param {string} prefixPath 文件前缀地址，可空
 * @param {string[]} whitelist 白名单，可空
 * @param {AbortSignal} signal 中止信号
 * @returns {Promise<number>} 返回访问状态码
 */
export function getLinkStatus(link: string, prefixPath = '', whitelist: string[] = [], signal?: AbortSignal) {
  // localhost跳过
  const noHttpUrl = link.replace('http://', '').replace('https://', '');
  if (noHttpUrl.startsWith('localhost')) {
    return Promise.resolve(200);
  }

  // 内网地址跳过
  if (isPrivateIP(noHttpUrl.split(':')?.[0]) || isPrivateIP(noHttpUrl.split('/')?.[0])) {
    return Promise.resolve(200);
  }

  // 白名单跳过
  if (whitelist.some((item) => new RegExp(item).test(link))) {
    return Promise.resolve(200);
  }

  // 链接
  if (link.startsWith('http')) {
    return getUrlStatus(link, signal);
  }

  // 本地文件
  return Promise.resolve(fs.existsSync(path.join(prefixPath, link)) ? 200 : 404);
}

/**
 * 获取 http 链接状态码
 * @param {string} url 链接地址
 * @param {AbortSignal} signal 中止信号
 * @returns {Promise<number>} 返回访问状态码
 */
export const getUrlStatus = (() => {
  const map = new Map<string, number>();

  return async (url: string, signal?: AbortSignal) => {
    try {
      if (map.get(url)! >= 100) {
        return map.get(url)!;
      }

      const res = await createHeadRequest(url, {
        timeout: 5 * 1000,
        signal,
      });

      map.set(url, res.status);
      return res.status;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        map.set(url, 404);
        return 404;
      }
    }

    let record = map.get(url);
    if (record! >= 100) {
      return record!;
    }

    if (record === undefined) {
      record = 0;
    }

    record++;
    map.set(url, record >= 3 ? 499 : record);
    return 499;
  };
})();
