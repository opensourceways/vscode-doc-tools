<script setup lang="ts">
import { computed } from 'vue';
import { ODivider, OIcon, OIconArrowRight, OIconArrowLeft } from '@opensig/opendesign';

import type { DocMenuNodeT } from '@/utils/tree';

const props = defineProps<{
  manualNode?: DocMenuNodeT;
  pageNode?: DocMenuNodeT;
}>();

const emits = defineEmits<{
  (evt: 'page-change', type: 'prev' | 'next', item: DocMenuNodeT): void;
}>();

const getPageNodes = (node: DocMenuNodeT) => {
  const result = [];
  if (node.type === 'page') {
    result.push(node);
  }

  node.children.forEach((item) => {
    result.push(...getPageNodes(item));
  });

  return result;
};

const allPageNodes = computed(() => {
  return props.manualNode ? getPageNodes(props.manualNode) : [];
});

const config = computed(() => {
  const idx = allPageNodes.value.findIndex((item) => item.id === props.pageNode?.id);
  const prev = allPageNodes.value[idx - 1];
  const next = allPageNodes.value[idx + 1];
  return {
    prev,
    next,
  };
});
</script>

<template>
  <div v-if="config.prev || config.next" class="doc-footer">
    <ODivider />
    <div class="doc-footer-content">
      <a class="link-item-prev link-item" v-if="config.prev" @click="emits('page-change', 'prev', config.prev)">
        <OIcon class="icon-arrow-left">
          <OIconArrowLeft />
        </OIcon>
        <span class="prev-text-wrap">
          <span class="pre-text">{{ $t('docs.previous') }}</span>
          <span class="title-text">{{ config.prev.label }}</span>
        </span>
      </a>
      <span v-else class="link-item link-item-invisible" />

      <a class="link-item-next link-item" v-if="config.next" @click="emits('page-change', 'next', config.next)">
        <span class="next-text-wrap">
          <span class="title-text">{{ config.next.label }}</span>
          <span class="next-text">{{ $t('docs.next') }}</span>
        </span>
        <OIcon class="icon-arrow-right">
          <OIconArrowRight />
        </OIcon>
      </a>
      <span v-else class="link-item link-item-invisible" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.doc-footer {
  padding-bottom: 16px;
  margin-top: auto;

  @include respond-to('phone') { 
    padding-bottom: 0;
  }
}

.o-divider {
  --o-divider-gap: 32px 0 30px;

  @include respond-to('<=laptop') {
    --o-divider-gap: 24px 0 12px;
  }
}

.doc-footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.link-item-prev {
  justify-content: flex-start;
}

.link-item-next {
  justify-content: flex-end;
}

.link-item {
  flex: 1;
  display: flex;
  align-items: center;
  
  @include text1;

  @include respond-to('phone') {
    justify-content: space-between;
    padding: 16px 8px;
    border-radius: var(--o-radius-xs);
    background-color: var(--o-color-fill1);
  }

  .o-icon {
    @include h2;

    @include respond-to('phone') {
      font-size: 24px;
    }
  }
}

.link-item-invisible {
  opacity: 0;
  background-color: transparent;
}

.prev-text-wrap,
.next-text-wrap {
  display: flex;
  align-items: center;
  

  @include respond-to('phone') {
    gap: 4px;
  }
}

.prev-text-wrap {
  @include respond-to('phone') {
    flex-direction: column;
    align-items: flex-end;
  }
}

.next-text-wrap {
  @include respond-to('phone') {
    flex-direction: column-reverse;
    align-items: flex-start;
  }
}

.pre-text {
  padding: 0 16px 0 10px;
}

.next-text {
  padding: 0 10px 0 16px;
}

.pre-text,
.next-text {
  @include respond-to('phone') {
    padding: 0;
  }
}

.title-text {
  @include respond-to('phone') {
    @include text-truncate(1);
    @include text2;
  }
}

.icon-arrow-left {
  @include respond-to('phone') {
    padding-right: 8px;
  }
}

.icon-arrow-right {
  @include respond-to('phone') {
    padding-left: 8px;
  }
}
</style>
