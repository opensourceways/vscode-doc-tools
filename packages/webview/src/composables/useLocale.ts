import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

export const useLocale = () => {
  const { t, locale } = useI18n();

  const isZh = computed(() => locale.value === 'zh');
  const isEn = computed(() => locale.value === 'en');

  return {
    t,
    locale,
    isZh,
    isEn,
  };
};
