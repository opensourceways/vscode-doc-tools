<script setup lang="ts">
import { inject, onBeforeUnmount, onMounted, ref, watch, type PropType } from 'vue';
import { isArray, OMenuItem, OSubMenu } from '@opensig/opendesign';

import type { DocMenuNodeT } from '@/utils/tree';

const props = defineProps({
  node: {
    type: Object as PropType<DocMenuNodeT>,
    required: true,
  },
});

const itemRef = ref();
const emits = defineEmits(['click']);
const parentProps = inject<{
  readonly modelValue: string;
}>('parentProps');

const setCurrentNode = inject<(node: DocMenuNodeT, el: HTMLElement) => void>('setCurrentNode');

watch(
  () => parentProps?.modelValue,
  () => {
    if (props.node.id === parentProps?.modelValue && itemRef.value?.$el) {
      setCurrentNode?.(props.node, itemRef.value.$el);
    }
  }
);

const stopPropagation = (ev: MouseEvent) => ev.stopPropagation();

onMounted(() => {
  if (isArray(props.node.children) && props.node.children.length > 0 && itemRef.value?.$el) {
    const el = itemRef.value.$el.querySelector('.o-sub-menu-children') as HTMLElement;
    if (el) {
      el.addEventListener('click', stopPropagation);
    }
  }
});

onBeforeUnmount(() => {
  if (isArray(props.node.children) && props.node.children.length > 0 && itemRef.value?.$el) {
    const el = itemRef.value.$el.querySelector('.o-sub-menu-children') as HTMLElement;
    if (el) {
      el.removeEventListener('click', stopPropagation);
    }
  }
});
</script>

<template>
  <OSubMenu
    v-if="isArray(node.children) && node.children.length > 0"
    ref="itemRef"
    class="recursion-sub-menu"
    :class="{ 'recursion-sub-menu-anchor': node.children.length && node.children.every(item => item.type === 'anchor') }"
    :id="node.id === parentProps?.modelValue ? 'rec-active-menu-item' : undefined"
    :value="node.id"
    :selectable="node.type === 'page'"
    :title="node.label"
    @click="emits('click', node)"
  >
    <template #title>
      <a v-if="node.href" :href="node.href" @click.prevent>{{ node.label }}</a>
      <span v-else>{{ node.label }}</span>
    </template>
    <RecursionMenuItem v-for="item in node.children" :key="item.id" :node="item" @click="(el) => emits('click', el)" />
  </OSubMenu>
  <OMenuItem
    v-else
    ref="itemRef"
    :id="node.id === parentProps?.modelValue ? 'rec-active-menu-item' : undefined"
    class="recursion-menu-item"
    :value="node.id"
    @click="emits('click', node)"
    :title="node.label"
  >
    <a v-if="node.href" :href="node.href" @click.prevent>{{ node.label }}</a>
    <span v-else>{{ node.label }}</span>
  </OMenuItem>
</template>

<style lang="scss" scoped>
.recursion-sub-menu {
  --sub-menu-bg-color-selected: transparent;
  --sub-menu-color: var(--o-color-info2);

  :deep(.o-sub-menu-title) {
    padding-left: 4px !important;
  }

  :deep(.o-sub-menu-title-content) {
    display: inline-block;
    width: 100%;
    @include text1;
  }

  :deep(.o-sub-menu-title-arrow) {
    right: 4px;
  }

  :deep(.o-sub-menu-children) {
    position: relative;
    padding-left: 16px;

    @include respond-to('<=laptop') {
      padding-left: 13px;
    }

    .o-sub-menu-title {
      margin-left: 4px;
    }
  }
}

.recursion-sub-menu-anchor {
  :deep(.o-sub-menu-children) {
    &::before {
      content: '';
      position: absolute;
      left: 16px;
      top: 4px;
      bottom: 4px;
      border-left: 1px solid var(--o-color-control4);

      @include respond-to('<=laptop') {
        left: 13px;
      }
    }
  }
}

.recursion-menu-item {
  padding-left: 4px !important;
  --menu-item-color: var(--o-color-info2);

  :deep(.o-menu-item-content) {
    display: inline-block;
    width: 100%;
    @include text1;
  }
}

.o-menu-item + .o-sub-menu,  .o-sub-menu, .o-menu-item {
  margin-top: 2px;
}

.o-sub-menu-selected > :deep(.o-sub-menu-title) {
  background-color: var(--o-color-control3-light);
}

.recursion-sub-menu :deep(.recursion-menu-item) {
  position: relative;
  margin-left: 4px;
}

.o-sub-menu-associated-selected .o-menu-item-selected::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 4px;
  bottom: 4px;
  border-left: 2px solid var(--o-color-primary1);
}

a {
  width: 100%;
  color: inherit;
  outline: none;
  white-space: normal;
  @include text-truncate(1);

  @include hover {
    color: inherit;
    outline: none;
  }
}
</style>
