<script setup lang="ts">
import { OScroller } from '@opensig/opendesign';
import { useRouter } from 'vue-router';
import { injectData } from '@/utils/inject';

const router = useRouter();

const setTheme = (theme: 'dark' | 'light') => {
  const documentElement = document.documentElement;
  if (theme === 'dark') {
    documentElement.setAttribute('data-o-theme', 'dark');
    documentElement.classList.add('dark');
  } else {
    documentElement.removeAttribute('data-o-theme');
    documentElement.classList.remove('dark');
  }
};

setTheme(injectData?.theme || 'light');
router.replace({
  path: injectData.path,
  query: injectData.query,
});
</script>

<template>
  <OScroller show-type="hover" disabled-x auto-update-on-scroll-size>
    <main class="ly-main">
      <RouterView />
    </main>
  </OScroller>
</template>

<style lang="scss">
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--o-color-fill1);
  color: var(--o-color-info1);

  --vw100: 100vw;

  --layout-header-height: 0px;
  --layout-header-zIndex: 101;
  --layout-header-max-width: 1440px;
  --layout-header-padding: 12px;

  --layout-content-max-width: 1440px;
  --layout-content-padding: 10px;

  --layout-doc-padding-top: 32px;
  --layout-doc-padding-bottom: var(--layout-doc-padding-top);

  --layout-footer-height: 474px;

  --layout-screen-height: 100vh;

  --layout-content-min-height: calc(var(--layout-screen-height) - var(--layout-header-height));

  @include respond-to('<=laptop') {
    --layout-header-max-width: 100%;
    --layout-header-padding: 5%;

    --layout-content-max-width: 100%;
    --layout-content-padding: 5%;

    --layout-footer-height: 438px;
  }

  @include respond-to('<=pad') {
    --layout-header-padding: 32px;

    --layout-content-padding: 32px;

    --layout-footer-height: 434px;
  }

  @include respond-to('<=pad_v') {
    --layout-header-height: 0px;
  }

  @include respond-to('phone') {
    --layout-header-padding: 24px;

    --layout-content-padding: 24px;
  }
}
</style>

<style lang="scss" scoped>
.o-scroller {
  height: var(--layout-screen-height);
  background-color: var(--o-color-fill1);
  --scrollbar-height: calc(var(--layout-screen-height) - var(--layout-header-height) * 2 - 10px);
  :deep(.o-scroller-container) {
    scroll-padding-top: var(--layout-header-height);
  }
}
.ly-main {
  min-height: calc(var(--layout-content-min-height) + var(--layout-header-height));
  background-color: var(--o-color-fill1);
  padding-top: var(--layout-header-height);
}
</style>
