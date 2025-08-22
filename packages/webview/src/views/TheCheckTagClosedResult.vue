<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { OTable, OLink, OIcon, OIconRefresh } from '@opensig/opendesign';
import { Bridge, BroadcastBridge, ResourceBridge } from 'webview-bridge';

import { injectData } from '@/utils/inject';

const working = ref(false);

// -------------------- 表格相关 --------------------
const currentScanning = ref('');
const data = ref<Record<string, any>[]>([]);
const columns = [
  { label: '错误信息', key: 'msg', style: 'width:45%' },
  { label: '文件', key: 'file', style: 'width:45%' },
  { label: '操作', key: 'action', style: 'width:10%' },
];

const onAsyncTaskOutput = (name: string, extras: any) => {
  if (name === 'checkTagClosed:stop') {
    working.value = false;
    currentScanning.value = '';
  } else if (name === 'checkTagClosed:scanTarget') {
    working.value = true;
    currentScanning.value = extras;
  } else if (name === 'checkTagClosed:addItem') {
    data.value.push(extras);
  }
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
  data.value = data.value.filter((item) => item.url !== row.url && item.file !== row.file);
};

// -------------------- 开始/停止 --------------------
const onClickStartLink = () => {
  data.value = [];
  Bridge.getInstance().broadcast('asyncTask:checkTagClosed', injectData.extras?.fsPath);
};

const onClickStopLink = () => {
  Bridge.getInstance().broadcast('asyncTask:stopCheckTagClosed');
};
</script>

<template>
  <div class="check-result">
    <h1 class="title">
      检查项：Html 标签闭合
      <OIcon v-if="working" class="o-rotating" title="检查中..."><OIconRefresh /></OIcon>
    </h1>
    <div class="text">【开始路径】：{{ injectData.extras?.fsPath }}</div>
    <div class="text single-line" :title="currentScanning">【正在检查】：{{ working ? currentScanning : '无' }}</div>
    <div class="text single-line">
      <span>【控制开关】：</span>
      <OLink v-if="working" color="danger" @click="onClickStopLink">停止检查</OLink>
      <OLink v-else color="primary" @click="onClickStartLink">开始检查</OLink>
    </div>

    <OTable :columns="columns" :data="data" border="all">
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

.single-line {
  @include text-truncate(1);
}
</style>
