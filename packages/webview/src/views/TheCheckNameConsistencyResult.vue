<script setup lang="ts">
import { computed, ref } from 'vue';
import { isArray, OTable, OLink } from '@opensig/opendesign';

import { injectData } from '@/utils/inject';
import { ResourceBridge } from 'webview-bridge';

// -------------------- 表格相关 --------------------
const columns = [
  { label: '类型', key: 'type', style: 'width:10%' },
  { label: '名称', key: 'name', style: 'width:20%' },
  { label: '路径', key: 'path', style: 'width:20%' },
  { label: '相似名称', key: 'similarName', style: 'width:20%' },
  { label: '相似路径', key: 'similarPath', style: 'width:20%' },
  { label: '操作', key: 'action', style: 'width:10%' },
];

const data = ref<Record<string, any>[]>([]);
if (isArray(injectData.extras?.results)) {
  injectData.extras.results.sort((a, b) => {
    return (a.extras ? 0 : 1) - (b.extras ? 0 : 1);
  });

  data.value = injectData.extras.results.map((item) => {
    return {
      type: item.message,
      name: item.content.split('/').pop(),
      path: item.content,
      similarName: item.extras?.split('/')?.pop() || '',
      similarPath: item.extras,
    };
  });
}

const unmatchedCounts = computed(() => {
  return data.value.filter((item) => item.type === '中英文名称不一致').length;
});

const onClickSourceLink = (path: string) => {
  ResourceBridge.viewSource(path);
};

const onRemoveItem = (row: Record<string, any>) => {
  data.value = data.value.filter((item) => item.path !== row.path);
};
</script>

<template>
  <div class="check-name-result">
    <h1 class="title">检查项：中英文文档名称一致性</h1>
    <div class="text">【检查路径】：{{ injectData.extras?.fsPath }}</div>
    <div class="text">
      【检查结果】：共检查出 <span class="red">{{ data.length }}</span> 项；其中 <span class="red">{{ unmatchedCounts }}</span> 项为中英文文档名称不一致，<span
        class="red"
        >{{ data.length - unmatchedCounts }}</span
      >
      项为不存在对应的中文/英文文档
    </div>
    <OTable class="file-tree-body" :columns="columns" :data="data" border="all">
      <template #td_name="{ row }">
        <OLink class="link" color="primary" @click="onClickSourceLink(row.path)">{{ row.name }}</OLink>
      </template>
      <template #td_similarName="{ row }">
        <OLink class="link" color="primary" @click="onClickSourceLink(row.similarPath)">{{ row.similarName }}</OLink>
      </template>
      <template #td_action="{ row }">
        <OLink class="link" color="danger" @click="onRemoveItem(row)">移除</OLink>
      </template>
    </OTable>
  </div>
</template>

<style lang="scss">
.check-name-result {
  margin: 24px;
  padding: 24px;
  min-height: calc(100vh - var(--layout-header-height) - var(--layout-doc-padding-top) - var(--layout-doc-padding-bottom));
  background-color: var(--o-color-fill2);
  border-radius: var(--o-radius-s);
}

.title {
  margin-bottom: 24px;
  @include h1;
}

.text {
  margin-bottom: 12px;
  @include text1;
}

.full-w {
  width: 100%;
}

.link {
  @include hover {
    text-decoration: underline;
  }
}

.red {
  color: var(--o-color-danger1);
}

.icon-edit {
  margin-left: 4px;
  @include h4;
}

.o-link:not(:last-child) {
  margin-right: 8px;
}
</style>
