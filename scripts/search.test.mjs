import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeAffiliateSearch from './rehype-affiliate-search.mjs';

test('common footer text stays visible; genuine article text and links stay searchable', async () => {
	const source = await readFile(new URL('../src/content/blog/rakuten-black-card-cancel.md', import.meta.url), 'utf8');
	const footer = source.split('\n').find((line) => line.startsWith('このブログの商品リンク'));
	const baseline = await createMarkdownProcessor();
	const filtered = await createMarkdownProcessor({ rehypePlugins: [rehypeAffiliateSearch] });
	for (const variant of [footer, footer.replace('そのままAmazon', 'そのまま Amazon').replace('OK', ' OK '), footer.replace('リンク先の商品', '先の商品')]) {
		const input = `楽天ブラックカードを解約した理由です。\n\n[楽天の商品を見る](https://example.com/product)\n\n---\n\n${variant}`;
		const original = (await baseline.render(input)).code;
		const result = (await filtered.render(input)).code;
		assert.equal(result.replace(' data-pagefind-ignore=""', ''), original);
		assert.equal((result.match(/data-pagefind-ignore/g) ?? []).length, 1);
		assert.match(result, /<p>楽天ブラックカード/);
		assert.match(result, /<p><a href="https:\/\/example.com\/product">/);
	}
	const extraText = (await filtered.render(`${footer}\n楽天で注文した商品のレビューです。`)).code;
	assert.doesNotMatch(extraText, /data-pagefind-ignore/);
});

const source = await readFile(new URL('../src/pages/search.astro', import.meta.url), 'utf8');
const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];

test('Japanese split queries recover original words but reject unrelated single-character matches', async () => {
	const candidates = [
		{ id: 'rakuten', score: 8, data: async () => ({ content: '楽\u200b天カードの紹介' }) },
		{ id: 'unrelated', score: 9, data: async () => ({ content: '楽しい旅行で天ぷらを食べた' }) },
		{ id: 'nightreign', score: 8, data: async () => ({ content: 'ナイト\u200bレインの攻略' }) },
	];
	const fakePagefind = { search: async (query) => ({ results: query.includes(' ') ? candidates : [] }) };
	const context = vm.createContext({ fakePagefind });
	vm.runInContext(`${script.slice(0, script.indexOf("const input = document"))}\ninitPagefind = async () => fakePagefind;`, context);
	assert.deepEqual(Array.from(await vm.runInContext("smartSearch('楽天')", context), (r) => r.id), ['rakuten']);
	assert.deepEqual(Array.from(await vm.runInContext("smartSearch('ナイトレイン')", context), (r) => r.id), ['nightreign']);
});

test('direct search rejects single-letter matches and respects all words, width and case', async () => {
	const fakePagefind = { search: async () => ({ results: [
		{ id: 'z', score: 10, data: async () => ({ content: 'ポケモン Z-A を遊んだ' }) },
		{ id: 'review', score: 9, data: async () => ({ content: 'ｉＰｈｏｎｅ のレビュー' }) },
		{ id: 'other', score: 8, data: async () => ({ content: 'iPhone の修理' }) },
	] }) };
	const context = vm.createContext({ fakePagefind });
	vm.runInContext(`${script.slice(0, script.indexOf("const input = document"))}\ninitPagefind = async () => fakePagefind;`, context);
	assert.equal((await vm.runInContext("smartSearch('zzzxxyyqqnoresults')", context)).length, 0);
	assert.deepEqual(Array.from(await vm.runInContext("smartSearch('iphone レビュー')", context), (r) => r.id), ['review']);
});
const deferred = () => {
	let resolve, reject;
	const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
	return { promise, resolve, reject };
};
const results = (count, prefix = 'article') => Array.from({ length: count }, (_, i) => ({
	id: `${prefix}-${i}`, score: count - i,
	data: async () => ({ url: `/blog/${prefix}-${i}/`, meta: { title: `${prefix} ${i}` }, excerpt: '本文' }),
}));

// Run the actual page controller with a small DOM adapter and a controllable search transport.
function setup(search) {
	let focused;
	class Element {
		children = []; attributes = {}; handlers = {}; hidden = false; disabled = false; textContent = ''; value = '';
		append(...children) { this.children.push(...children); }
		replaceChildren(...children) { this.children = children; }
		setAttribute(name, value) { this.attributes[name] = value; }
		addEventListener(name, callback) { this.handlers[name] = callback; }
		focus() { focused = this; }
	}
	const elements = Object.fromEntries(['search-input', 'search-status', 'search-results', 'search-more'].map((id) => [id, new Element()]));
	let timer;
	const context = vm.createContext({
		document: { getElementById: (id) => elements[id], createElement: () => new Element() },
		window: { addEventListener() {} },
		setTimeout: (fn) => { timer = fn; }, clearTimeout: () => { timer = undefined; },
		searchTransport: search,
	});
	vm.runInContext(`${script}\nsmartSearch = searchTransport;`, context);
	return {
		input: elements['search-input'], status: elements['search-status'], list: elements['search-results'], more: elements['search-more'],
		type(query) { this.input.value = query; this.input.handlers.input(); },
		flush() { const run = timer; timer = undefined; return run?.(); },
		async query(query) { this.type(query); await this.flush(); },
		loadMore() { return this.more.handlers.click(); },
		get focused() { return focused; },
	};
}

test('all 65 results are reachable in order without duplicates; new result receives focus', async () => {
	const ui = setup(async () => results(65));
	await ui.query('記事');
	assert.equal(ui.list.children.length, 30);
	assert.equal(ui.status.textContent, '65件中30件を表示しています');
	assert.equal(ui.more.hidden, false);
	await ui.loadMore();
	assert.equal(ui.list.children.length, 60);
	assert.equal(ui.focused.href, '/blog/article-30/');
	await ui.loadMore();
	const urls = ui.list.children.map((li) => li.children[0].children[0].href);
	assert.deepEqual(urls, results(65).map((_, i) => `/blog/article-${i}/`));
	assert.equal(ui.more.hidden, true);
	assert.equal(ui.status.textContent, '65件中65件を表示しています');
	ui.type('');
	assert.equal(ui.list.children.length, 0);
	assert.equal(ui.status.hidden, true);
	assert.equal(ui.more.hidden, true);
});

test('a pending old search is discarded immediately when input changes', async () => {
	const old = deferred();
	const ui = setup((query) => query === 'old' ? old.promise : Promise.resolve(results(1, 'new')));
	ui.type('old');
	const pending = ui.flush();
	ui.type('new');
	old.resolve(results(65));
	await pending;
	assert.equal(ui.list.children.length, 0);
	await ui.flush();
	assert.equal(ui.list.children.length, 1);
	assert.equal(ui.status.textContent, '1件中1件を表示しています');
});

test('double clicks cannot duplicate a batch; changing query cancels pending pagination', async () => {
	const batch = deferred();
	const matches = results(31);
	matches[30].data = () => batch.promise;
	const ui = setup(async () => matches);
	await ui.query('記事');
	const pending = ui.loadMore();
	assert.equal(ui.more.disabled, true);
	await ui.loadMore();
	assert.equal(ui.list.children.length, 30);
	ui.type('');
	batch.resolve({ url: '/old/', meta: {}, excerpt: '古い結果' });
	await pending;
	assert.equal(ui.list.children.length, 0);
	assert.equal(ui.more.hidden, true);
	assert.equal(ui.list.attributes['aria-busy'], 'false');
});

test('a failed batch can be retried without skipping articles', async () => {
	const matches = results(31);
	let fail = true;
	const original = matches[30].data;
	matches[30].data = async () => { if (fail) throw new Error('network'); return original(); };
	const ui = setup(async () => matches);
	await ui.query('記事');
	await ui.loadMore();
	assert.equal(ui.list.children.length, 30);
	assert.match(ui.status.textContent, /再試行/);
	assert.equal(ui.more.disabled, false);
	fail = false;
	await ui.loadMore();
	assert.equal(ui.list.children.length, 31);
	assert.equal(ui.more.hidden, true);
});

test('empty results and a search failure do not leave the page loading', async () => {
	const ui = setup(async (query) => { if (query === 'error') throw new Error('network'); return []; });
	await ui.query('見つからない');
	assert.match(ui.status.textContent, /ありませんでした/);
	assert.equal(ui.more.hidden, true);
	await ui.query('error');
	assert.match(ui.status.textContent, /検索できませんでした/);
	assert.equal(ui.list.attributes['aria-busy'], 'false');
});
