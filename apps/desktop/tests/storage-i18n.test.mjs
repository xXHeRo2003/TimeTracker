import test from 'node:test';
import assert from 'node:assert/strict';

const createLocalStorageStub = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(String(key), String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    }
  };
};

const localStorageStub = createLocalStorageStub();
globalThis.localStorage = localStorageStub;
Object.defineProperty(globalThis, 'navigator', {
  value: { language: 'en-US' },
  configurable: true
});

const originalWarn = console.warn;
console.warn = () => {};

const storageModule = await import('../src/renderer/scripts/services/storage.js');
const i18nModule = await import('../src/renderer/scripts/core/i18n.js');

test.after(() => {
  console.warn = originalWarn;
});

test('loadHistory handles missing and malformed data gracefully', () => {
  localStorageStub.clear();
  assert.deepEqual(storageModule.loadHistory(), []);

  localStorageStub.setItem('flowtime-history', 'not json');
  assert.deepEqual(storageModule.loadHistory(), []);
});

test('saveHistory persists entries via localStorage', () => {
  localStorageStub.clear();
  const entries = [{ id: '1', taskName: 'Task', trackedMs: 1000, completedAt: new Date().toISOString() }];
  storageModule.saveHistory(entries);

  const stored = JSON.parse(localStorageStub.getItem('flowtime-history'));
  assert.equal(stored.length, 1);
  assert.equal(stored[0].taskName, 'Task');
});

test('i18n setLanguage updates current language and persists value', () => {
  localStorageStub.clear();

  const before = i18nModule.getLanguage();
  assert.equal(before, 'en');

  const next = i18nModule.setLanguage('de');
  assert.equal(next, 'de');
  assert.equal(i18nModule.getLanguage(), 'de');

  assert.equal(localStorageStub.getItem('flowtime-language'), 'de');

  i18nModule.setLanguage('es'); // fallback
  assert.equal(i18nModule.getLanguage(), 'de', 'unsupported languages should not change setting');

  i18nModule.setLanguage('en');
  assert.equal(i18nModule.getLanguage(), 'en');
});
