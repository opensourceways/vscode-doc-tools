import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import '@/assets/style/base.scss';
import '@opensig/opendesign/es/index.scss';
import '@/assets/style/theme/default-light.token.css';
import '@/assets/style/theme/dark.token.css';
import '@/assets/style/markdown.scss';
import '@/assets/style/theme/index.scss';
import '@/assets/style/global.scss';

const app = createApp(App);
app.use(router);
app.mount('#app');
