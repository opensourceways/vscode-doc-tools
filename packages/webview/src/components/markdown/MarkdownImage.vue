<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useElementSize } from '@vueuse/core';
import { OLayer, OIcon } from '@opensig/opendesign';

import ImgZoomDrag from '@/components/ImgZoomDrag.vue';
import IconExitFullScreen from '~icons/app/icon-exit-full-screen.svg';

import { useScreen } from '@/composables/useScreen';

const { isPhone, gtLaptop } = useScreen();
const containerRef = ref<HTMLElement>();
const { width } = useElementSize(containerRef);
const zoomEnabled = computed(() => width.value >= 216);
const zoomScale = computed(() => (gtLaptop.value ? 1.5 : isPhone ? 1 : 1.1));
const zoomImgUrl = ref('');
const zoomVisible = ref(false);
const zoomWidth = ref(0);
const zoomHeight = ref(0);

watch(zoomEnabled, () => {
  const img = containerRef.value?.querySelector<HTMLImageElement>('img');
  if (img) {
    zoomWidth.value = img.offsetWidth;
    zoomHeight.value = img.offsetHeight;
    zoomImgUrl.value = img.src;
  }
});

const onClickContainer = () => {
  if (zoomEnabled.value) {
    zoomVisible.value = true;
  }
};

const onCloseZoom = () => {
  zoomVisible.value = false;
};
</script>

<template>
  <span ref="containerRef" class="img-expand" @click="onClickContainer">
    <template v-if="zoomEnabled">
      <span class="img-expand-btn"></span>
      <span class="img-mask"></span>
    </template>
    <slot></slot>
  </span>

  <!-- 图片缩放 -->
  <OLayer v-if="zoomVisible" v-model:visible="zoomVisible">
    <div class="img-scaler">
      <div class="close-btn" @click="onCloseZoom">
        <OIcon class="icon"><IconExitFullScreen /></OIcon>
      </div>
      <div class="zoom">
        <ImgZoomDrag :src="zoomImgUrl" :width="zoomWidth" :height="zoomHeight" :zoom="zoomScale" />
      </div>
    </div>
  </OLayer>
</template>

<style lang="scss" scoped>
.img-expand {
  width: auto;
  max-width: min(936px, 100%);
  position: relative;
  display: inline-block;
  padding: var(--o-gap-2);
  margin-left: -8px;

  .img-expand-btn {
    position: absolute;
    width: 32px;
    height: 32px;
    background-color: rgba(var(--o-black), 0.4);
    border: 1px solid rgba(var(--o-black), 0.1);
    border-radius: var(--o-radius-xs);
    opacity: 0;
    z-index: 1;
    top: 20px;
    right: 20px;
    transition: all var(--o-duration-m1) var(--o-easing-standard-in);
    cursor: pointer;

    &::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 24px;
      height: 24px;
      background-color: transparent;
      background-image: url('@/assets/svg-icons/icon-full-screen.svg');
      background-position: center;
      background-size: 24px;
      background-repeat: no-repeat;
    }
  }

  .img-mask {
    position: absolute;
    top: 8px;
    left: 8px;
    width: calc(100% - 16px);
    height: calc(100% - 16px);
    background-color: rgba(var(--o-black), 0.2);
    border: 1px solid rgba(var(--o-black), 0.1);
    opacity: 0;
    border-radius: var(--o-radius-xs);
    z-index: 2;
    transition: all var(--o-duration-m1) var(--o-easing-standard-in);
    cursor: pointer;
  }

  @include hover {
    .img-expand-btn,
    .img-mask {
      opacity: 1;
    }
  }

  @include respond-to('phone') {
    max-width: 100%;
    .img-expand-btn,
    .img-mask {
      display: none;
    }
  }
}

.img-scaler {
  position: relative;
}

.close-btn {
  z-index: 2;
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: rgba(var(--o-black), 0.4);
  border: 1px solid rgba(var(--o-black), 0.1);
  border-radius: var(--o-radius-xs);
  cursor: pointer;
  
  .icon {
    color: var(--o-color-white);
    font-size: 24px;
  }

  @include respond-to('phone') {
    display: none;
  }
}
</style>
