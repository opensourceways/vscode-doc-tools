import { isWindow } from '@opensig/opendesign';

export function getOffsetTop(el: HTMLElement, container: HTMLElement | Window) {
  const { top } = el.getBoundingClientRect();
  if (isWindow(container)) {
    return top - document.documentElement.clientTop;
  }

  return top - container.getBoundingClientRect().top;
}

export function isDocument(val: unknown): val is Document {
  return val instanceof Document || val?.constructor.name === 'HTMLDocument';
}

export const isElementVisible = (el: HTMLElement, parent: HTMLElement, min = 0) => {
  const parentRect = parent.getBoundingClientRect();
  const childRect = el.getBoundingClientRect();
  const visibleTop = Math.max(0, childRect.top - parentRect.top);
  const visibleBottom = Math.min(parentRect.bottom, childRect.bottom) - parentRect.top;
  const visibleHeight = visibleBottom - visibleTop;
  return visibleHeight > min;
};

export const getScrollRemainingBottom = (container: HTMLElement) => {
  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight;
  const clientHeight = container.clientHeight;
  const distance = scrollHeight - (scrollTop + clientHeight);

  return distance > 0 ? distance : 0;
};

/**
 * 判断两个元素是否重叠
 * @param a - 第一个元素
 * @param b - 第二个元素
 * @returns 是否重叠
 */
export function isOverlap(a: Element, b: Element): boolean {
  // 如果当前环境没有 DOM，直接返回 false
  if (typeof document === 'undefined') {
    return false;
  }

  const rect1 = a.getBoundingClientRect();
  const rect2 = b.getBoundingClientRect();
  return !(rect1.right <= rect2.left || rect2.right <= rect1.left || rect1.bottom <= rect2.top || rect2.bottom <= rect1.top);
}