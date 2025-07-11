<script setup lang="ts">
import { type PropType } from 'vue';
import { useVModel } from '@vueuse/core';
import { OScroller, OMenuItem } from '@opensig/opendesign';

import RecursionMenu from '@/components/menu/RecursionMenu.vue';
import RecursionMenuItem from '@/components/menu/RecursionMenuItem.vue';

import { type DocMenuNodeT } from '@/utils/tree';

const props = defineProps({
  // 绑定值
  modelValue: {
    type: String,
    default: '',
  },
  // 菜单数据
  items: {
    type: Array as PropType<DocMenuNodeT[]>,
    default: () => [],
  },
  // 展开子项
  expanded: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  // 默认展开子菜单项
  defaultExpanded: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});

const emits = defineEmits<{
  (evt: 'update:modelValue', value: string): void;
  (evt: 'update:expanded', value: string): void;
  (evt: 'click', item: DocMenuNodeT, newOpener?: boolean): void;
  (evt: 'click-title', item: DocMenuNodeT): void;
}>();

const menuValue = useVModel(props, 'modelValue', emits);
const expanded = useVModel(props, 'expanded', emits);
</script>

<template>
  <aside class="doc-menu">
    <OScroller id="menuScrollDom" show-type="hover" size="small" disabled-x>
      <RecursionMenu v-model="menuValue" v-model:expanded="expanded" :default-expanded="defaultExpanded">
        <template v-if="items.length > 0">
          <OMenuItem class="menu-title">{{ items[0].label }}</OMenuItem>
          <!-- 手册只有一篇文章且和手册名相同 -->
          <template v-if="items[0].children.length === 1 && items[0].children[0].label === items[0].label">
            <RecursionMenuItem
              class="menu-content"
              v-for="item in items[0].children[0].children"
              :key="item.id"
              :node="item"
              @click="(el) => emits('click', el)"
            />
          </template>
          <template v-else>
            <RecursionMenuItem class="menu-content" v-for="item in items[0].children" :key="item.id" :node="item" @click="(el) => emits('click', el)" />
          </template>
        </template>
      </RecursionMenu>
    </OScroller>
  </aside>
</template>

<style lang="scss" scoped>
.doc-menu {
  height: 100%;

  .o-scroller {
    height: 100%;
    padding-right: 20px;
  }

  .menu-title {
    --menu-padding-v: 0;
    --menu-padding-h: 0;
    font-weight: 500;
    margin-bottom: 16px;
    cursor: auto;
    @include text2;

    @include hover {
      --menu-item-bg-color-hover: transparent;
    }

    @include respond-to('<=laptop') {
      margin-bottom: 12px;
    }
  }

  .menu-content {
    margin-left: 8px;
  }

  .chapter-menu {
    --menu-width: 272px;
    --menu-padding-v: 8px;
    --menu-padding-h: 4px;

    @include respond-to('<=laptop') {
      --menu-width: 207px;
      --menu-padding-v: 5px;
    }

    .chapter-item {
      position: relative;
      &::before {
        content: '';
        position: absolute;
        height: calc(100% + 16px);
        left: 0;
        top: 4px;
        bottom: 4px;
        border-left: 1px solid var(--o-color-control4);
      }
      &:last-of-type {
        &::before {
          height: 36px;
        }
      }
    }

    .chapter-item-is-manual {
      &::before {
        display: none;
      }
    }

    .chapter-menu-item2 {
      --menu-item-color: var(--o-color-info2);
      @include text1;

      @include hover {
        --menu-item-bg-color-hover: transparent;
        --menu-item-color: var(--o-color-primary2);
      }
    }

    .chapter-item:has(.chapter-menu-item) + .chapter-item {
      margin-top: 16px;
    }

    .chapter-title {
      font-weight: 500;
      color: var(--o-color-info1);
      margin: 0 0 4px 4px;
      padding: 8px 4px;
      cursor: pointer;
      @include text1;

      &:not(.chapter-title-active) {
        @include hover {
          background-color: var(--o-color-control2-light);
        }
      }
    }

    .chapter-title-active {
      color: var(--o-color-primary1);
      background-color: var(--o-color-primary1-light);
      border-radius: var(--o-radius-xs);
      position: relative;

      &::before {
        content: '';
        position: absolute;
        height: auto;
        left: -4px;
        top: 4px;
        bottom: 4px;
        border-left: 2px solid var(--o-color-primary1);
        border-radius: 2px;
      }
    }

    .chapter-menu-item {
      --menu-item-color: var(--o-color-info2);
      color: var(--o-color-info2);

      margin-left: 16px;
      @include text1;

      @include hover {
        color: var(--o-color-info2);
      }

      @include respond-to('<=laptop') {
        margin-left: 13px;
      }
    }

    .chapter-menu-item {
      position: relative;
      &::before {
        content: '';
        position: absolute;
        height: 100%;
        left: 0;
        top: 4px;
        bottom: 4px;
      }
      &:last-of-type {
        &::before {
          height: calc(100% - 8px);
        }
      }
    }

    .o-menu-item + .o-menu-item {
      margin-top: 0;
    }

    .chapter-menu-item4 {
      --menu-item-color: var(--o-color-info4);
      margin-left: 16px;
      margin-top: 4px;
      cursor: auto;
      @include text1;

      @include hover {
        --menu-item-bg-color-hover: transparent;
      }

      @include respond-to('<=laptop') {
        margin-left: 13px;
      }
    }

    .sub-menu-children {
      margin-left: 16px;

      @include respond-to('<=laptop') {
        margin-left: 13px;
      }

      .child-chapter-menu-item {
        --menu-item-color: var(--o-color-info2);
        @include text1;

        @include hover {
          --menu-item-bg-color-hover: transparent;
          --menu-item-color: var(--o-color-primary2);
        }
      }
    }

    a {
      color: inherit;

      @include hover {
        color: var(--o-color-primary2);
      }
    }
  }
}

@include in-dark {
  .doc-menu {
    .chapter-title-active {
      background-color: var(--o-color-control3-light);
    }
  }
}
</style>
