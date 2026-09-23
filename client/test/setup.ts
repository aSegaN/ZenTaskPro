import '@testing-library/jest-dom/vitest';

// matchMedia n'existe pas dans jsdom : requis par useTheme
if (!window.matchMedia) {
  (window as any).matchMedia = (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, dispatchEvent() { return false; },
  });
}
