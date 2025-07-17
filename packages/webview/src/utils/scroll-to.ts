import { isFunction, isWindow, throttleRAF } from '@opensig/opendesign';
import { getOffsetTop, isDocument } from '@/utils/element';

export type ScrollTarget = HTMLElement | Window | Document;

export interface ScrollTopOptions {
  container?: ScrollTarget;
  duration?: number;
}

export function getScroll(el: ScrollTarget) {
  const rlt = {
    scrollLeft: 0,
    scrollTop: 0,
  };

  if (!el) {
    return rlt;
  }

  if (isWindow(el)) {
    rlt.scrollLeft = window.scrollX;
    rlt.scrollTop = window.scrollY;
  } else if (isDocument(el)) {
    rlt.scrollLeft = el.documentElement.scrollLeft;
    rlt.scrollTop = el.documentElement.scrollTop;
  } else {
    rlt.scrollLeft = el.scrollLeft;
    rlt.scrollTop = el.scrollTop;
  }

  return rlt;
}

export function easeInOutCubic(current: number, start: number, end: number, duration: number): number {
  const elapsed = end - start;
  let time = current / (duration / 2);

  if (time < 1) {
    return (elapsed / 2) * time * time * time + start;
  }

  time -= 2;
  return (elapsed / 2) * (time * time * time + 2) + start;
}

const cancelScrollRAFMap = new WeakMap<WeakKey, (() => void) | null>();

export function scrollTo(y: number, opts: ScrollTopOptions) {
  const { container = window, duration = 450 } = opts;
  const { scrollTop } = getScroll(container);
  const startTime = Date.now();

  if (isFunction(cancelScrollRAFMap.get(container))) {
    cancelScrollRAFMap.get(container)!();
    cancelScrollRAFMap.delete(container);
  }

  return new Promise((resolve) => {
    const frameFn = () => {
      const timeStamp = Date.now();
      const time = timeStamp - startTime;
      const nextScrollTop = easeInOutCubic(time > duration ? duration : time, scrollTop, y, duration);

      if (isWindow(container)) {
        window.scrollTo({
          left: window.scrollX,
          top: nextScrollTop,
          behavior: 'instant',
        });
      } else if (isDocument(container)) {
        container.documentElement.scrollTop = nextScrollTop;
      } else {
        container.scrollTop = nextScrollTop;
      }

      if (time < duration) {
        const fn = throttleRAF(frameFn);
        cancelScrollRAFMap.set(container, () => {
          fn.cancel();
          resolve('cancel');
        });
        fn();
      } else {
        throttleRAF(() => {
          cancelScrollRAFMap.delete(container);
          resolve('done');
        })();
      }
    };

    throttleRAF(frameFn)();
  });
}

export async function scrollIntoView(target: HTMLElement, scrollContainer: ScrollTarget, targetOffset = 24, duration = 450) {
  const { scrollTop } = getScroll(scrollContainer);
  const offsetTop = getOffsetTop(target, scrollContainer as (HTMLElement | Window));
  const y = scrollTop + offsetTop - targetOffset;

  return scrollTo(y, {
    container: scrollContainer,
    duration,
  });
}
