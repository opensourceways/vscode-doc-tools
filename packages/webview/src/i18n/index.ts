import { createI18n } from 'vue-i18n';

import { injectData } from '@/utils/inject';

// 公共
import common from './common';
import docs from './docs';

const messages = {
  zh: {
    // 公共
    common: common.zh,
    // 业务
    docs: docs.zh,
  },
  en: {
    // 公共
    common: common.en,
    // 业务
    docs: docs.en,
  },
};

const i18n = createI18n({
  globalInjection: true,
  locale: injectData?.locale || 'zh',
  legacy: false,
  fallbackLocale: 'zh',
  messages,
});

export default i18n;
