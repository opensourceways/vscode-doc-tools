<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { OTable, OLink, OIcon, OIconRefresh, ODialog, OButton, OCheckboxGroup, OCheckbox } from '@opensig/opendesign';
import { Bridge, BroadcastBridge, ConfigBridge, ResourceBridge } from 'webview-bridge';

import { injectData } from '@/utils/inject';

const working = ref(false);
const workingLink = ref(['http', 'relative-link', 'anchor']);
const workingStatus = ref(['404']);

// -------------------- 表格相关 --------------------
const currentScanning = ref('');
const data = ref<Record<string, any>[]>([]);
const columns = [
  { label: '地址', key: 'url', style: 'width:30%' },
  { label: '错误信息', key: 'msg', style: 'width:30%' },
  { label: '文件', key: 'file', style: 'width:30%' },
  { label: '操作', key: 'action', style: 'width:10%' },
];

const onAsyncTaskOutput = (name: string, extras: any) => {
  if (name === 'checkLinkAccessibility:stop') {
    working.value = false;
    currentScanning.value = '';
  } else if (name === 'checkLinkAccessibility:scanTarget') {
    working.value = true;
    currentScanning.value = extras;
  } else if (name === 'checkLinkAccessibility:addItem') {
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

// -------------------- 添加白名单 --------------------
const showIgnoreDlg = ref(false);
const ignoreItem = ref<Record<string, any>>();
const onShowIgnoreDlg = (row: Record<string, any>) => {
  ignoreItem.value = row;
  showIgnoreDlg.value = true;
};

const onConfirmIgnore = async () => {
  await ConfigBridge.addUrlWhiteList(ignoreItem.value!.url);
  data.value = data.value.filter((item) => item.url !== ignoreItem.value!.url);
  showIgnoreDlg.value = false;
};

// -------------------- 开始/停止 --------------------
const onClickStartLink = () => {
  data.value = [];
  Bridge.getInstance().broadcast(
    'asyncTask:checkLinkAccessibility',
    injectData.extras?.fsPath,
    [...workingLink.value], // 得copy一下，不然postMessage的时候会提示无法clone
    [...workingStatus.value]
  );
};

const onClickStopLink = () => {
  Bridge.getInstance().broadcast('asyncTask:stopCheckLinkAccessibility');
};
</script>

<template>
  <div class="check-result">
    <h1 class="title">
      检查项：链接可访问性
      <OIcon v-if="working" class="o-rotating" title="检查中..."><OIconRefresh /></OIcon>
    </h1>

    <div class="text">【开始路径】：{{ injectData.extras?.fsPath }}</div>
    <div class="text single-line" :title="currentScanning">【正在检查】：{{ working ? currentScanning : '无' }}</div>
    <div class="text single-line">
      <span>【链接类型】：</span>
      <OCheckboxGroup v-model="workingLink" :disabled="working">
        <OCheckbox value="http">http(s)链接</OCheckbox>
        <OCheckbox value="relative-link">相对路径链接</OCheckbox>
        <OCheckbox value="anchor">链接锚点</OCheckbox>
      </OCheckboxGroup>
    </div>
    <div class="text single-line">
      <span>【检查状态】：</span>
      <OCheckboxGroup v-model="workingStatus" :disabled="working">
        <OCheckbox value="404">无法访问</OCheckbox>
        <OCheckbox value="others">访问超时等其它错误</OCheckbox>
      </OCheckboxGroup>
    </div>
    <div class="text single-line">
      <span>【控制开关】：</span>
      <OLink v-if="working" color="danger" @click="onClickStopLink">停止检查</OLink>
      <OLink v-else color="primary" @click="onClickStartLink">开始检查</OLink>
    </div>

    <OTable :columns="columns" :data="data" border="all">
      <template #td_url="{ row }">
        <OLink class="link" color="primary" :href="row.url.startsWith('http') ? row.url : undefined" target="_blank">{{ row.url }}</OLink>
      </template>
      <template #td_file="{ row }">
        <OLink class="link" color="primary" @click="onClickSourceLink(row)">{{ row.file }}</OLink>
      </template>
      <template #td_action="{ row }">
        <OLink v-if="row.url.startsWith('http')" class="link" color="primary" @click="onShowIgnoreDlg(row)">添加白名单</OLink>
        <OLink class="link" color="danger" @click="onRemoveItem(row)">移除</OLink>
      </template>
    </OTable>
  </div>

  <ODialog v-model:visible="showIgnoreDlg" size="small">
    <template #header>确认添加</template>
    <div class="dlg-body">确认要添加白名单吗？添加后，之后的所有检查将跳过此链接</div>
    <template #footer>
      <div class="button-box">
        <OButton variant="solid" color="primary" size="large" @click="onConfirmIgnore">确认忽略</OButton>
        <OButton variant="outline" color="primary" size="large" @click="showIgnoreDlg = false">取消</OButton>
      </div>
    </template>
  </ODialog>
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

.icon-edit {
  margin-left: 4px;
  @include h4;
}

.o-link:not(:last-child) {
  margin-right: 8px;
}

.single-line {
  @include text-truncate(1);
}
</style>
