<script setup lang="ts">
import { provide, type PropType } from 'vue';
import { useVModel } from '@vueuse/core';
import { OMenu } from '@opensig/opendesign';

import type { DocMenuNodeT } from '@/utils/tree';
import { isElementVisible } from '@/utils/element';
import { scrollIntoView } from '@/utils/scroll-to';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  expanded: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  defaultExpanded: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});
provide('parentProps', props);

const emits = defineEmits(['update:modelValue', 'update:expanded']);
const menuValue = useVModel(props, 'modelValue', emits);
const expanded = useVModel(props, 'expanded', emits);

provide('setCurrentNode', (_: DocMenuNodeT, el: HTMLElement) => {
  const parent = document.querySelector<HTMLElement>('#menuScrollDom .o-scroller-container');
  if (parent && !isElementVisible(el, parent, 38)) {
    scrollIntoView(el, parent, 100, 200);
  }
});
</script>

<template>
  <OMenu v-model="menuValue" v-model:expanded="expanded" class="recursion-menu" :default-expanded="defaultExpanded">
    <slot></slot>
  </OMenu>
</template>

<style lang="scss" scoped>
.recursion-menu {
  --menu-width: 272px;
  --menu-padding-v: 8px;
  --menu-padding-h: 8px;
  --menu-secondary-padding-v: 8px;
  --menu-secondary-padding-h: 8px;

  @include respond-to('<=laptop') {
    --menu-width: 207px;
  }
}
</style>
