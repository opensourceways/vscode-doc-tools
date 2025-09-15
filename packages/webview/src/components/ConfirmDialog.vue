<script setup lang="ts">
import { ODialog, OButton } from '@opensig/opendesign';
import { useVModel } from '@vueuse/core';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
  disableConfirm: {
    type: Boolean,
    default: false,
  },
  disableCancel: {
    type: Boolean,
    default: false,
  },
  confirmText: {
    type: String,
    default: '确认',
  },
  cancelText: {
    type: String,
    default: '取消',
  },
});

const emits = defineEmits<{
  (evt: 'update:visible', val: boolean): void;
  (evt: 'confirm'): void;
  (evt: 'cancel'): void;
}>();

const visible = useVModel(props, 'visible', emits);

const onConfirm = () => {
  emits('confirm');
  visible.value = false;
};

const onCancel = () => {
  emits('cancel');
  visible.value = false;
};
</script>

<template>
  <ODialog
    v-model:visible="visible"
    main-class="confirm-dialog"
    size="small"
    :style="{
      '--dlg-width': '450px',
      '--dlg-head-padding': '32px 32px 0',
      '--dlg-body-padding': '32px',
      '--dlg-foot-padding': '0 32px 32px',
      '--dlg-padding-body-top': '16px',
      '--dlg-padding-body-bottom': '24px',
      '--dlg-close-size': '24px',
    }"
  >
    <template #header>
      <slot name="title">
        <div class="dlg-title">{{ title }}</div>
      </slot>
    </template>
    <slot name="content">
      <div class="dlg-body">{{ content }}</div>
    </slot>
    <template #footer>
      <slot name="footer">
        <div class="button-box">
          <OButton variant="solid" color="primary" size="large" :disabled="disableConfirm" @click="onConfirm">{{ confirmText }}</OButton>
          <OButton variant="outline" color="primary" size="large" :disabled="disableCancel" @click="onCancel">{{ cancelText }}</OButton>
        </div>
      </slot>
    </template>
  </ODialog>
</template>

<style lang="scss" scoped>
.confirm-dialog {
  .dlg-title {
    font-size: 24px;
  }

  .dlg-body {
    font-size: 16px;
  }

  .o-btn {
    min-width: 112px;
    font-size: 16px;
    line-height: 24px;
  }
}
</style>
