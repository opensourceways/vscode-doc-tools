import { createApp } from 'vue';

import '@/assets/style/base.scss';
import '@opensig/opendesign/es/index.scss';
import '@/assets/style/theme/default-light.token.css';
import '@/assets/style/theme/dark.token.css';
import '@/assets/style/markdown.scss';
import '@/assets/style/theme/index.scss';
import '@/assets/style/global.scss';

import App from './App.vue';
import router from './router';
import i18n from './i18n';

const app = createApp(App);
app.use(i18n)
app.use(router);
app.mount('#app');
