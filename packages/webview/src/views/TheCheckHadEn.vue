<script setup lang="ts">
import { computed, ref } from 'vue';
import { isArray, OTable, OLink } from '@opensig/opendesign';


import { injectData } from '@/utils/inject';
import { ResourceBridge } from 'webview-bridge';

// -------------------- 表格相关 --------------------
const columns = [
  { label: '类型', key: 'fileType', style: 'width:15%' },
  { label: '名称', key: 'name', style: 'width: 30%' },
  { label: '路径', key: 'path', style: 'width:35%' },
  { label: '操作', key: 'action', style: 'width:20%' },
];

const data = ref<Record<string, any>[]>([]);
if (isArray(injectData.extras?.results)) {
  injectData.extras.results.sort((a, b) => {
    return (a.extras === 'file' ? 0 : 1) - (b.extras === 'file' ? 0 : 1);
  });

  data.value = injectData.extras.results.map((item) => {
    return {
      fileType: item.extras === 'directory' ? '目录' : '文件',
      name: item.content.split('/').pop(),
      path: item.content,
    };
  });
}

const fileItemsCounts = computed(() => {
  return data.value.filter((item) => item.fileType === '文件').length;
});

const dirItemsCounts = computed(() => {
  return data.value.filter((item) => item.fileType === '目录').length;
});

const onClickLink = (row: Record<string, any>) => {
  if (row.fileType === '文件') {
    ResourceBridge.viewSource(row.path);
  } else {
    ResourceBridge.revealInExplorer(row.path);
  }
};

</script>

<template>
  <div class="check-name-result">
    <h1 class="title">检查项：目录、文件是否符合命名规范</h1>
    <div class="text">【命名规则】：小写字母，下划线连接</div>
    <div class="text">【检查路径】：{{ injectData.extras?.fsPath }}</div>
    <div class="text">
      【检查结果】：共检查出 <span class="red">{{ data.length }}</span> 项不符合；其中 <span class="red">{{ fileItemsCounts }}</span> 项为文件，<span
        class="red"
        >{{ dirItemsCounts }}</span
      >
      项为目录
    </div>
    <OTable class="file-tree-body" :columns="columns" :data="data" border="all">
      <template #td_name="{ row }">
        <OLink class="link" color="primary" @click="onClickLink(row)">{{ row.name }}</OLink>
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
