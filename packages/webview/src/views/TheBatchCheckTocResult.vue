<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { OTable, OLink, OIcon, OIconRefresh } from '@opensig/opendesign';
import { Bridge, BroadcastBridge, ResourceBridge } from 'webview-bridge';

import { injectData } from '@/utils/inject';

const working = ref(false);

// -------------------- 表格相关 --------------------
const currentScanning = ref('');
const tableData = ref<Record<string, any>[]>([]);
const columns = [
  { label: '错误信息', key: 'msg', style: 'width:45%' },
  { label: '文件', key: 'file', style: 'width:45%' },
  { label: '操作', key: 'action', style: 'width:10%' },
];

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

const onClickSourceLink = (row: Record<string, any>) => {
  ResourceBridge.viewSource(row.file, row.start, row.end);
};

const onRemoveItem = (row: Record<string, any>) => {
  tableData.value = tableData.value.filter((item) => item !== row);
};

// -------------------- 开始/停止 --------------------
const onClickStartLink = () => {
  tableData.value = [];
  Bridge.getInstance().broadcast('start', injectData.extras?.fsPath);
};

const onClickStopLink = () => {
  Bridge.getInstance().broadcast('stop');
};
</script>

<template>
  <div class="check-result">
    <h1 class="title">
      检查项：Toc
      <OIcon v-if="working" class="o-rotating" title="检查中..."><OIconRefresh /></OIcon>
    </h1>
    <div class="text">【开始路径】：{{ injectData.extras?.fsPath }}</div>
    <div class="text" :title="currentScanning">【正在检查】：{{ working ? currentScanning : '无' }}</div>
    <div class="text">【检查结果】：共检查出 <span class="red">{{ tableData.length }}</span> 个问题</div>
    <div class="text">
      <span>【控制开关】：</span>
      <OLink v-if="working" color="danger" @click="onClickStopLink">停止检查</OLink>
      <OLink v-else color="primary" @click="onClickStartLink">开始检查</OLink>
    </div>

    <OTable :columns="columns" :data="tableData" border="all">
      <template #td_file="{ row }">
        <OLink class="link" color="primary" @click="onClickSourceLink(row)">{{ row.file }}</OLink>
      </template>
      <template #td_action="{ row }">
        <OLink class="link" color="danger" @click="onRemoveItem(row)">移除</OLink>
      </template>
    </OTable>
  </div>
</template>

<style lang="scss">
.check-result {
  position: relative;
  margin: 24px;
  padding: 24px;
  min-height: calc(100vh - var(--layout-header-height) - var(--layout-doc-padding-top) - var(--layout-doc-padding-bottom));
  background-color: var(--o-color-fill2);
  border-radius: var(--o-radius-s);
}

.title {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  @include h1;

  .o-rotating {
    margin-left: 8px;
  }
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

.o-link:not(:last-child) {
  margin-right: 8px;
}
</style>
