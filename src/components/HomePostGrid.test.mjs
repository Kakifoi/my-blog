import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import { transform } from '@astrojs/compiler';
import { experimental_AstroContainer } from 'astro/container';
import { transform as transformJS } from 'esbuild';
import { parseFragment } from 'parse5';

// Isolated component checks only: no Astro build, content sync, or files emitted.
const source = await readFile(new URL('./HomePostGrid.astro', import.meta.url), 'utf8');
const compiled = await transform(source, {
	filename: 'src/components/HomePostGrid.astro',
	internalURL: import.meta.resolve('astro/compiler-runtime'),
	resultScopedSlot: true,
	scopedStyleStrategy: 'attribute',
});
assert.deepEqual(compiled.diagnostics, []);
const client = await transformJS(compiled.scripts[0].code, { loader: 'ts', target: 'es2022' });
// The installed compiler emits legacy metadata absent from the installed runtime.
// It is unused for this leaf component's container render; strip only that export.
const serverSource = compiled.code
	.replace(/^import ".*\?astro&type=style.*";$/gm, '')
	.replace('export const $$metadata = $$createMetadata', 'const $$metadata = /* @__PURE__ */ $$createMetadata');
const server = await transformJS(serverSource, { loader: 'ts', format: 'esm', treeShaking: true });
const { default: Component } = await import(`data:text/javascript;base64,${Buffer.from(server.code).toString('base64')}`);
const container = await experimental_AstroContainer.create();
const categories = ['グルメ', '子育て・日常', '旅行・おでかけ', 'ガジェット・テクノロジー'];
const posts = (count) => Array.from({ length: count }, (_, index) => ({
	id: `post-${index}`,
	data: {
		title: `記事${index} <script>alert("title")</script>`,
		category: categories[index % categories.length],
		pubDate: new Date(Date.UTC(2026, 9, 17 - index)),
		heroImage: `/images/photo-${index}.jpg`,
		heroImageAlt: `写真${index}`,
	},
}));

// Small DOM adapter around actual rendered HTML, not a copy of the controller.
function createDOM(html) {
	let document;
	const attributeName = (key) => `data-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
	class Node {
		children = [];
		parent = null;
		append(...nodes) {
			for (const node of nodes) {
				if (node instanceof Fragment) { this.append(...node.children.slice()); continue; }
				if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
				node.parent = this;
				this.children.push(node);
			}
		}
		replaceChildren(...nodes) {
			for (const child of this.children) child.parent = null;
			this.children = [];
			this.append(...nodes);
		}
		get firstElementChild() { return this.children.find((node) => node instanceof Element); }
		get textContent() { return this.children.map((node) => node.textContent).join(''); }
		set textContent(value) { this.replaceChildren(new Text(value)); }
		querySelectorAll(selector) {
			return this.children.flatMap((node) => node instanceof Element
				? [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)] : []);
		}
		querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
	}
	class Text extends Node {
		constructor(value) { super(); this.value = value; }
		get textContent() { return this.value; }
		cloneNode() { return new Text(this.value); }
	}
	class Fragment extends Node {
		cloneNode(deep) {
			const clone = new Fragment();
			if (deep) clone.append(...this.children.map((node) => node.cloneNode(true)));
			return clone;
		}
	}
	class Element extends Node {
		attrs = new Map();
		handlers = new Map();
		constructor(tagName) {
			super(); this.tagName = tagName;
			this.dataset = new Proxy({}, {
				get: (_, key) => this.getAttribute(attributeName(key)) ?? undefined,
				set: (_, key, value) => { this.setAttribute(attributeName(key), value); return true; },
			});
		}
		get attributes() { return Array.from(this.attrs, ([name, value]) => ({ name, value })); }
		getAttribute(name) { return this.attrs.get(name) ?? null; }
		setAttribute(name, value) { this.attrs.set(name, String(value)); }
		removeAttribute(name) { this.attrs.delete(name); }
		get hidden() { return this.attrs.has('hidden'); }
		set hidden(value) { value ? this.setAttribute('hidden', '') : this.removeAttribute('hidden'); }
		get disabled() { return this.attrs.has('disabled'); }
		set disabled(value) { value ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
		get id() { return this.getAttribute('id'); }
		get tabIndex() { return Number(this.getAttribute('tabindex')); }
		set tabIndex(value) { this.setAttribute('tabindex', value); }
		matches(selector) {
			const match = selector.match(/^([\w-]+)?(?:\[([\w-]+)(?:="([^"]*)")?\])?$/);
			assert.ok(match, `Adapter selector not supported: ${selector}`);
			return (!match[1] || this.tagName === match[1]) && (!match[2] ||
				(match[3] === undefined ? this.attrs.has(match[2]) : this.getAttribute(match[2]) === match[3]));
		}
		closest(selector) { return this.matches(selector) ? this : this.parent?.closest?.(selector) ?? null; }
		cloneNode(deep) {
			const clone = this instanceof Template ? new Template() : new Element(this.tagName);
			for (const { name, value } of this.attributes) clone.setAttribute(name, value);
			if (deep) clone.append(...this.children.map((node) => node.cloneNode(true)));
			if (deep && this instanceof Template) clone.content = this.content.cloneNode(true);
			return clone;
		}
		addEventListener(type, callback) {
			const handlers = this.handlers.get(type) ?? [];
			handlers.push(callback); this.handlers.set(type, handlers);
		}
		dispatch(type, properties = {}) {
			const event = { target: this, preventDefault() { this.defaultPrevented = true; }, ...properties };
			for (let node = this; node; node = node.parent) for (const callback of node.handlers?.get(type) ?? []) callback(event);
			return event;
		}
		click() { if (!this.disabled) this.dispatch('click'); }
		focus(options) { document.activeElement = this; document.focusOptions = options; }
		scrollIntoView() { document.scrolls.push(this); }
	}
	class Template extends Element { constructor() { super('template'); this.content = new Fragment(); } }
	function convert(node) {
		if (node.nodeName === '#text') return new Text(node.value);
		if (node.nodeName === '#comment') return new Text('');
		const element = node.tagName === 'template' ? new Template() : node.tagName ? new Element(node.tagName) : new Fragment();
		for (const { name, value } of node.attrs ?? []) element.setAttribute(name, value);
		element.append(...(node.childNodes ?? []).map(convert));
		if (node.content) element.content = convert(node.content);
		return element;
	}
	document = convert(parseFragment(html));
	document.scrolls = [];
	document.events = {};
	document.createElement = (tagName) => new Element(tagName);
	document.addEventListener = (name, handler) => { document.events[name] = handler; };
	return { document, Element, HTMLTemplateElement: Template };
}

async function setup(entries, javascript = true) {
	const html = await container.renderToString(Component, { props: { posts: entries } });
	const dom = createDOM(html);
	if (javascript) vm.runInNewContext(client.code, dom, { filename: 'HomePostGrid-client.js' });
	const find = (selector) => dom.document.querySelector(selector);
	return {
		...dom, html, find,
		tabs: dom.document.querySelectorAll('[role="tab"]'),
		grid: find('[data-hpg-grid]'),
		urls: () => find('[data-hpg-grid]').querySelectorAll('a').map((link) => link.getAttribute('href')),
		pages: () => find('[data-hpg-page-numbers]').querySelectorAll('button').map((button) => Number(button.dataset.page)),
	};
}

test('SSR/no-JS: only six latest cards, inert remaining images, one panel, escaped actual data', async () => {
	const entries = posts(73);
	const ui = await setup(entries, false);
	assert.deepEqual(ui.urls(), entries.slice(0, 6).map((post) => `/blog/${post.id}/`));
	assert.equal(ui.grid.querySelectorAll('li').length, 6);
	assert.equal(ui.grid.querySelectorAll('template').length, 67);
	assert.equal(ui.document.querySelectorAll('img').length, 6);
	assert.equal(ui.document.querySelectorAll('[role="tabpanel"]').length, 1);
	assert.equal(ui.find('[data-hpg-tabs]').hidden, true);
	assert.ok(ui.document.querySelectorAll('a').some((link) => link.getAttribute('href') === '/blog/'));
	assert.equal(ui.grid.querySelector('h2').textContent, entries[0].data.title);
	assert.equal(ui.grid.querySelector('script'), null);
	assert.equal(ui.grid.querySelector('time').textContent.trim(), '2026年10月17日');
	for (const image of ui.grid.querySelectorAll('img')) {
		assert.equal(image.getAttribute('loading'), 'lazy');
		assert.equal(image.getAttribute('width'), '1200');
		assert.equal(image.getAttribute('height'), '675');
		assert.notEqual(image.getAttribute('data-list-thumbnail'), null);
	}
});

test('all 73 posts are reachable in exact order, six per page; true final page and scoped clones', async () => {
	const entries = posts(73);
	const ui = await setup(entries);
	assert.deepEqual(ui.pages(), [1, 2, 3, 4, 5, 13]);
	assert.equal(ui.find('[data-hpg-previous]').disabled, true);
	const urls = [];
	for (let page = 1; page <= 13; page++) {
		assert.equal(ui.grid.querySelectorAll('li').length, page === 13 ? 1 : 6);
		assert.equal(ui.grid.querySelectorAll('img').length, page === 13 ? 1 : 6);
		assert.ok(ui.pages().includes(page));
		assert.equal(ui.find('[aria-current="page"]').dataset.page, String(page));
		for (const card of ui.grid.querySelectorAll('li')) assert.ok(card.attributes.some(({ name }) => name.startsWith('data-astro-cid-')));
		urls.push(...ui.urls());
		if (page < 13) ui.find('[data-hpg-next]').click();
	}
	assert.deepEqual(urls, entries.map((post) => `/blog/${post.id}/`));
	assert.equal(ui.find('[data-hpg-next]').disabled, true);
	assert.equal(ui.document.scrolls.length, 12);
	assert.equal(ui.document.activeElement, ui.find('[data-hpg-panel]'));
	ui.find('[data-hpg-previous]').click();
	assert.deepEqual(ui.urls(), entries.slice(66, 72).map((post) => `/blog/${post.id}/`));
});

test('tabs filter real categories, retain independent pages, preserve focus and do not scroll', async () => {
	const entries = posts(73);
	const ui = await setup(entries);
	ui.tabs[1].click();
	assert.deepEqual(ui.pages(), [1, 2, 3, 4]);
	ui.find('[data-page="4"]').click();
	const fourthFoodPage = ui.urls();
	assert.deepEqual(fourthFoodPage, ['/blog/post-72/']);
	const scrolls = ui.document.scrolls.length;
	for (const index of [2, 3, 4, 0, 1]) {
		ui.tabs[index].click();
		assert.equal(ui.document.activeElement, ui.tabs[index]);
		assert.equal(ui.find('[data-hpg-panel]').getAttribute('aria-labelledby'), ui.tabs[index].id);
		assert.equal(ui.tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true').length, 1);
		assert.equal(ui.tabs.filter((tab) => tab.tabIndex === 0).length, 1);
		if (index) for (const card of ui.grid.querySelectorAll('li')) assert.equal(card.dataset.category, categories[index - 1]);
	}
	assert.deepEqual(ui.urls(), fourthFoodPage);
	assert.equal(ui.document.scrolls.length, scrolls);
	assert.equal(ui.document.focusOptions.preventScroll, true);
	ui.document.events['astro:page-load']();
	assert.deepEqual(ui.urls(), fourthFoodPage);
});

test('Left/Right wrap; Home/End activate endpoints with a roving tab stop', async () => {
	const ui = await setup(posts(12));
	for (const [from, key, target] of [[0, 'ArrowLeft', 4], [4, 'ArrowRight', 0], [0, 'End', 4], [4, 'Home', 0], [0, 'ArrowRight', 1]]) {
		assert.equal(ui.tabs[from].dispatch('keydown', { key }).defaultPrevented, true);
		assert.equal(ui.document.activeElement, ui.tabs[target]);
		assert.equal(ui.tabs[target].getAttribute('aria-selected'), 'true');
	}
	assert.equal(ui.document.scrolls.length, 0);
});

test('category tabs retain the original four icons and include real technology posts', async () => {
	const ui = await setup(posts(16));
	assert.equal(ui.tabs.length, 5);
	assert.deepEqual(ui.tabs.map((tab) => tab.textContent.replace(/\s+/g, '')), [
		'最新記事', '🍜グルメ', '🌿子育て・日常', '✈️旅行・おでかけ', '🎧ガジェット・テクノロジー',
	]);
	ui.tabs[4].click();
	assert.equal(ui.grid.querySelectorAll('li').length, 4);
	assert.ok(ui.grid.querySelectorAll('li').every((card) => card.dataset.category === 'ガジェット・テクノロジー'));
});

test('empty, no-hero and single-page categories have honest empty states and no fake pagination', async () => {
	for (const count of [0, 1, 6]) {
		const entries = posts(count).map((post) => ({ ...post, data: { ...post.data, category: 'グルメ', heroImage: undefined } }));
		const ui = await setup(entries);
		assert.equal(ui.find('[data-hpg-pagination]').hidden, true);
		assert.equal(ui.find('[data-hpg-empty]').hidden, count > 0);
		assert.equal(ui.grid.querySelectorAll('img').length, 0);
		ui.tabs[2].click();
		assert.equal(ui.grid.querySelectorAll('li').length, 0);
		assert.equal(ui.find('[data-hpg-pagination]').hidden, true);
		assert.equal(ui.find('[data-hpg-empty]').hidden, false);
		assert.match(ui.find('[data-hpg-status]').textContent, /記事はまだありません/);
	}
});
