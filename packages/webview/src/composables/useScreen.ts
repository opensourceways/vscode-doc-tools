import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';

export enum Size {
  Phone = 'phone',
  PadV = 'pad_v',
  PadH = 'pad_h',
  Laptop = 'laptop',
}

export type ScreenSizeT = typeof Size.Phone | Size.PadV | Size.PadH | Size.Laptop;

export const ScreenConfig = {
  [Size.Phone]: 600,
  [Size.PadV]: 840,
  [Size.PadH]: 1200,
  [Size.Laptop]: 1440,
};

/**
 * lt: less than, 小于 <
 * le: less than or equal to, 小于等于 <=
 * eq: equal to, 等于 =
 * ne: never equal to, 不等于 !=
 * ge: greater than or equal to, 大于等于 >=
 * gt: greater than, 大于 >
 */
export type CompareT = 'lt' | 'le' | 'eq' | 'ne' | 'ge' | 'gt';

const CompareHandler = {
  lt: (a: number, b: number) => a < b,
  le: (a: number, b: number) => a <= b,
  eq: (a: number, b: number) => a === b,
  ne: (a: number, b: number) => a !== b,
  ge: (a: number, b: number) => a >= b,
  gt: (a: number, b: number) => a > b,
};

export const useScreen = () => {
  const screenSize = reactive({
    width: 1440,
    height: 0,
  });

  const current = ref<ScreenSizeT>(Size.Laptop);

  const getSize = (width?: number) => {
    if (typeof width === 'undefined') {
      width = screenSize.width;
    }
    if (width < ScreenConfig[Size.Phone]) {
      return Size.Phone;
    } else if (width < ScreenConfig[Size.PadV]) {
      return Size.PadV;
    } else if (width < ScreenConfig[Size.PadH]) {
      return Size.PadH;
    } else {
      return Size.Laptop;
    }
  };

  const compare = (type: CompareT = 'eq', size: ScreenSizeT) => {
    const w1 = screenSize.width;
    const w2 = ScreenConfig[size];
    const handler = CompareHandler[type];
    return handler(w1, w2);
  };

  /**
   * phone
   */
  const isPhone = computed(() => compare('le', Size.Phone)); // [0, 600]
  const gtPhone = computed(() => compare('gt', Size.Phone)); // [601, -]

  /**
   * pad
   */
  const isPad = computed(() => compare('gt', Size.Phone) && compare('le', Size.PadH)); // [601, 1200]
  const lePad = computed(() => compare('le', Size.PadH)); // [0, 1200]
  const gtPad = computed(() => compare('gt', Size.PadH)); // [1201, -]

  /**
   * pad_v
   */
  const isPadV = computed(() => compare('gt', Size.Phone) && compare('le', Size.PadV)); // [601, 840]
  const lePadV = computed(() => compare('le', Size.PadV)); // [0, 840]
  const gtPadV = computed(() => compare('gt', Size.PadV)); // [841, -]

  /**
   * pad_h
   */
  const isPadH = computed(() => compare('gt', Size.PadV) && compare('le', Size.PadH)); // [841, 1200]

  /**
   * laptop
   */
  const isLaptop = computed(() => compare('gt', Size.PadH) && compare('le', Size.Laptop)); // [1201, 1440]
  const leLaptop = computed(() => compare('le', Size.Laptop)); // [0, 1440]
  const gtLaptop = computed(() => compare('gt', Size.Laptop)); // [1441, -]
  const isPadToLaptop = computed(() => compare('gt', Size.Phone) && compare('le', Size.Laptop)); // [601, 1440]
  const isPadVToLaptop = computed(() => compare('gt', Size.PadV) && compare('le', Size.Laptop)); // [841, 1440]

  const onWindowResize = () => {
    const { innerWidth, innerHeight } = window;
    screenSize.width = innerWidth;
    screenSize.height = innerHeight;
    current.value = getSize();
  };

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onWindowResize);
      onWindowResize();
      nextTick(() => onWindowResize());
    }
  });

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onWindowResize);
    }
  });

  return {
    // 获取屏幕宽度分级
    getSize,
    // 当前屏幕分级
    current,
    // 当前屏幕宽度
    size: screenSize,

    isPhone, // [0, 600]
    gtPhone, // [601, -]

    isPad, // [601, 1200]
    lePad, // [0, 1200]
    gtPad, // [1201, -]

    isPadV, // [601, 840]
    lePadV, // [0, 840]
    gtPadV, // [841, -]

    isPadH, // [841, 1200]

    isLaptop, // [1201, 1440]
    leLaptop, // [0, 1440]
    gtLaptop, // [1441, -]
    isPadToLaptop, // [601, 1440]
    isPadVToLaptop, // [841, 1440]
  };
};
