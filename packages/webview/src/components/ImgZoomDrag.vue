<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue';

import { useScreen } from '@/composables/useScreen';

const { isPhone } = useScreen();

const props = defineProps({
  // 图片url
  src: {
    type: String,
    default: '',
  },
  width: {
    type: Number,
    default: 0,
  },
  height: {
    type: Number,
    default: 0,
  },
  // 缩放
  zoom: {
    type: Number,
    default: 1.1,
  },
});

const minScale = 1;
const maxScale = 3;
const wheelRatio = 0.1;

const scale = ref<number>(1.1);
scale.value = props.zoom;

const left = ref<number>(0);
const top = ref<number>(0);

const zoomRef = ref();
const targetRef = ref();

const cursor = ref<string>('default'); // 光标样式

// 状态值
const state = reactive({
  lastLeft: 0, // 上次的left
  lastTop: 0, // 上次的top

  startX: 0, // 长按开始坐标x
  startY: 0, // 长按开始坐标y
  isDown: false, // 鼠标是否长按中

  startDiffLeft: 0, // 鼠标按下的间距
  startDiffTop: 0,
  startDiffRight: 0,
  startDiffBottom: 0,

  limitLeft: false, // 极限状态
  limitTop: false,
  limitRight: false,
  limitBottom: false,
});

const zoomBoxStyle = ref({
  width: props.width * scale.value,
  height: props.height * scale.value,
  left: 0,
  top: 0,
});

const targetBoxStyle = ref({
  width: props.width * scale.value,
  height: props.height * scale.value,
  left: 0,
  top: 0,
  zoom: 1,
});

// 获取元素大小
async function getSize(ele: HTMLElement | undefined): Promise<[number, number, number, number]> {
  function inner(resolve: (res: [number, number, number, number]) => void) {
    if (ele) {
      const { left, top, width, height } = ele.getBoundingClientRect();
      resolve([width, height, left, top]);
    } else {
      resolve([0, 0, 0, 0]);
    }
  }
  return new Promise((resolve) => {
    inner(resolve);
  });
}

const changeZoom = async (val: number) => {
  scale.value += val;
  scale.value = Math.round(scale.value * 1000) / 1000;

  targetBoxStyle.value.width = props.width * scale.value;
  targetBoxStyle.value.height = props.height * scale.value;

  zoomBoxStyle.value.width = props.width * scale.value;
  zoomBoxStyle.value.height = props.height * scale.value;

  nextTick(async () => {
    const [tWidth, tHeight, tLeft, tTop] = await getSize(targetRef.value);
    const [zWidth, zHeight, zLeft, zTop] = await getSize(zoomRef.value);
    targetBoxStyle.value = {
      width: tWidth,
      height: tHeight,
      left: tLeft,
      top: tTop,
      zoom: scale.value,
    };
    zoomBoxStyle.value = {
      width: zWidth,
      height: zHeight,
      left: zLeft,
      top: zTop,
    };

    top.value = (zoomBoxStyle.value.height - targetBoxStyle.value.height) / 2;
    left.value = (zoomBoxStyle.value.width - targetBoxStyle.value.width) / 2;

    state.lastLeft = left.value;
    state.lastTop = top.value;
  });
};
const onWheel = (el: WheelEvent) => {
  cursor.value = 'grab';
  // 放大
  if (el.deltaY < 0) {
    if (scale.value <= maxScale) {
      changeZoom(wheelRatio);
    }
  } else {
    // 缩小
    if (scale.value >= minScale + wheelRatio) {
      changeZoom(-wheelRatio);
    }
  }
};

const onMouseStart = async (e: MouseEvent) => {
  if (e.button !== 0) {
    return;
  }

  const [tWidth, tHeight, tLeft, tTop] = await getSize(targetRef.value);
  const [zWidth, zHeight, zLeft, zTop] = await getSize(zoomRef.value);

  if (tWidth === zWidth && tHeight === zHeight) {
    return;
  }

  cursor.value = 'grabbing';
  state.startX = e.clientX;
  state.startY = e.clientY;
  state.isDown = true;

  const widthDiff = tWidth - zWidth;
  const heightDiff = tHeight - zHeight;

  state.startDiffLeft = tLeft - zLeft;
  state.startDiffTop = tTop - zTop;
  state.startDiffRight = widthDiff - Math.abs(state.startDiffLeft);
  state.startDiffBottom = heightDiff - Math.abs(state.startDiffTop);

  // 回弹
  state.limitRight = false;
  state.limitBottom = false;
  state.limitLeft = false;
  state.limitTop = false;
};

const onMousemove = async (e: MouseEvent) => {
  if (!state.isDown) {
    return;
  }

  const [tWidth, tHeight, tLeft, tTop] = await getSize(targetRef.value);
  const [zWidth, zHeight, zLeft, zTop] = await getSize(zoomRef.value);

  const widthDiff = tWidth - zWidth;
  const heightDiff = tHeight - zHeight;

  const diffLeft = tLeft - zLeft;
  const diffTop = tTop - zTop;
  const diffRight = widthDiff - Math.abs(diffLeft);
  const diffBottom = heightDiff - Math.abs(diffTop);

  // 鼠标移动距离
  let moveX = e.clientX - state.startX;
  let moveY = e.clientY - state.startY;

  if (tWidth > zWidth) {
    // 左移到侧边
    if (moveX < 0 && diffRight <= 0) {
      let x = Math.abs(e.clientX - state.startX) - Math.abs(state.startDiffRight);
      x = x > 0 ? 0 : x;
      moveX = -state.startDiffRight - x;
      state.limitRight = true;
    }

    // 右移到侧边
    if (moveX > 0 && diffLeft >= 0) {
      let x = Math.abs(e.clientX - state.startX) - Math.abs(state.startDiffLeft);
      x = x > 0 ? 0 : x;
      moveX = -state.startDiffLeft + x;
      state.limitLeft = true;
    }

    left.value = state.lastLeft + moveX;
  }

  if (tHeight > zHeight) {
    // 上移到侧边
    if (moveY < 0 && diffBottom <= 0) {
      let x = Math.abs(e.clientY - state.startY) - Math.abs(state.startDiffBottom);
      x = x > 0 ? 0 : x;
      moveY = -state.startDiffBottom - x;
      state.limitBottom = true;
    }

    // 下移到侧边
    if (moveY > 0 && diffTop >= 0) {
      let x = Math.abs(e.clientY - state.startY) - Math.abs(state.startDiffTop);
      x = x > 0 ? 0 : x;
      moveY = -state.startDiffTop + x;
      state.limitTop = true;
    }

    top.value = state.lastTop + moveY;
  }
};

const onMouseEnd = () => {
  if (state.isDown) {
    state.lastLeft = left.value;
    state.lastTop = top.value;
  }

  cursor.value = 'grab';
  state.isDown = false;
};

onMounted(() => {
  if (isPhone.value || !targetRef.value) {
    return;
  }

  targetRef.value.addEventListener('wheel', onWheel);
  targetRef.value.addEventListener('mousedown', onMouseStart);
  targetRef.value.addEventListener('mousemove', onMousemove);
  targetRef.value.addEventListener('mouseup', onMouseEnd);
  targetRef.value.addEventListener('mouseleave', onMouseEnd);
});

onBeforeUnmount(() => {
  if (targetRef.value) {
    targetRef.value.removeEventListener('wheel', onWheel);
    targetRef.value.removeEventListener('mousedown', onMouseStart);
    targetRef.value.removeEventListener('mousemove', onMousemove);
    targetRef.value.removeEventListener('mouseup', onMouseEnd);
    targetRef.value.removeEventListener('mouseleave', onMouseEnd);
  }
});
</script>
<template>
  <div ref="zoomRef" class="zoom-box" :style="{ width: `${zoomBoxStyle.width}px`, height: `${zoomBoxStyle.height}px` }">
    <div
      ref="targetRef"
      class="target-box"
      :style="{ width: `${targetBoxStyle.width}px`, height: `${targetBoxStyle.height}px`, top: `${top}px`, left: `${left}px`, cursor: cursor }"
    >
      <img :src="src" alt="" @dragstart.prevent />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.zoom-box {
  max-width: calc(100vw - 100px);
  max-height: calc(100vh - 200px);
  background-color: var(--o-color-fill2);
  height: auto;
  margin: 0 auto;
  overflow: hidden;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  @include respond-to('phone') {
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
  }
}

.target-box {
  position: absolute;
  transform-origin: 50% 50%;
  user-select: none;
  -webkit-user-drag: none;
}

img {
  width: 100%;
}

@include in-dark {
  img {
    @include img-in-dark;
  }
}
</style>
