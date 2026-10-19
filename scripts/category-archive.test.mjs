import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parse } from 'parse5';
import { ARCHIVE_CATEGORIES, ARCHIVE_PAGE_SIZE, archivePageNumbers, archivePageUrl } from '../src/utils/archivePagination.mjs';

// Run after the main agent's single production build; this script never builds.
const targetCategories = ['子育て・日常', '旅行・おでかけ'];
const categories = ['グルメ', '旅行・おでかけ', '子育て・日常', 'ゲーム・エンタメ', 'ガジェット・テクノロジー', 'お金・投資', '健康・ランニング'];
const site = 'https://kakifoi.net';
const sourceRoot = new URL('../src/content/blog/', import.meta.url);
const files = (await readdir(sourceRoot, { recursive: true })).filter((file) => /\.mdx?$/.test(file));
const allPosts = (await Promise.all(files.map(async (file) => {
	const { frontmatter } = parseFrontmatter(await readFile(new URL(file, sourceRoot), 'utf8'));
	const date = new Date(frontmatter.pubDate).valueOf();
	assert.ok(Number.isFinite(date), `Invalid publication date: ${file}`);
	return { ...frontmatter, date, url: `/blog/${file.replace(/\.mdx?$/, '')}/` };
}))).sort((a, b) => b.date - a.date);
const postsByUrl = new Map(allPosts.map((post) => [post.url, post]));
const categoryPosts = (category) => allPosts.filter((post) => post.category === category);
const pageCount = (category) => Math.max(1, Math.ceil(categoryPosts(category).length / ARCHIVE_PAGE_SIZE));

function walk(node, predicate) {
	return [...(predicate(node) ? [node] : []), ...(node.childNodes ?? []).flatMap((child) => walk(child, predicate))];
}
const attr = (node, name) => node.attrs?.find((attribute) => attribute.name === name)?.value;
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
const byClass = (node, name) => walk(node, (child) => (attr(child, 'class') ?? '').split(/\s+/).includes(name));
const elements = (node, tag) => walk(node, (child) => child.tagName === tag);
const pathname = (href) => new URL(href, site).pathname;
const rootUrl = (category) => `/categories/${encodeURIComponent(category)}/`;
const pageCache = new Map();

async function readPage(url) {
	if (!pageCache.has(url)) {
		pageCache.set(url, readFile(new URL(`../dist${url}index.html`, import.meta.url), 'utf8').then(parse));
	}
	return pageCache.get(url);
}

function one(nodes, message) {
	assert.equal(nodes.length, 1, message);
	return nodes[0];
}

function checkCanonical(dom, url) {
	const canonical = one(walk(dom, (node) => node.tagName === 'link' && attr(node, 'rel') === 'canonical'), 'one canonical per page');
	assert.equal(attr(canonical, 'href'), `${site}${url}`);
}

function checkCompleteNewestFirst(urls, expected) {
	assert.equal(urls.length, expected.length);
	assert.equal(new Set(urls).size, expected.length, 'no duplicate posts');
	assert.deepEqual([...urls].sort(), expected.map((post) => post.url).sort());
	const dates = urls.map((url) => postsByUrl.get(url).date);
	assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
}

function checkSharedChrome(dom) {
	one(byClass(dom, 'home-header'), 'shared homepage header');
	one(walk(dom, (node) => node.tagName === 'button' && attr(node, 'aria-controls') === 'home-navigation'), 'one mobile menu');
	const sidebar = one(walk(dom, (node) => node.tagName === 'aside' && attr(node, 'aria-label') === 'プロフィールと記事を探す'), 'shared sidebar');
	const categoryList = one(byClass(sidebar, 'category-list'));
	const links = elements(categoryList, 'a');
	assert.equal(links.length, categories.length);
	for (const category of categories) {
		const link = one(links.filter((node) => pathname(attr(node, 'href')) === rootUrl(category)));
		assert.equal(text(one(byClass(link, 'category-count'))), String(categoryPosts(category).length), 'sidebar counts use ALL site posts');
	}
	const recent = one(byClass(sidebar, 'recent-posts'));
	const recentUrls = elements(recent, 'a').map((node) => attr(node, 'href'));
	assert.equal(recentUrls.length, Math.min(5, allPosts.length));
	assert.deepEqual(recentUrls.map((url) => postsByUrl.get(url).date), allPosts.slice(0, 5).map((post) => post.date), 'recent posts are site-wide and newest-first');
}

test('category URLs encode the category and keep page 1 at the existing category root', () => {
	assert.equal(ARCHIVE_PAGE_SIZE, 12);
	assert.deepEqual([...ARCHIVE_CATEGORIES].sort(), [...targetCategories].sort());
	for (const category of targetCategories) {
		assert.equal(archivePageUrl(1, category), rootUrl(category));
		assert.equal(archivePageUrl(2, category), `${rootUrl(category)}page/2/`);
	}
	assert.equal(archivePageUrl(1), '/blog/');
	assert.equal(archivePageUrl(2), '/blog/page/2/');
});

for (const category of targetCategories) {
	test(`built ${category}: all matching posts exactly once, 12 per page, newest-first`, async () => {
		const expected = categoryPosts(category);
		const urls = [];
		for (let page = 1; page <= pageCount(category); page++) {
			const dom = await readPage(archivePageUrl(page, category));
			const grid = one(walk(dom, (node) => attr(node, 'data-archive-grid') !== undefined));
			const cards = grid.childNodes.filter((node) => node.tagName === 'li');
			const start = (page - 1) * ARCHIVE_PAGE_SIZE;
			assert.equal(cards.length, Math.min(ARCHIVE_PAGE_SIZE, expected.length - start));
			for (const card of cards) {
				const link = one(elements(card, 'a'));
				const post = postsByUrl.get(attr(link, 'href'));
				assert.ok(post, 'card links to a real source post');
				assert.equal(post.category, category, 'no unrelated category cards');
				assert.equal(text(one(byClass(card, 'archive-category'))), category);
				assert.equal(text(one(elements(card, 'h2'))), post.title);
				assert.equal(Date.parse(attr(one(elements(card, 'time')), 'datetime')), post.date);
				for (const image of elements(card, 'img')) {
					assert.equal(attr(image, 'alt'), '');
					assert.ok(Number(attr(image, 'width')) > 0);
					assert.ok(Number(attr(image, 'height')) > 0);
				}
				urls.push(post.url);
			}
			assert.ok(text(one(byClass(dom, 'archive-count'))).includes(`全${expected.length}件`));
			const range = text(one(byClass(dom, 'archive-range')));
			assert.ok(range.includes(`${expected.length}件中${start + 1}〜${start + cards.length}件を表示`));
			assert.ok(range.includes(`${page}／${pageCount(category)}ページ`));
			checkSharedChrome(dom);
		}
		checkCompleteNewestFirst(urls, expected);
	});

	test(`built ${category}: canonical, heading, numbered links and previous/next stay in the category`, async () => {
		const total = pageCount(category);
		for (let page = 1; page <= total; page++) {
			const url = archivePageUrl(page, category);
			const dom = await readPage(url);
			checkCanonical(dom, url);
			assert.deepEqual(elements(dom, 'h1').map(text), [category]);
			assert.ok(text(one(elements(dom, 'title'))).includes(category));
			const navs = byClass(dom, 'archive-pagination');
			if (total === 1) assert.equal(navs.length, 0);
			else {
				const nav = one(navs);
				const current = one(walk(nav, (node) => attr(node, 'aria-current') === 'page'));
				assert.equal(text(current), String(page));
				const actualNumbers = byClass(nav, 'page-number').map((node) => Number(text(node)));
				assert.deepEqual(actualNumbers, archivePageNumbers(page, total).filter((number) => number !== null));
				for (const link of elements(nav, 'a')) {
					const href = attr(link, 'href');
					assert.ok(Array.from({ length: total }, (_, index) => archivePageUrl(index + 1, category)).includes(href), 'pagination only links to generated category pages');
					await readPage(href);
					if (byClass(link, 'page-number').length) assert.equal(href, archivePageUrl(Number(text(link)), category));
				}
			}
			for (const rel of ['prev', 'next']) {
				const adjacent = rel === 'prev' ? page - 1 : page + 1;
				const expected = adjacent >= 1 && adjacent <= total ? archivePageUrl(adjacent, category) : undefined;
				const headLinks = walk(dom, (node) => node.tagName === 'link' && attr(node, 'rel') === rel);
				const navLinks = navs.flatMap((nav) => walk(nav, (node) => node.tagName === 'a' && attr(node, 'rel') === rel));
				assert.equal(headLinks.length, expected ? 1 : 0);
				assert.equal(navLinks.length, expected ? 1 : 0);
				if (expected) {
					assert.equal(attr(headLinks[0], 'href'), expected);
					assert.equal(attr(navLinks[0], 'href'), expected);
				}
			}
		}
	});
}

for (const category of categories.filter((category) => !targetCategories.includes(category))) {
	test(`built ${category}: unchanged legacy list, descriptions, tags, dates and header`, async () => {
		const dom = await readPage(rootUrl(category));
		const expected = categoryPosts(category);
		checkCanonical(dom, rootUrl(category));
		assert.deepEqual(elements(dom, 'h1').map(text), [`${category}（${expected.length}件）`]);
		assert.equal(text(one(elements(dom, 'title'))), `${category} | カキフォイの日記`);
		one(byClass(dom, 'header-top'));
		one(byClass(dom, 'header-nav'));
		const back = one(byClass(dom, 'back-link'));
		assert.equal(attr(back, 'href'), '/categories');
		assert.equal(text(back), '← カテゴリ一覧へ戻る');
		for (const name of ['home-header', 'home-sidebar', 'archive-grid', 'archive-pagination', 'blog-archive']) assert.equal(byClass(dom, name).length, 0);
		const cards = byClass(one(byClass(dom, 'post-list')), 'post-card');
		assert.equal(cards.length, expected.length, 'legacy categories are not paginated');
		const urls = [];
		for (const card of cards) {
			const title = one(byClass(card, 'post-title'));
			const link = one(elements(title, 'a'));
			const post = postsByUrl.get(attr(link, 'href'));
			assert.ok(post);
			assert.equal(post.category, category);
			assert.equal(text(link), post.title);
			assert.equal(text(one(byClass(card, 'post-desc'))), post.description);
			assert.equal(text(one(byClass(card, 'cat-badge'))), category);
			assert.equal(Date.parse(attr(one(elements(card, 'time')), 'datetime')), post.date);
			const tags = byClass(card, 'tag-pill');
			assert.deepEqual(tags.map(text), post.tags);
			assert.deepEqual(tags.map((node) => attr(node, 'href')), post.tags.map((tag) => `/tags/${tag.replace(/%/g, '-pct-')}/`));
			urls.push(post.url);
		}
		checkCompleteNewestFirst(urls, expected);
	});
}

test('built category index retains the legacy list and all seven original category counts', async () => {
	const dom = await readPage('/categories/');
	checkCanonical(dom, '/categories/');
	assert.deepEqual(elements(dom, 'h1').map(text), ['カテゴリ一覧']);
	one(byClass(dom, 'header-top'));
	one(byClass(dom, 'header-nav'));
	assert.equal(byClass(dom, 'home-header').length, 0);
	assert.equal(byClass(dom, 'home-sidebar').length, 0);
	const links = byClass(one(byClass(dom, 'cat-list')), 'cat-link');
	assert.equal(links.length, categories.length);
	const counts = [];
	for (const category of categories) {
		const link = one(links.filter((node) => text(one(byClass(node, 'cat-name'))) === category));
		assert.equal(pathname(attr(link, 'href')), rootUrl(category));
		assert.equal(text(one(byClass(link, 'cat-count'))), `${categoryPosts(category).length}件`);
	}
	for (const link of links) counts.push(Number.parseInt(text(one(byClass(link, 'cat-count'))), 10));
	assert.deepEqual(counts, [...counts].sort((a, b) => b - a));
});

test('built category routes contain only roots plus pages 2..N of the two target categories', async () => {
	const actual = (await readdir(new URL('../dist/categories/', import.meta.url), { recursive: true })).filter((file) => file.endsWith('.html')).sort();
	const expected = ['index.html', ...categories.map((category) => `${category}/index.html`)];
	for (const category of targetCategories) {
		for (let page = 2; page <= pageCount(category); page++) expected.push(`${category}/page/${page}/index.html`);
	}
	assert.deepEqual(actual, expected.sort(), 'no /page/1/, empty extra pages, or non-target pagination');
});
