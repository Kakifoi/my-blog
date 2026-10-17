import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../src/components/BaseHead.astro', import.meta.url), 'utf8');
const script = source.match(/<script is:inline id="ga4-production-only">([\s\S]*?)<\/script>/)[1];

function setup(url) {
  const loaded = [];
  const listeners = [];
  const window = { location: new URL(url) };
  const document = {
    getElementById: (id) => loaded.find((element) => element.id === id),
    createElement: (tagName) => ({ tagName }),
    head: { appendChild: (element) => loaded.push(element) },
    addEventListener: (type, listener) => listeners.push({ type, listener }),
  };
  const context = vm.createContext({ window, document, URL });
  function click({ href = '/#recommended-products', classes = [], nested = false, ...properties } = {}) {
    const link = {
      href,
      classList: { contains: (className) => classes.includes(className) },
      closest: (selector) => classes.some((className) => selector.includes(`a.${className}`)) ? link : null,
    };
    const target = nested ? { closest: (selector) => link.closest(selector) } : link;
    const event = {
      target,
      button: 0,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
      ...properties,
    };
    for (const { type, listener } of listeners) {
      if (type === 'click') listener(event);
    }
    return event;
  }
  return { window, loaded, listeners, click, run: () => vm.runInContext(script, context) };
}

test('production initializes the existing GA4 property and loads its library once', () => {
  const page = setup('https://kakifoi.net/blog/example/?utm_source=x');
  page.run();
  page.run();
  assert.equal(page.loaded.length, 1);
  assert.equal(page.loaded[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-DH093PJDW2');
  assert.equal(page.loaded[0].async, true);
  assert.equal(page.listeners.length, 1);
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
    assert.equal(page.listeners.length, 0);
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

test('the article footer CTA records its placement without preventing navigation', () => {
  const page = setup('https://kakifoi.net/blog/example/?utm_source=x');
  page.run();
  const event = page.click({ classes: ['article-footer-cta'], nested: true });
  assert.deepEqual(Array.from(page.window.dataLayer[2]).slice(0, 2), ['event', 'affiliate_guide_click']);
  assert.deepEqual({ ...page.window.dataLayer[2][2] }, {
    placement: 'article_footer',
    destination: 'home_products',
  });
  assert.equal(event.defaultPrevented, false);
});

test('the top intro CTA accepts the same internal target as an absolute URL', () => {
  const page = setup('https://kakifoi.net/');
  page.run();
  page.click({ classes: ['home-products-cta'], href: 'https://kakifoi.net/#recommended-products' });
  assert.deepEqual({ ...page.window.dataLayer[2][2] }, {
    placement: 'top_intro',
    destination: 'home_products',
  });
});

test('ordinary links, affiliate merchant links, and invalid CTA destinations are not sent manually', () => {
  const page = setup('https://kakifoi.net/blog/example/');
  page.run();
  for (const link of [
    { href: '/#recommended-products' },
    { href: 'https://amzn.to/example', classes: ['btn-amazon'] },
    { href: 'https://a.r10.to/example', classes: ['btn-rakuten'] },
    { href: 'https://ck.jp.ap.valuecommerce.com/example', classes: ['btn-yahoo'] },
    { href: 'https://example.com/#recommended-products', classes: ['article-footer-cta'] },
    { href: '/blog/example/#recommended-products', classes: ['article-footer-cta'] },
    { href: '/#another-section', classes: ['article-footer-cta'] },
    { href: '/?email=visitor@example.com#recommended-products', classes: ['home-products-cta'] },
    { href: 'javascript:void(0)', classes: ['article-footer-cta'] },
    { href: 'http://[invalid', classes: ['article-footer-cta'] },
  ]) {
    page.click(link);
  }
  assert.equal(page.window.dataLayer.length, 2);
});

test('modified and keyboard link activation is counted once each and left to the browser', () => {
  const page = setup('https://kakifoi.net/blog/example/');
  page.run();
  for (const activation of [{ ctrlKey: true }, { metaKey: true }, { detail: 0 }]) {
    const event = page.click({ classes: ['article-footer-cta'], ...activation });
    assert.equal(event.defaultPrevented, false);
  }
  assert.equal(page.window.dataLayer.length, 5);
});

test('non-primary or already canceled clicks do not record a CTA event', () => {
  const page = setup('https://kakifoi.net/blog/example/');
  page.run();
  for (const activation of [{ button: 1 }, { button: 2 }, { defaultPrevented: true }]) {
    page.click({ classes: ['article-footer-cta'], ...activation });
  }
  assert.equal(page.window.dataLayer.length, 2);
});

test('running the script twice does not install duplicate CTA listeners', () => {
  const page = setup('https://kakifoi.net/blog/example/');
  page.run();
  page.run();
  page.click({ classes: ['article-footer-cta'] });
  assert.equal(page.listeners.length, 1);
  assert.equal(page.window.dataLayer.length, 3);
});

test('a tracking error never cancels normal link navigation', () => {
  const page = setup('https://kakifoi.net/blog/example/');
  page.run();
  page.window.gtag = () => { throw new Error('tracking unavailable'); };
  let event;
  assert.doesNotThrow(() => { event = page.click({ classes: ['article-footer-cta'] }); });
  assert.equal(event.defaultPrevented, false);
});
