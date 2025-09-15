import { type Configuration } from 'markdownlint';
import { createRequest } from 'shared';

import { DEFAULT_MD_CONFIG } from './markdownlint';
import { DEFAULT_WHITELIST_WORDS } from './whitelist-words';
import { DEFAULT_WHITELIST_URLS } from './whitelist-urls';

/**
 * 获取远程 markdownlint 配置
 */
export const getRemoteMarkdownlintConfig = (() => {
  let config: Configuration;
  let lastRequest: Promise<Response> | undefined;

  return async (signal?: AbortSignal): Promise<Configuration> => {
    if (config) {
      return config;
    }

    try {
      const req = lastRequest ? lastRequest : createRequest('https://gitee.com/Zherphy/docs-ci/raw/master/markdownlint-config.json', 'get', {
        signal
      });

      lastRequest = req;
      const res = await req;

      if (res.ok) {
        config = await res.json();
        return config;
      }

      return DEFAULT_MD_CONFIG;
    } catch {
      return DEFAULT_MD_CONFIG;
    } finally {
      lastRequest = undefined;
    }
  };
})();

/**
 * 获取远程 codespell 配置
 */
export const getRemoteCodespellConfig = (() => {
  let config: string[];
  let lastRequest: Promise<Response> | undefined;

  return async (signal?: AbortSignal) => {
    if (Array.isArray(config)) {
      return config;
    }

    try {
      const req = lastRequest ? lastRequest : createRequest('https://gitee.com/Zherphy/docs-ci/raw/master/whitelist_words.txt', 'get', {
        signal
      });

      lastRequest = req;
      const res = await req;

      if (res.ok) {
        const text = await res.text();
        config = text.split('\n');
        return config;
      }

      return DEFAULT_WHITELIST_WORDS;
    } catch {
      return DEFAULT_WHITELIST_WORDS;
    } finally {
      lastRequest = undefined;
    }
  };
})();

/**
 * 获取远程 whitelist_urls 配置
 */
export const getRemoteWhitelistUrlsConfig = (() => {
  let config: string[];
  let lastRequest: Promise<Response> | undefined;

  return async (signal?: AbortSignal) => {
    if (Array.isArray(config)) {
      return config;
    }

    try {
      const req = lastRequest ? lastRequest : createRequest('https://gitee.com/Zherphy/docs-ci/raw/master/whitelist_urls.txt', 'get', {
        signal,
      });

      lastRequest = req;
      const res = await req;
      
      if (res.ok) {
        const text = await res.text();
        config = text.split('\n');
        return config;
      }

      return DEFAULT_WHITELIST_URLS;
    } catch {
      return DEFAULT_WHITELIST_URLS;
    } finally {
      lastRequest = undefined;
    }
  };
})();
