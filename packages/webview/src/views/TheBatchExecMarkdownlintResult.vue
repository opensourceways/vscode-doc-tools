<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { OTable, OLink, OIcon, OIconRefresh, useMessage } from '@opensig/opendesign';
import { Bridge, BroadcastBridge, ResourceBridge } from 'webview-bridge';

import ConfirmDialog from '@/components/ConfirmDialog.vue';

import { injectData } from '@/utils/inject';

const message = useMessage();
const working = ref(false);
const workingType = ref('检查');
const showConfirmFixDlg = ref(false);

// -------------------- 表格相关 --------------------
const currentScanning = ref('');
const data = ref<Record<string, any>[]>([]);
const columns = [
  { label: '文件', key: 'file', style: 'width:30%' },
  { label: '错误信息', key: 'msgs', style: 'width:60%' },
  { label: '操作', key: 'action', style: 'width:10%' },
];

const onAsyncTaskOutput = (name: string, extras: any) => {
  if (name === 'batchExecMarkdownlint:stop') {
    working.value = false;
    currentScanning.value = '';
  } else if (name === 'batchExecMarkdownlint:scanTarget') {
    working.value = true;
    currentScanning.value = extras;
  } else if (name === 'batchExecMarkdownlint:addItem') {
    data.value.push(extras);
  } else if (name === 'batchExecMarkdownlint:fixItem') {
    if (extras.msgs.length === 0) {
      data.value = data.value.filter((item) => item.file !== extras.file);
      if (extras.tip) {
        message.success({
          content: '修复成功',
        });
      }
    } else {
      const item = data.value.find((item) => item.file === extras.file);
      if (item) {
        item.msgs = extras.msgs;
        if (extras.tip) {
          message.danger({
            content: '存在无法自动修复的错误，请手动修复',
          });
        }
      }
    }
  }
};

onMounted(() => {
  BroadcastBridge.addAsyncTaskOutputListener(onAsyncTaskOutput);
});

onBeforeUnmount(() => {
  BroadcastBridge.removeAsyncTaskOutputListener(onAsyncTaskOutput);
});

const onClickSourceLink = (row: Record<string, any>) => {
  ResourceBridge.viewSource(row.file, row?.start, row?.end);
};

const onRemoveItem = (row: Record<string, any>) => {
  data.value = data.value.filter((item) => item.url !== row.url && item.file !== row.file);
};

// -------------------- 检查 --------------------
const onClickStartCheckLink = () => {
  workingType.value = '检查';
  data.value = [];
  Bridge.getInstance().broadcast('asyncTask:batchExecMarkdownlint', injectData.extras?.fsPath);
};

// -------------------- 修复 --------------------
const onClickBatchFixLink = () => {
  workingType.value = '修复';
  Bridge.getInstance().broadcast(
    'asyncTask:batchFixMarkdownlint',
    data.value.map((item) => item.file)
  );
};

const onClickFixLink = (row: Record<string, any>) => {
  Bridge.getInstance().broadcast('asyncTask:fixMarkdownlint', row.file);
};

// -------------------- 停止 --------------------
const onClickStopLink = () => {
  if (workingType.value === '检查') {
    Bridge.getInstance().broadcast('asyncTask:stopBatchExecMarkdownlint');
  } else {
    Bridge.getInstance().broadcast('asyncTask:stopBatchFixMarkdownlint');
  }
};
</script>

<template>
  <div class="check-result">
    <h1 class="title">
      检查项：Markdownlint
      <OIcon v-if="working" class="o-rotating" :title="`${workingType}中...`"><OIconRefresh /></OIcon>
    </h1>
    <div class="text">【开始路径】：{{ injectData.extras?.fsPath }}</div>
    <div class="text single-line" :title="currentScanning">【正在{{ workingType }}】：{{ working ? currentScanning : '无' }}</div>
    <div class="text single-line">
      <span>【控制开关】：</span>
      <OLink v-if="working" color="danger" @click="onClickStopLink">停止{{ workingType }}</OLink>
      <OLink v-else color="primary" @click="onClickStartCheckLink">开始检查</OLink>
      <OLink v-if="!working && data.length" color="primary" @click="showConfirmFixDlg = true">一键修复</OLink>
    </div>

    <OTable :columns="columns" :data="data" border="all">
      <template #td_file="{ row }">
        <OLink class="link" color="primary" :title="row.file" @click="onClickSourceLink(row)">{{ row.file.split('/').pop() }}</OLink>
      </template>
      <template #td_msgs="{ row }">
        <div v-for="item in row.msgs" :key="`${item.start},${item.end}`">
          <OLink class="link" color="primary" @click="onClickSourceLink(item)">{{ item.msg }}</OLink>
        </div>
      </template>
      <template #td_action="{ row }">
        <div :title="working ? `正在${workingType}中，请勿进行操作` : ''">
          <OLink :disabled="working" color="primary" @click="onClickFixLink(row)">修复</OLink>
          <OLink :disabled="working" color="danger" @click="onRemoveItem(row)">移除</OLink>
        </div>
      </template>
    </OTable>
  </div>

  <ConfirmDialog
    v-model:visible="showConfirmFixDlg"
    title="提示"
    content="并非所有错误都可以自动修复，如遇到无法修复的请手动修复；执行修复前请勿修改文件，否则可能造成修复内容写入到其它位置；请确认是否进行一键修复"
    confirm-text="确认修复"
    @confirm="onClickBatchFixLink"
    @cancel="showConfirmFixDlg = false"
  />
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

.confirm-text {
  height: 200px;
}
</style>
