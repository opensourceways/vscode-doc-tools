import { createRouter, createMemoryHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'temp',
    component: () => {
      return import('@/views/TheTemp.vue')
    },
  },
  {
    path: '/markdown',
    name: 'markdown',
    component: () => {
      return import('@/views/TheMarkdown.vue')
    },
  },
  {
    path: '/batch-markdownlint-result',
    name: 'batch-markdownlint-result',
    component: () => {
      return import('@/views/TheBatchMarkdownlintResult.vue')
    },
  },
  {
    path: '/batch-check-file-naming-result',
    name: 'batch-check-file-naming-result',
    component: () => {
      return import('@/views/TheBatchCheckFileNamingResult.vue')
    },
  },
  {
    path: '/batch-check-file-naming-consistency-result',
    name: 'batch-check-file-naming-consistency-result',
    component: () => {
      return import('@/views/TheBatchCheckFileNamingConsistencyResult.vue')
    },
  },
  {
    path: '/batch-check-link-accessibility-result',
    name: 'batch-check-link-accessibility-result',
    component: () => {
      return import('@/views/TheBatchCheckLinkAccessibilityResult.vue')
    },
  },
  {
    path: '/batch-check-toc-reuslt',
    name: 'batch-check-toc-reuslt',
    component: () => {
      return import('@/views/TheBatchCheckTocResult.vue')
    },
  },
  {
    path: '/batch-check-tag-closed-result',
    name: 'batch-check-tag-closed-result',
    component: () => {
      return import('@/views/TheBatchCheckTagClosedResult.vue')
    },
  },
]

export default createRouter({
  history: createMemoryHistory(import.meta.env.BASE_URL),
  routes,
})