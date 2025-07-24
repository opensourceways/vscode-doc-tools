<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useWindowSize } from '@vueuse/core';
import { OIcon } from '@opensig/opendesign';
import { ResourceBridge } from 'webview-bridge/src/client';

import IconOutLink from '~icons/app/icon-outlink.svg';

import { useScreen } from '@/composables/useScreen';
import { useLocale } from '@/composables/useLocale';
import { isOverlap } from '@/utils/element';

const roure = useRoute();
const { t } = useLocale();
const { isPhone } = useScreen();
const { width } = useWindowSize();
const onClickSourceLink = () => {
  ResourceBridge.viewSource((roure.query.fsPath as string).split('#')[0]);
}

// -------------------- 检查标题和viewsource是否有重叠 --------------------
const linkRef = ref();
const overlap = ref(false);

const checkOverlap = () => {
  if (isPhone.value) {
    return;
  }
  
  const h1 = document.querySelector('.markdown-body h1 .title-wrap');
  if (h1 && linkRef.value) {
    overlap.value = isOverlap(h1, linkRef.value);
  }
};

onMounted(() => {
  checkOverlap();
});
// -------------------- 移动端插入gitee --------------------
const insertGiteeBtn = () => {
  if (isPhone.value || overlap.value) {
    const link = document.querySelector<HTMLElement>('.markdown-body .gitee') as HTMLAnchorElement;
    if (link) {
      return;
    }

    const titleDom = document.querySelector<HTMLElement>('.markdown-body h1');
    if (titleDom && titleDom.nextSibling) {
      titleDom.style.margin = '0';
      const container = document.createElement('div');
      container.className = 'article-detail-container';
      const a = document.createElement('a');
      a.className = 'gitee';
      a.target = '_blank';
      a.textContent = t('docs.viewSource') || '';
      a.onclick = onClickSourceLink;
      const svgString = `
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 32 32">
          <path fill="currentColor" d="M14.123 3.2c0.442 0 0.8 0.358 0.8 0.8 0 0.398-0.29 0.728-0.67 0.79l-0.13 0.010h-8.523c-0.398 0-0.728 0.29-0.79 0.67l-0.010 0.13v20.8c0 0.398 0.29 0.728 0.67 0.79l0.13 0.010h20.8c0.398 0 0.728-0.29 0.79-0.67l0.010-0.13v-8.576c0-0.442 0.358-0.8 0.8-0.8 0.398 0 0.728 0.29 0.79 0.67l0.010 0.13v8.576c0 1.259-0.97 2.292-2.203 2.392l-0.197 0.008h-20.8c-1.259 0-2.292-0.97-2.392-2.203l-0.008-0.197v-20.8c0-1.259 0.97-2.292 2.203-2.392l0.197-0.008h8.523z"></path>
          <path fill="currentColor" d="M26.755 4.194c0.314-0.311 0.82-0.309 1.131 0.005 0.276 0.279 0.305 0.71 0.088 1.021l-0.093 0.11-8.651 8.571c-0.314 0.311-0.82 0.309-1.131-0.005-0.276-0.279-0.305-0.71-0.088-1.021l0.093-0.11 8.651-8.571z"></path>
          <path fill="currentColor" d="M26.667 3.2c1.113 0 2.027 0.852 2.125 1.939l0.009 0.194v6.667c0 0.442-0.358 0.8-0.8 0.8-0.398 0-0.728-0.29-0.79-0.67l-0.010-0.13v-6.667c0-0.258-0.183-0.473-0.426-0.522l-0.108-0.011h-6.667c-0.442 0-0.8-0.358-0.8-0.8 0-0.398 0.29-0.728 0.67-0.79l0.13-0.010h6.667z"> </path>
        </svg>
      `;
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      a.appendChild(svgDoc.documentElement);
      container.appendChild(a);
      titleDom.nextSibling.parentNode?.insertBefore(container, titleDom.nextSibling);
    }
  } else {
    const link = document.querySelector<HTMLElement>('.markdown-body .gitee') as HTMLAnchorElement;
    if (link) {
      link.remove();
    }
  }
};

watch([isPhone, width, roure], async () => {
  await nextTick();
  checkOverlap();
  insertGiteeBtn();
});
</script>

<template>
  <div v-show="!isPhone" class="gitee-view-source" :class="{ hidden: overlap }">
    <a ref="linkRef" class="link" @click="onClickSourceLink">
      <span class="title">{{ $t('docs.viewSource') }}</span>
      <OIcon class="icon"><IconOutLink /></OIcon>
    </a>
  </div>
</template>

<style lang="scss">
.article-detail-container {
  margin-top: var(--o-gap-2);
  margin-bottom: var(--o-gap-6);

  .gitee {
    display: flex;
    align-items: center;
    color: var(--o-color-link1) !important;
    text-decoration: none !important;

    svg {
      color: var(--o-color-link1);
      font-size: 14px;
      margin-left: 4px;
    }
  }
}
</style>

<style lang="scss" scoped>
.gitee-view-source {
  position: absolute;
  top: 0;
  right: 0;
  padding: var(--layout-doc-content-padding);
  @include tip1;

  @include hover {
    color: var(--o-color-link2);
  }

  .link {
    display: flex;
    align-items: center;
  }

  .icon {
    margin-left: 8px;
    @include text1;
  }
}

.hidden {
  visibility: hidden;
}
</style>
