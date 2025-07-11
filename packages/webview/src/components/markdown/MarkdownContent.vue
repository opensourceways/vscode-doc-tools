<script lang="ts" setup>
import { ref, watch, h } from 'vue';
import MarkdownTitle from '@/components/markdown/MarkdownTitle.vue';
import MarkdownImage from '@/components/markdown/MarkdownImage.vue';

const props = defineProps({
  // html 内容
  html: {
    type: String,
    default: '',
  },
});

const renderFn = ref<any>(null);
watch(() => props.html, async () => {
  renderFn.value = (() => h({
    template: props.html,
    components: {
      MarkdownTitle,
      MarkdownImage,
    }
  }));
});

</script>

<template>
  <div class="markdown-body">
    <component v-if="renderFn" :is="{ render: renderFn }" />
  </div>
</template>

<style lang="scss"></style>