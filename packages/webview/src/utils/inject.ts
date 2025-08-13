export const injectData = (() => {
  let injectData = {};
  try {
    const str = import.meta.env.MODE === 'development' ? new URLSearchParams(new URL(window.location.href).search).get('injectData')! : window.__injectData;
    injectData = JSON.parse(str);
  } catch (err) {
    // nothing
  }

  return injectData as {
    path: string;
    theme: 'dark' | 'light';
    locale: string;
    query: Record<string, any>;
    extras?: Record<string, any>;
  };
})();
