/**
 * 获取 Git URL 信息
 * @param {string} gitUrl Git URL
 * @returns Git 信息
 */
export function getGitUrlInfo(gitUrl: string) {
  const url = new URL(gitUrl);
  const [owner, repo, __, branch, ...locations] = url.pathname.replace('/', '').split('/');

  return {
    url: `${url.origin}/${owner}/${repo}`,
    owner,
    repo,
    branch,
    locations,
  };
}

/**
 * 休眠
 * @param {number} ms 毫秒数
 * @returns Promise
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}