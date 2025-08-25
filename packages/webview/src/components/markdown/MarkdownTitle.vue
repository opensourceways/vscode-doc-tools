<script setup lang="ts">
import { ref } from 'vue';
import { OPopover, OIcon, useMessage } from '@opensig/opendesign';

import IconLink from '~icons/app/icon-link.svg';
import IconPin from '~icons/app/icon-pin.svg';

import { scrollIntoView } from '@/utils/scroll-to';
import { useScreen } from '@/composables/useScreen';
import { useLocale } from '@/composables/useLocale';
import { useClipboard } from '@/composables/useClipboard';

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

const onClickCopyLink = (evt: Event) => {
  useClipboard({
    text: `#${props.titleId}`,
    target: evt as MouseEvent,
    success: () => {
      message.success({ content: t('docs.copyAnchorSuccess') });
    },
  });
};
</script>

<template>
  <span class="title-wrap">
    <span class="title" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave" @click="onClickAnchor">
      <transition name="fade">
        <OIcon class="pin" :class="{ 'pin-show': showPin }"> <IconPin /> </OIcon>
      </transition>
      <slot></slot>
    </span>
    <span class="copy-link-wrap">
      <OPopover position="right" trigger="hover" wrap-class="popover-copy">
        <template #target>
          <a class="copy-link" @click="onClickCopyLink">
            <OIcon> <IconLink /> </OIcon>
          </a>
        </template>

        Copy link
      </OPopover>
    </span>
  </span>
</template>

<style lang="scss" scoped>
.title-wrap {
  position: relative;
  display: inline-flex;
  cursor: pointer;

  .title {
    flex: 1;
    display: inline;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: normal;
  }

  span {
    display: inline-flex;
  }

  .pin,
  .copy-link {
    @include h2;
  }

  .copy-link-wrap {
    position: relative;
    width: 1em;
    height: 1em;
    margin-left: 6px;
    clear: both;

    @include respond-to('<=laptop') {
      margin-left: 4px;
    }
  }

  .copy-link {
    position: absolute;
    top: 2px;

    @include hover {
      color: var(--o-color-primary1);
    }
  }

  .pin {
    position: absolute;
    left: -28px;
    top: 4px;
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
