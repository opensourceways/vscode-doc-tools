<script setup lang="ts">
import { OResult } from '@opensig/opendesign';

import ContentWrapper from '@/components/ContentWrapper.vue';
</script>

<template>
  <ContentWrapper class="result-404">
    <OResult>
      <!-- <template #image></template> -->
      <template #extra>
        <p class="text404">{{ $t('common.nonexistentDoc') }}</p>
      </template>
    </OResult>
  </ContentWrapper>
</template>

<style lang="scss" scoped>
.result-404 {
  width: 100%;
  min-height: calc(100vh - var(--layout-header-height) - var(--layout-doc-padding-top) - var(--layout-doc-padding-bottom) - 48px);
  display: flex;
  justify-content: center;
  align-items: center;

  @include respond-to('<=pad') { 
    height: calc(100vh - var(--layout-header-height) - var(--layout-doc-padding-top) - var(--layout-doc-padding-bottom) - 24px);
  }
}
.text404 {
  @include text2;
  color: var(--o-color-info1);
  margin-bottom: 24px;
}
</style>
