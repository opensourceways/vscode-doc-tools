<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { OIcon, useMessage } from '@opensig/opendesign';

import DocMenu from '@/components/doc/DocMenu.vue';
import MarkdownContent from '@/components/markdown/MarkdownContent.vue';

import IconExpand from '~icons/app/icon-expand.svg';

import { MarkdownBridge, TocBridge } from 'webview-bridge/src/client';
import { useScreen } from '@/composables/useScreen';
import { DocMenuTree, type DocMenuNodeT } from '@/utils/tree';
import type { DocMenuT } from '@/@types/type-doc-menu';
import { useClipboard } from '@/composables/useClipboard';
const { lePad, isPhone } = useScreen();
const message = useMessage(null);

// -------------------- 菜单 --------------------
let tree = null;
const menuItems = shallowRef<DocMenuNodeT[]>([]);
const menuVal = ref('');
const menuExpandedKeys = ref<string[]>([]);

const isSidebarHidden = ref(true);
const switchMenu = () => {
  isSidebarHidden.value = !isSidebarHidden.value;
};

// 点击菜单跳转文档
const onClickMenuItem = () => {};

// -------------------- markdown内容 --------------------
const content = ref('');
onMounted(async () => {
  content.value = await MarkdownBridge.getMarkdownHtml();
  const menuData = await TocBridge.getManualToc();
  tree = new DocMenuTree([menuData] as DocMenuT[]);
  menuItems.value = tree.root.children;
  nextTick(() => {
    copyDoc();
  });
});

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
          message.success({ content: '复制成功' });
        },
      })
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
  <div class="ly-container">
    <template v-if="menuItems.length > 0">
      <div v-if="!isPhone" class="doc-sidebar" :class="{ 'is-closed': lePad && isSidebarHidden }">
        <DocMenu v-model="menuVal" v-model:expanded="menuExpandedKeys" :items="menuItems" recursion @click="onClickMenuItem" />
        <div class="menu-opener" @click="switchMenu">
          <div class="opener-thumb"></div>
        </div>
      </div>
      <div v-if="isPhone" class="doc-sidebar-mb">
        <div class="sidebar-top">
          <div class="menu-opener-mb" :class="{ 'menu-opener-mb-active': !isSidebarHidden }">
            <OIcon @click="switchMenu"><IconExpand /></OIcon>
          </div>
        </div>
      </div>
      <div v-if="isPhone" class="doc-menu-mb" :class="[isSidebarHidden ? 'is-closed' : '']">
        6666
        <DocMenu v-model="menuVal" v-model:expanded="menuExpandedKeys" :items="menuItems" recursion @click="onClickMenuItem" />
      </div>
      <div ref="maskRef" class="aside-mask" @click="switchMenu"></div>
    </template>

    <div class="ly-doc" :class="{ 'ly-doc-no-menu': false }">
      <div class="doc-body">
        <MarkdownContent :html="content" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.ly-container {
  --layout-doc-content-max-width: 1064px;
  --layout-doc-content-padding: 24px 40px;

  // 菜单左间距
  --layout-doc-menu-offset-left: max(calc(64px + (var(--vw100) - 1920px) / 2), 64px);
  // 菜单宽度
  --layout-doc-menu-width: 272px;
  // 菜单文档间距
  --layout-doc-menu-gap: 32px;
  // 文档左间距
  --layout-doc-offset-left: calc(var(--layout-doc-menu-width) + var(--layout-doc-menu-offset-left) + var(--layout-doc-menu-gap));
  // 文档右间距
  --layout-doc-offset-right: var(--layout-doc-offset-left);

  @include respond-to('<=laptop') {
    --layout-doc-content-padding: 24px 40px;
    --layout-doc-menu-offset-left: max(calc(40px + (var(--vw100) - 1920px) / 2), 40px);
    --layout-doc-menu-width: 206px;
    --layout-doc-menu-gap: 24px;
  }

  @include respond-to('<=pad') {
    --layout-doc-content-padding: 12px 40px;
    --layout-doc-menu-offset-left: max(calc(2px + (var(--vw100) - 1920px) / 2), 32px);
    --layout-doc-menu-gap: 32px;
    --layout-doc-offset-left: var(--layout-doc-menu-gap);
    --layout-doc-width: min(1200px, calc(var(--vw100) - var(--layout-doc-menu-offset-left) - var(--layout-doc-offset-right)));
  }
  @include respond-to('phone') {
    --layout-doc-content-padding: 12px;
    --layout-doc-menu-offset-left: max(calc(24px + (var(--vw100) - 1920px) / 2), 24px);
    --layout-doc-menu-gap: 24px;
    --layout-doc-offset-left: var(--layout-doc-menu-gap);
    --layout-doc-width: min(1200px, calc(var(--vw100) - var(--layout-doc-menu-offset-left) * 2));
  }
}
</style>

<style lang="scss" scoped>
.doc-sidebar {
  position: fixed;
  top: var(--layout-header-height);
  z-index: 35;
  bottom: 0;
  left: 0;
  padding-left: var(--layout-doc-menu-offset-left);
  padding-top: var(--layout-doc-padding-top);
  padding-bottom: var(--layout-doc-padding-top);
}
@include respond-to('<=pad') {
  .doc-sidebar {
    bottom: 0;
    background-color: var(--o-color-fill2);
    padding-left: 24px;
    padding-right: 12px;
    padding-top: 24px;
    padding-bottom: 24px;

    :deep(.doc-menu) {
      .o-scroller {
        padding-right: 24px;
      }
    }
  }
}

.menu-opener {
  --thumb-height: 32px;
  --thumb-width: 3px;
  --padding-h: 16px;
  --padding-l: 6px;
  --padding-r: 6px;
  --height: calc(var(--padding-h) * 2 + var(--thumb-height));
  background-color: var(--o-color-fill2);
  cursor: pointer;
  font-size: 24px;
  padding: var(--padding-h);
  padding-left: var(--padding-l);
  padding-right: var(--padding-r);
  position: absolute;
  right: 0;
  top: 50%;
  transform: translate(100%, -50%);
  transition: background-color 0.2s linear, border-radius 0.5s linear;
  z-index: 5;
  border-radius: 0 var(--o-radius-s) var(--o-radius-s) 0;
  margin-right: 1px;

  @include hover {
    :deep(.opener-thumb) {
      background-color: var(--o-color-primary1);
    }
  }
}
@include respond-to('>pad') {
  .menu-opener {
    display: none;
  }
}
@include respond-to('phone') {
  .menu-opener {
    display: none;
  }
}
.opener-thumb {
  background-color: var(--o-color-info3);
  border-radius: 100px;
  height: var(--thumb-height);
  width: var(--thumb-width);
}
.doc-sidebar.is-closed {
  transform: translate(-100%);
  .menu-opener {
    border-radius: 0 var(--o-radius-s) var(--o-radius-s) 0;
    box-shadow: var(--o-shadow-2);

    @include hover {
      :deep(.opener-thumb) {
        background-color: var(--o-color-primary1);
      }
    }
  }
  & + .aside-mask {
    opacity: 0;
    pointer-events: none;
  }
}
.doc-sidebar.is-closed + .aside-mask {
  opacity: 0;
}

.doc-sidebar-mb {
  width: 100%;
  position: fixed;
  z-index: 35;
  top: var(--layout-header-height);
  left: 0;
}
.sidebar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background-color: var(--o-color-fill2);
  box-shadow: var(--o-shadow-2);
}
.menu-opener-mb {
  display: flex;
  align-items: center;
  color: var(--o-color-info1);

  .o-icon svg {
    width: var(--o-icon_size-m);
  }
}
.menu-opener-mb-active {
  .o-icon {
    transform: rotate(-180deg);
  }
}
.doc-menu-mb {
  width: 255px;
  height: calc(100% - var(--layout-header-height) - 48px);
  background-color: var(--o-color-fill2);
  padding: 16px 4px 16px 24px;
  position: fixed;
  z-index: 35;
  top: calc(var(--layout-header-height) + 48px);
  left: 0;
}
.doc-menu-mb.is-closed {
  transform: translate(-100%);
  & + .aside-mask {
    opacity: 0;
    pointer-events: none;
  }
}
.doc-menu-mb.is-closed + .aside-mask {
  opacity: 0;
}

.aside-mask {
  background-color: var(--o-color-mask1);
  bottom: 0;
  content: '';
  left: 0;
  opacity: 0;
  pointer-events: none;
  position: fixed;
  right: 0;
  top: 0;
  transition: var(--all-transition);
  z-index: 34;
}
@include respond-to('<=pad') {
  .aside-mask {
    opacity: 1;
    pointer-events: auto;
  }
}

.ly-doc {
  padding-top: var(--layout-doc-padding-top);
  padding-bottom: var(--layout-doc-padding-bottom);
  margin-left: var(--layout-doc-offset-left);
  margin-right: var(--layout-doc-offset-right);
  width: var(--layout-doc-width);
  @include respond-to('phone') {
    padding-top: calc(var(--layout-doc-padding-top) + 40px);
  }
}

.ly-doc-no-menu {
  max-width: var(--layout-content-max-width);
  margin: 0 auto;
}

.doc-body {
  position: relative;
  min-height: calc(100vh - var(--layout-header-height) - var(--layout-doc-padding-top) - var(--layout-doc-padding-bottom) - 48px);
  padding: var(--layout-doc-content-padding);
  border-radius: var(--o-radius-xs);
  background: var(--o-color-fill2);
  display: flex;
  flex-direction: column;
}
</style>
