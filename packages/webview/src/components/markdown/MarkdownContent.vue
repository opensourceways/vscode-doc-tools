<script lang="ts" setup>
import { ref, watch, h, onUnmounted, nextTick } from 'vue';
import { useMessage } from '@opensig/opendesign';

import MarkdownTitle from '@/components/markdown/MarkdownTitle.vue';
import MarkdownImage from '@/components/markdown/MarkdownImage.vue';

import { useClipboard } from '@/composables/useClipboard';
import { useLocale } from '@/composables/useLocale';

const props = defineProps({
  // html 内容
  html: {
    type: String,
    default: '',
  },
});

const message = useMessage();
const { t } = useLocale();

// -------------------- 渲染函数 --------------------
const renderFn = ref<any>(null);
watch(
  () => props.html,
  () => {
    renderFn.value = () => {
      return h({
        template: props.html,
        components: {
          MarkdownTitle,
          MarkdownImage,
        },
      });
    };

    nextTick(() => {
      copyDoc();
    });
  },
  {
    immediate: true,
  }
);

// -------------------- 代码块复制 --------------------
const copyCode = (evt: Event) => {
  const el = evt.target as HTMLElement;
  if (el.parentElement && el.parentElement.childNodes) {
    const code = el.parentElement.querySelector('code');
    if (code) {
      useClipboard({
        text: code.textContent!,
        target: evt as MouseEvent,
        success: () => {
          message.success({ content: t('docs.copySuccess') });
        },
      });
    }
  }
};

const copyDoc = () => {
  const buttonCopy = Array.from(document.querySelectorAll('.copy'));
  for (let index = 0; index < buttonCopy.length; index++) {
    buttonCopy[index].addEventListener('click', copyCode);
  }
};

onUnmounted(() => {
  const buttonCopy = Array.from(document.querySelectorAll('.copy'));
  for (let index = 0; index < buttonCopy.length; index++) {
    buttonCopy[index].removeEventListener('click', copyCode);
  }
});
</script>

<template>
  <div class="markdown-body">
    <component v-if="renderFn" :is="{ render: renderFn }" />
  </div>
</template>

<style lang="scss"></style>
