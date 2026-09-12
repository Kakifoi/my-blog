import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../src/components/BaseHead.astro', import.meta.url), 'utf8');
const script = source.match(/<script is:inline id="ga4-production-only">([\s\S]*?)<\/script>/)[1];

function setup(url) {
  const loaded = [];
  const window = { location: new URL(url) };
  const document = {
    getElementById: (id) => loaded.find((element) => element.id === id),
    createElement: (tagName) => ({ tagName }),
    head: { appendChild: (element) => loaded.push(element) },
  };
  const context = vm.createContext({ window, document });
  return { window, loaded, run: () => vm.runInContext(script, context) };
}

test('production initializes the existing GA4 property and loads its library once', () => {
  const page = setup('https://kakifoi.net/blog/example/?utm_source=x');
  page.run();
  page.run();
  assert.equal(page.loaded.length, 1);
  assert.equal(page.loaded[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-DH093PJDW2');
  assert.equal(page.loaded[0].async, true);
  assert.equal(page.window.dataLayer.length, 2);
  assert.equal(page.window.dataLayer[0][0], 'js');
  assert.deepEqual(Array.from(page.window.dataLayer[1]), ['config', 'G-DH093PJDW2']);
  page.window.gtag('event', 'test_local_queue_only');
  assert.equal(page.window.dataLayer[2][0], 'event');
});

for (const url of [
  'http://localhost:4321/',
  'http://127.0.0.1:4322/',
  'http://[::1]:4321/',
  'https://preview.example.pages.dev/',
  'https://my-blog.pages.dev/',
  'https://kakifoi.net.preview.example/',
  'https://kakifoi.net:4321/',
  'http://kakifoi.net/',
]) {
  test(`no GA4 initialization or library request on ${url}`, () => {
    const page = setup(url);
    page.run();
    assert.equal(page.loaded.length, 0);
    assert.equal(page.window.dataLayer, undefined);
    assert.equal(page.window.gtag, undefined);
  });
}

test('an existing dataLayer queue is preserved on production', () => {
  const page = setup('https://kakifoi.net/');
  const queuedEvent = { event: 'existing-event' };
  page.window.dataLayer = [queuedEvent];
  page.run();
  assert.equal(page.window.dataLayer[0], queuedEvent);
  assert.equal(page.window.dataLayer.length, 3);
});
