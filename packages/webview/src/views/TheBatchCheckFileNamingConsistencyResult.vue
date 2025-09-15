<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { OTable, OLink } from '@opensig/opendesign';

import { injectData } from '@/utils/inject';
import { Bridge, BroadcastBridge, ResourceBridge } from 'webview-bridge';

const working = ref(false);
const currentScanning = ref('');

// -------------------- 表格相关 --------------------
const tableData = ref<Record<string, any>[]>([]);
const columns = [
  { label: '类型', key: 'type', style: 'width:10%' },
  { label: '名称', key: 'name', style: 'width:20%' },
  { label: '路径', key: 'path', style: 'width:20%' },
  { label: '相似名称', key: 'similarName', style: 'width:20%' },
  { label: '相似路径', key: 'similarPath', style: 'width:20%' },
  { label: '操作', key: 'action', style: 'width:10%' },
];

const unmatchedCounts = computed(() => {
  return tableData.value.filter((item) => item.type === '中英文名称不一致').length;
});

const onAsyncTaskOutput = (extras: any[]) => {
  extras.forEach((item) => {
    const { evt, data } = item;
    if (evt === 'stop') {
      working.value = false;
      currentScanning.value = '';
    } else if (evt === 'scanTarget') {
      working.value = true;
      currentScanning.value = data;
    } else if (evt === 'addItem') {
      tableData.value.push(data);
    }
  });
};

onMounted(() => {
  BroadcastBridge.addAsyncTaskOutputListener(onAsyncTaskOutput);
});

onBeforeUnmount(() => {
  BroadcastBridge.removeAsyncTaskOutputListener(onAsyncTaskOutput);
});

// -------------------- 开始/停止 --------------------
const onClickStartLink = () => {
  tableData.value = [];
  Bridge.getInstance().broadcast('start', injectData.extras?.fsPath);
};

const onClickStopLink = () => {
  Bridge.getInstance().broadcast('stop');
};

const onClickSourceLink = (path: string) => {
  ResourceBridge.viewSource(path);
};

const onRemoveItem = (row: Record<string, any>) => {
  tableData.value = tableData.value.filter((item) => item !== row);
};
</script>

<template>
  <div class="check-result">
    <h1 class="title">检查项：中英文文档名称一致性</h1>
    <div class="text">【检查路径】：{{ injectData.extras?.fsPath }}</div>
    <div class="text" :title="currentScanning">【正在检查】：{{ working ? currentScanning : '无' }}</div>
    <div class="text">
      【检查结果】：共检查出 <span class="red">{{ tableData.length }}</span> 项；其中 <span class="red">{{ unmatchedCounts }}</span> 项为中英文文档名称不一致，<span
        class="red"
        >{{ tableData.length - unmatchedCounts }}</span
      >
      项为不存在对应的中文/英文文档
    </div>
    <div class="text">
      <span>【控制开关】：</span>
      <OLink v-if="working" color="danger" @click="onClickStopLink">停止检查</OLink>
      <OLink v-else color="primary" @click="onClickStartLink">开始检查</OLink>
    </div>
    <OTable :columns="columns" :data="tableData" border="all">
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
.check-result {
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
  @include text-truncate(1);
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
