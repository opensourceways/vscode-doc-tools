<script setup lang="ts">
import { ref } from 'vue';
import { OPopover, OIcon, useMessage } from '@opensig/opendesign';

import IconLink from '~icons/app/icon-link.svg';
import IconPin from '~icons/app/icon-pin.svg';

import { scrollIntoView } from '@/utils/scroll-to';
import { useScreen } from '@/composables/useScreen';
import { useLocale } from '@/composables/useLocale';

const props = defineProps({
  // 标签标题
  titleId: {
    type: String,
    default: '',
  },
});

defineEmits<{
  (e: 'scroll-into-title'): void;
}>();

const message = useMessage();
const { isPhone } = useScreen();
const { t } = useLocale();
const showPin = ref(false);

const onMouseEnter = () => {
  showPin.value = !isPhone.value;
};

const onMouseLeave = () => {
  showPin.value = false;
};

const onClickAnchor = () => {
  const contentDom = document.querySelector('.markdown-body');
  if (contentDom) {
    const target = contentDom.querySelector<HTMLElement>(`#${props.titleId}`) || contentDom.querySelector<HTMLElement>(`[name='${props.titleId}']`);
    const scrollContainer = document.querySelector<HTMLElement>('#app > .o-scroller > .o-scroller-container');
    if (target && scrollContainer) {
      scrollIntoView(target, scrollContainer);
    }
  }
};

const onClickCopyLink = () => {
  message.info({
    content: t('docs.dontSupportCopy'),
  });
};
</script>

<template>
  <span class="title-wrap">
    <span @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" @click="onClickAnchor">
      <transition name="fade">
        <OIcon class="pin" :class="{ 'pin-show': showPin }"> <IconPin /> </OIcon>
      </transition>
      <slot></slot>
    </span>
    <OPopover position="right" trigger="hover" wrap-class="popover-copy">
      <template #target>
        <a class="link copy-link" @click="onClickCopyLink">
          <OIcon> <IconLink /> </OIcon>
        </a>
      </template>

      Copy link
    </OPopover>
  </span>
</template>

<style lang="scss" scoped>
.title-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;

  span {
    display: inline-flex;
  }

  .pin,
  .link {
    @include h2;
  }

  .link {
    display: inline-flex;
    align-items: center;

    @include hover {
      color: var(--o-color-primary1);
    }
  }

  .copy-link {
    margin-left: 6px;

    @include respond-to('<=laptop') {
      margin-left: 4px;
    }
  }

  .pin {
    position: absolute;
    left: -28px;
    top: 50%;
    transform: translateY(-50%);
    padding-right: 4px;
    transition: opacity var(--o-duration-l) var(--o-easing-standard-in);
    opacity: 0;

    @include respond-to('laptop') {
      left: -22px;
      padding-right: 2px;
    }
    @include respond-to('pad_h') {
      left: -20px;
      padding-right: 2px;
    }
    @include respond-to('pad_v') {
      left: -20px;
      padding-right: 2px;
    }
    @include respond-to('phone') {
      display: none;
    }
  }

  .pin-show {
    opacity: 1;
  }
}
</style>

<style lang="scss">
[data-o-theme='dark'] {
  .popover-copy {
    --popup-bg-color: var(--o-color-control1-light);
  }
}
</style>
