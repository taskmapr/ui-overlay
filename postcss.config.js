const enablePrefixing =
  process.env.NODE_ENV === 'production' ||
  process.env.TM_FORCE_PREFIX === 'true';

const plugins = {
  tailwindcss: {},
  autoprefixer: {},
};

if (enablePrefixing) {
  plugins['postcss-prefix-selector'] = {
    prefix: '.tm-overlay-root',
    transform(prefix, selector, prefixedSelector) {
      const globalPatterns = ['.ui-highlighted'];
      if (globalPatterns.some((pattern) => selector.includes(pattern))) {
        return selector;
      }
      if (
        selector.startsWith(prefix) ||
        selector.startsWith(':root') ||
        selector.startsWith('html') ||
        selector.startsWith('body')
      ) {
        return selector;
      }
      return prefixedSelector;
    },
  };
}

export default {
  plugins,
};
