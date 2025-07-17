import { createRouter, createWebHistory } from 'vue-router';

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
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})