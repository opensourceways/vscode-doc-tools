<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, ref, shallowRef, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { OIcon, OSkeleton, OSkeletonText, useMessage } from '@opensig/opendesign';

import NotFound from '@/components/NotFound.vue';
import DocMenu from '@/components/doc/DocMenu.vue';
import DocPagination from '@/components/doc/DocPagination.vue';
import MarkdownContent from '@/components/markdown/MarkdownContent.vue';
import MarkdownViewSource from '@/components/markdown/MarkdownViewSource.vue';

import IconExpand from '~icons/app/icon-expand.svg';

import { BroadcastBridge, MarkdownBridge, PageBridge, ResourceBridge, TocBridge } from 'webview-bridge/src/client';
import { useScreen } from '@/composables/useScreen';
import { DocMenuTree, type DocMenuNodeT } from '@/utils/tree';
import type { DocMenuT } from '@/@types/type-doc-menu';
import { getOffsetTop, getScrollRemainingBottom } from '@/utils/element';
import { scrollIntoView } from '@/utils/scroll-to';
import { useLocale } from '@/composables/useLocale';

const route = useRoute();
const router = useRouter();
const { lePad, isPhone } = useScreen();
const message = useMessage();
const { t } = useLocale();

// -------------------- 菜单 --------------------
let tree: DocMenuTree | null = null;
const currentNode = shallowRef<DocMenuNodeT>();
const pageNode = shallowRef<DocMenuNodeT>();
const manualNode = shallowRef<DocMenuNodeT>();
const menuItems = shallowRef<DocMenuNodeT[]>([]);
const menuVal = ref('');
const menuExpandedKeys = ref<string[]>([]);

const isSidebarHidden = ref(true);
const switchMenu = () => {
  isSidebarHidden.value = !isSidebarHidden.value;
};

// 点击菜单跳转文档
const onChangeItem = (item: DocMenuNodeT) => {
  if ((item.type !== 'page' && item.type !== 'anchor') || !item.href) {
    return;
  }

  router.replace({
    query: {
      fsPath: item.href,
    },
  });
};

// 更新展开
const updateExpandedKeys = () => {
  let item = pageNode.value;
  while (item) {
    if (item.id && !menuExpandedKeys.value.includes(item.id)) {
      menuExpandedKeys.value.push(item.id);
    }

    item = item.parent!;
  }
};

const onPageChange = (_: string, item: DocMenuNodeT) => {
  onChangeItem(item);
  setTimeout(updateExpandedKeys, 300);
};

// -------------------- 容器滚动更新锚点选中 --------------------
const isScrolling = ref(false);

const onChangeAnchor = (value: string) => {
  menuVal.value = value;
  if (pageNode.value && !menuExpandedKeys.value.includes(pageNode.value.id)) {
    updateExpandedKeys();
  }
};

const onScrollUpdateAnchor = () => {
  if (loading.value || isScrolling.value || !pageNode.value) {
    return;
  }

  const scrollContainer = document.querySelector<HTMLElement>('#app > .o-scroller > .o-scroller-container');
  if (!scrollContainer) {
    return;
  }

  const contentDom = document.querySelector('.ly-doc');
  if (!contentDom) {
    return;
  }

  const scrollRemainingBottom = getScrollRemainingBottom(scrollContainer);
  const distances: Array<{ item: DocMenuNodeT; top: number }> = [];
  const titleDom = contentDom.querySelector<HTMLElement>('h1');
  if (titleDom) {
    const top = getOffsetTop(titleDom, scrollContainer);
    if (top < 110 || (scrollRemainingBottom < 100 && top >= 110)) {
      distances.push({
        item: pageNode.value,
        top,
      });
    }
  }

  const allChildren: DocMenuNodeT[] = [];
  pageNode.value.children.forEach((item) => {
    allChildren.push(item);
    if (item.children.length > 0) {
      item.children.forEach((e) => {
        allChildren.push(e);
      });
    }
  });

  for (const item of allChildren) {
    if (!item.href || !item.href.includes('#')) {
      continue;
    }

    const [_, hash] = item.href.split('#');
    const id = decodeURIComponent(hash);
    const target = contentDom.querySelector<HTMLElement>(`#${id}`);
    if (!target) {
      continue;
    }

    const top = getOffsetTop(target, scrollContainer);

    if (top < 110 || (scrollRemainingBottom < 100 && top >= 110)) {
      distances.push({
        item,
        top,
      });
    }
  }

  if (distances.length) {
    if (scrollRemainingBottom < 10) {
      onChangeAnchor(distances[distances.length - 1].item.id);
    } else if (scrollRemainingBottom < 110) {
      const overNodes = distances.filter((item) => item.top >= 110);
      if (overNodes.length) {
        const average = Math.round(110 / overNodes.length);
        const node = overNodes.find((_, i) => (i + 1) * average < 110 - scrollRemainingBottom);
        if (node) {
          onChangeAnchor(node.item.id);
        }
      }
    } else {
      const max = distances.reduce((prev, cur) => (prev.top > cur.top ? prev : cur));
      onChangeAnchor(max.item.id);
    }
  } else {
    onChangeAnchor(pageNode.value.id);
  }
};

onMounted(() => {
  const scrollContainer = document.querySelector<HTMLElement>('#app > .o-scroller > .o-scroller-container');
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', onScrollUpdateAnchor);
  }
});

onBeforeUnmount(() => {
  const scrollContainer = document.querySelector<HTMLElement>('#app > .o-scroller > .o-scroller-container');
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', onScrollUpdateAnchor);
  }
});

// -------------------- 滚动到指定的标题锚点 --------------------
const scrollIntoTitle = async (titleId: string) => {
  if (isScrolling.value || !titleId) {
    return;
  }

  isScrolling.value = true;
  const contentDom = document.querySelector('.ly-doc');
  if (contentDom) {
    const target = contentDom.querySelector<HTMLElement>(`#${titleId}`) || contentDom.querySelector<HTMLElement>(`[name='${titleId.slice(1)}']`);
    const scrollContainer = document.querySelector<HTMLElement>('#app > .o-scroller > .o-scroller-container');
    if (target && scrollContainer) {
      await scrollIntoView(target, scrollContainer);
    }
  }

  isScrolling.value = false;
};

// -------------------- 获取数据 --------------------
let initData = true;
let lastTocPath = '';
const loading = ref(false);
const content = ref('');
const showContent = ref(true);

const getToc = async (mdPath: string) => {
  const tocData = await TocBridge.getManualToc(mdPath);
  if (!tocData) {
    return;
  }

  tree = new DocMenuTree([tocData.tocObj] as DocMenuT[]);
  menuItems.value = tree.root.children;
  manualNode.value = tree.root.children?.[0];
  lastTocPath = tocData.tocPath!;
};

const getData = async (mdPath: string, loadMenuData = false, showLoading = true) => {
  loading.value = showLoading;
  const mdContent = await MarkdownBridge.getMarkdownHtml(mdPath);
  showContent.value = mdContent !== null;
  if (mdContent === null) {
    PageBridge.setWebviewTitle(t('common.nonexistentDoc'));
  } else {
    content.value = mdContent;
    if (loadMenuData) {
      await getToc(mdPath);
    }

    PageBridge.setWebviewTitle(mdPath.split('/').pop() || '404');
    await nextTick();
  }
  loading.value = false;
};

watch(
  () => route.query.fsPath,
  async () => {
    const { fsPath } = route.query;
    if (typeof fsPath !== 'string') {
      return;
    }

    const [mdPath, hash] = fsPath.split('#');
    if (mdPath !== pageNode.value?.id) {
      await getData(mdPath, initData);
    }

    let node = tree?.getNode(tree.root, 'id', fsPath);
    if (node) {
      currentNode.value = node;
      menuVal.value = fsPath;
    } else {
      node = tree?.getNode(tree.root, 'id', mdPath);
      if (node) {
        currentNode.value = node;
        menuVal.value = mdPath;
      }
    }

    pageNode.value = currentNode.value?.type === 'page' ? currentNode.value : currentNode.value?.parent!;

    if (initData || route.query.refreshExpanded === '1') {
      updateExpandedKeys();
    }

    initData = false;

    if (hash) {
      await nextTick();
      scrollIntoTitle(hash);
    }
  },
  {
    immediate: true,
  }
);

// -------------------- 处理 markdown 内容点击 --------------------
const onMarkdownClick = (evt: MouseEvent) => {
  const target = evt.target as HTMLElement;
  const el = target.closest('a');
  if (!el) {
    return;
  }

  evt.preventDefault();

  if (el.href.startsWith('doctools://markdown?fsPath=')) {
    router.replace({
      query: {
        fsPath: decodeURIComponent(el.href.replace('doctools://markdown?fsPath=', '')),
        refreshExpanded: 1,
      },
    });
    return;
  }

  if (el.href.startsWith('doctools://tip?type=non-exists')) {
    message.danger({
      content: t('docs.invalidLink'),
    });

    return;
  }
};

// -------------------- 监听 vscode 内容变化 --------------------
const onMarkdownContentChange = (mdPath: string) => {
  if (mdPath !== route.query.fsPath) {
    return;
  }

  getData(mdPath, true, false);
};

const onTocConetentChange = async (tocPath: string) => {
  if (lastTocPath !== tocPath || typeof route.query.fsPath !== 'string') {
    return;
  }

  await getToc(route.query.fsPath.split('#')[0]);
};

onMounted(() => {
  BroadcastBridge.addMarkdownContentChangeListener(onMarkdownContentChange);
  BroadcastBridge.addTocContentChangeListener(onTocConetentChange);
});

onUnmounted(() => {
  BroadcastBridge.removeMarkdownContentChangeListener(onMarkdownContentChange);
  BroadcastBridge.removeTocContentChangeListener(onTocConetentChange);
});

// -------------------- 查看 _toc.yaml 源文件 --------------------
const viewTocFile = () => {
  if (lastTocPath) {
    ResourceBridge.viewSource(lastTocPath);
  }
};
</script>

<template>
  <div class="ly-container">
    <template v-if="menuItems.length > 0">
      <div v-if="!isPhone" class="doc-sidebar" :class="{ 'is-closed': lePad && isSidebarHidden }">
        <DocMenu v-model="menuVal" v-model:expanded="menuExpandedKeys" :items="menuItems" recursion @click="onChangeItem" @view-toc-source="viewTocFile" />
        <div class="menu-opener" @click="switchMenu">
          <div class="opener-thumb"></div>
        </div>
      </div>
      <div v-if="isPhone" class="doc-sidebar-mb">
        <div class="sidebar-top">
          <div class="menu-opener-mb" :class="{ 'menu-opener-mb-active': !isSidebarHidden }">
            <OIcon @click="switchMenu"><IconExpand /></OIcon>
            <span class="mb-title">{{ $t('docs.preview') }}</span>
          </div>
        </div>
      </div>
      <div v-if="isPhone" class="doc-menu-mb" :class="[isSidebarHidden ? 'is-closed' : '']">
        <DocMenu v-model="menuVal" v-model:expanded="menuExpandedKeys" :items="menuItems" recursion @click="onChangeItem" @view-toc-source="viewTocFile" />
      </div>
      <div ref="maskRef" class="aside-mask" @click="switchMenu"></div>
    </template>

    <div class="ly-doc" :class="{ 'ly-doc-no-menu': menuItems.length === 0 }">
      <div class="doc-body">
        <OSkeleton :animation="true" :loading="loading">
          <template #template>
            <div class="skeleton-detail">
              <OSkeletonText :rows="1" />
              <OSkeletonText v-for="i in 3" :key="i" :rows="4" />
            </div>
          </template>

          <template v-if="showContent">
            <MarkdownViewSource />
            <MarkdownContent :html="content" @click="onMarkdownClick" />
            <DocPagination :manual-node="manualNode" :page-node="pageNode" @page-change="onPageChange" />
          </template>
          <NotFound v-else />
        </OSkeleton>
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
    --layout-doc-width: min(1200px, calc(var(--vw100) - var(--layout-doc-menu-offset-left) - var(--layout-doc-offset-right)));
  }

  @include respond-to('<=pad') {
    --layout-doc-content-padding: 12px 40px;
    --layout-doc-menu-offset-left: max(calc(2px + (var(--vw100) - 1920px) / 2), 32px);
    --layout-doc-menu-gap: 32px;
    --layout-doc-offset-left: var(--layout-doc-menu-gap);
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
    font-size: var(--o-icon_size-m);
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
  padding-top: var(--layout-doc-padding-top);
}

.doc-body {
  position: relative;
  min-height: calc(100vh - var(--layout-header-height) - var(--layout-doc-padding-top) - var(--layout-doc-padding-bottom) - 48px);
  padding: var(--layout-doc-content-padding);
  border-radius: var(--o-radius-xs);
  background: var(--o-color-fill2);
  display: flex;
  flex-direction: column;

  @include respond-to('<=pad') {
    min-height: calc(100vh - var(--layout-header-height) - var(--layout-doc-padding-top) - var(--layout-doc-padding-bottom) - 24px);
  }
}

.mb-title {
  margin-left: 8px;
  @include h2;
}
</style>
