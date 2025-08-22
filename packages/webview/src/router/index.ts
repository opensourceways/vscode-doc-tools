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
    path: '/check-name-result',
    name: 'check-name-result',
    component: () => {
      return import('@/views/TheCheckNameResult.vue')
    },
  },
  {
    path: '/check-name-consistency-result',
    name: 'check-name-consistency-result',
    component: () => {
      return import('@/views/TheCheckNameConsistencyResult.vue')
    },
  },
  {
    path: '/check-link-accessibility',
    name: 'check-link-accessibility',
    component: () => {
      return import('@/views/TheCheckLinkAccessibility.vue')
    },
  },
  {
    path: '/check-toc',
    name: 'check-toc',
    component: () => {
      return import('@/views/TheCheckToc.vue')
    },
  },
]

export default createRouter({
  history: createMemoryHistory(import.meta.env.BASE_URL),
  routes,
})