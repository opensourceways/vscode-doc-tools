import fs from 'fs';
import path from 'path';

/**
 * 创建 fetch 请求
 * @param {string} url 请求地址
 * @param {number} opts.timeout 超时时间，单位ms，默认 10 * 1000 ms，可空
 * @param {AbortController} opts.controller 控制器，可空
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
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    },
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
 * @param {string} prefixPath 文件前缀地址，可空
 * @returns {Promise<'success' | 'notFound' | 'timeout'>} 返回判断结果 success 可访问 notFound 404 timeout 访问超时
 */
export function isAccessibleLink(link: string, prefixPath = '', whitelist: string[] = []) {
  // localhost跳过
  const noHttpUrl = link.replace('http://', '').replace('https://', '');
  if (noHttpUrl.startsWith('localhost')) {
    return Promise.resolve('success');
  }

  // 内网地址跳过
  if (isPrivateIP(noHttpUrl.split(':')?.[0]) || isPrivateIP(noHttpUrl.split('/')?.[0])) {
    return Promise.resolve('success');
  }

  // 白名单跳过
  if (whitelist.some((item) => new RegExp(item).test(link))) {
    return Promise.resolve('success');
  }

  // 链接
  if (link.startsWith('http')) {
    return isAccessibleHttpLink(link);
  }

  // 本地文件
  return Promise.resolve(fs.existsSync(path.join(prefixPath, link)) ? 'success' : 'notFound');
}

/**
 * 判断 http 链接是否可访问
 * @param {string} url 链接地址
 * @returns {Promise<'success' | 'notFound' | 'timeout'>} 返回判断结果 success 可访问 notFound 页面不存在 timeout 访问超时
 */
export const isAccessibleHttpLink = (() => {
  const map = new Map<string, string | number>();

  return async (url: string) => {
    try {
      if (typeof map.get(url) === 'string') {
        return map.get(url) as string;
      }

      const res = await createHeadRequest(url, {
        timeout: 5 * 1000,
      });

      if (res.status === 200) {
        map.set(url, 'success');
        return 'success';
      } else if (res.status === 404) {
        map.set(url, 'notFound');
        return 'notFound';
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        map.set(url, 'notFound');
        return 'notFound';
      }
    }

    let record = map.get(url);
    if (typeof record === 'string') {
      return record;
    }

    if (record === undefined) {
      record = 0;
    }

    record++;
    map.set(url, record >= 3 ? 'timeout' : record);

    return 'timeout';
  };
})();
