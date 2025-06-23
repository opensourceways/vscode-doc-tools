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
