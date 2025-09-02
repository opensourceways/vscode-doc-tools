<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { OTable, OLink, OInput, OIcon, useMessage } from '@opensig/opendesign';
import { Bridge, BroadcastBridge, ConfigBridge, ResourceBridge } from 'webview-bridge';

import IconEdit from '~icons/app/icon-edit.svg';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

import { injectData } from '@/utils/inject';

const working = ref(false);
const currentScanning = ref('');

// -------------------- 表格相关 --------------------
const data = ref<Record<string, any>[]>([]);
const columns = [
  { label: '类型', key: 'fileType', style: 'width:15%' },
  { label: '名称', key: 'name', style: 'width: 30%' },
  { label: '路径', key: 'path', style: 'width:35%' },
  { label: '操作', key: 'action', style: 'width:20%' },
];

const onAsyncTaskOutput = (name: string, extras: any) => {
  if (name === 'batchCheckFileNaming:stop') {
    working.value = false;
    currentScanning.value = '';
  } else if (name === 'batchCheckFileNaming:scanTarget') {
    working.value = true;
    currentScanning.value = extras;
  } else if (name === 'batchCheckFileNaming:addItem') {
    data.value.push(extras);
  }
};

onMounted(() => {
  BroadcastBridge.addAsyncTaskOutputListener(onAsyncTaskOutput);
});

onBeforeUnmount(() => {
  BroadcastBridge.removeAsyncTaskOutputListener(onAsyncTaskOutput);
});

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

// -------------------- 开始/停止 --------------------
const onClickStartLink = () => {
  data.value = [];
  Bridge.getInstance().broadcast('asyncTask:batchCheckFileNaming', injectData.extras?.fsPath);
};

const onClickStopLink = () => {
  Bridge.getInstance().broadcast('asyncTask:stopBatchCheckFileNaming');
};

// -------------------- 修改名称 --------------------
const message = useMessage();
const showUpdateDlg = ref(false);
const updateName = ref('');
const updateItem = ref<Record<string, any>>();
const disabledUpdate = computed(() => updateName.value.trim() === '');
const onShowUpdateDlg = (row: Record<string, any>) => {
  updateItem.value = row;
  updateName.value = row.name;
  showUpdateDlg.value = true;
};

const onClickFillName = () => {
  updateName.value = updateItem
    .value!.name.replace(/-/g, '_')
    .replace(/([A-Z])/g, (match: string) => `_${match}`)
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

const onUpdateName = async () => {
  if (disabledUpdate.value) {
    return;
  }

  const oldPath = updateItem.value!.path;
  const oldArr = oldPath.split('/');
  oldArr.pop();
  const newPath = `${oldArr.join('/')}/${updateName.value.trim()}`;

  if (await ResourceBridge.renameFilenameOrDirname(oldPath, newPath)) {
    message.success({
      content: '修改成功',
    });

    data.value = data.value.filter((item) => {
      if (updateItem.value!.fileType === '目录' && item.path !== oldPath && item.path.startsWith(oldPath) && item.fileType === '文件') {
        item.path = item.path.replace(oldPath, newPath);
      }

      return item.path !== oldPath;
    });
  } else {
    message.danger({
      content: '修改失败',
    });
  }

  showUpdateDlg.value = false;
};

// -------------------- 忽略名称 --------------------
const showIgnoreDlg = ref(false);
const ignoreItem = ref<Record<string, any>>();
const onShowIgnoreDlg = (row: Record<string, any>) => {
  ignoreItem.value = row;
  showIgnoreDlg.value = true;
};

const onConfirmIgnore = async () => {
  await ConfigBridge.addCheckNameWhiteList(ignoreItem.value!.name);
  data.value = data.value.filter((item) => item.name !== ignoreItem.value!.name);
  showIgnoreDlg.value = false;
};
</script>

<template>
  <div class="check-result">
    <h1 class="title">检查项：目录和文件名称是否符合命名规范</h1>
    <div class="text">【命名规则】：小写字母，下划线连接</div>
    <div class="text">【检查路径】：{{ injectData.extras?.fsPath }}</div>
    <div class="text" :title="currentScanning">【正在检查】：{{ working ? currentScanning : '无' }}</div>
    <div class="text">
      【检查结果】：共检查出 <span class="red">{{ data.length }}</span> 项不符合；其中 <span class="red">{{ fileItemsCounts }}</span> 项为文件，<span
        class="red"
        >{{ dirItemsCounts }}</span
      >
      项为目录
    </div>
    <div class="text">
      <span>【控制开关】：</span>
      <OLink v-if="working" color="danger" @click="onClickStopLink">停止检查</OLink>
      <OLink v-else color="primary" @click="onClickStartLink">开始检查</OLink>
    </div>
    <OTable :columns="columns" :data="data" border="all">
      <template #td_name="{ row }">
        <OLink class="link" color="primary" @click="onClickLink(row)">{{ row.name }}</OLink>
      </template>
      <template #td_action="{ row }">
        <OLink color="primary" @click="onShowUpdateDlg(row)">修改</OLink>
        <OLink color="danger" @click="onShowIgnoreDlg(row)">忽略</OLink>
      </template>
    </OTable>
  </div>

  <ConfirmDialog
    v-model:visible="showUpdateDlg"
    title="修改名称"
    confirm-text="确认修改"
    :disable-confirm="disabledUpdate"
    @confirm="onUpdateName"
    @cancel="showUpdateDlg = false"
  >
    <template #content>
      <OInput v-model="updateName" class="full-w" placeholder="请输入名称" size="large">
        <template #append>
          <OLink class="link" @click="">
            <template #icon>
              <OIcon class="icon-edit" title="填充转换名称" @click="onClickFillName">
                <IconEdit />
              </OIcon>
            </template>
          </OLink>
        </template>
      </OInput>
    </template>
  </ConfirmDialog>

  <ConfirmDialog
    v-model:visible="showIgnoreDlg"
    title="确认忽略"
    :content="`确认要忽略 ${ignoreItem?.name} 吗？忽略之后的检查将会跳过与其名称相同的文件/目录名字的检查`"
    confirm-text="确认忽略"
    @confirm="onConfirmIgnore"
    @cancel="showIgnoreDlg = false"
  />
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
  margin-left: 6px;
  margin-right: 4px;
  font-size: 18px;
}

.o-link:not(:last-child) {
  margin-right: 8px;
}
</style>
