import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'parse5';
import { ARCHIVE_PAGE_SIZE, archivePageNumbers, archivePageUrl } from '../src/utils/archivePagination.mjs';

function walk(node, predicate) {
	return [...(predicate(node) ? [node] : []), ...(node.childNodes ?? []).flatMap((child) => walk(child, predicate))];
}
const attr = (node, name) => node.attrs?.find((attribute) => attribute.name === name)?.value;
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');

test('pagination keeps the current, first, and last pages reachable without duplicate numbers', () => {
	assert.equal(ARCHIVE_PAGE_SIZE, 12);
	assert.equal(archivePageUrl(1), '/blog/');
	assert.equal(archivePageUrl(2), '/blog/page/2/');
	assert.equal(archivePageUrl(1, '子育て・日常'), `/categories/${encodeURIComponent('子育て・日常')}/`);
	assert.equal(archivePageUrl(2, '旅行・おでかけ'), `/categories/${encodeURIComponent('旅行・おでかけ')}/page/2/`);
	for (let total = 1; total <= 80; total++) {
		for (let current = 1; current <= total; current++) {
			const pages = archivePageNumbers(current, total);
			const numbers = pages.filter((page) => page !== null);
			assert.equal(numbers[0], 1);
			assert.equal(numbers.at(-1), total);
			assert.ok(numbers.includes(current));
			assert.equal(new Set(numbers).size, numbers.length);
			assert.ok(numbers.every((page) => page >= 1 && page <= total));
			assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b));
		}
	}
});

// These checks intentionally run against the single completed production build.
const sourceFiles = (await readdir(new URL('../src/content/blog/', import.meta.url)))
	.filter((file) => /\.mdx?$/.test(file));
const totalPages = Math.max(1, Math.ceil(sourceFiles.length / ARCHIVE_PAGE_SIZE));
const pages = await Promise.all(Array.from({ length: totalPages }, async (_, index) => {
	const number = index + 1;
	const pathname = archivePageUrl(number);
	const html = await readFile(new URL(`../dist${pathname}index.html`, import.meta.url), 'utf8');
	return { number, pathname, dom: parse(html) };
}));

test('all published posts appear exactly once across the archive pages, newest first', () => {
	const urls = [];
	const dates = [];
	for (const { number, dom } of pages) {
		const grid = walk(dom, (node) => attr(node, 'data-archive-grid') !== undefined);
		assert.equal(grid.length, 1);
		const cards = grid[0].childNodes.filter((node) => node.tagName === 'li');
		assert.equal(cards.length, Math.min(ARCHIVE_PAGE_SIZE, sourceFiles.length - (number - 1) * ARCHIVE_PAGE_SIZE));
		urls.push(...walk(grid[0], (node) => node.tagName === 'a').map((node) => attr(node, 'href')));
		dates.push(...walk(grid[0], (node) => node.tagName === 'time').map((node) => Date.parse(attr(node, 'datetime'))));
	}
	const expectedUrls = sourceFiles.map((file) => `/blog/${file.replace(/\.mdx?$/, '')}/`).sort();
	assert.equal(urls.length, sourceFiles.length);
	assert.equal(new Set(urls).size, sourceFiles.length);
	assert.deepEqual([...urls].sort(), expectedUrls);
	assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
});

test('each page has its own canonical, heading, current marker, and working previous/next links', () => {
	for (const { number, pathname, dom } of pages) {
		const canonical = walk(dom, (node) => node.tagName === 'link' && attr(node, 'rel') === 'canonical');
		assert.equal(attr(canonical[0], 'href'), `https://kakifoi.net${pathname}`);
		assert.deepEqual(walk(dom, (node) => node.tagName === 'h1').map(text), ['すべての記事']);
		const navigation = walk(dom, (node) => node.tagName === 'nav' && attr(node, 'aria-label') === '記事のページ')[0];
		assert.ok(navigation);
		const current = walk(navigation, (node) => attr(node, 'aria-current') === 'page');
		assert.equal(current.length, 1);
		assert.equal(text(current[0]), String(number));
		const links = walk(navigation, (node) => node.tagName === 'a');
		for (const link of links) assert.ok(pages.some((page) => page.pathname === attr(link, 'href')));
		const previous = links.find((node) => attr(node, 'rel') === 'prev');
		const next = links.find((node) => attr(node, 'rel') === 'next');
		assert.equal(previous ? attr(previous, 'href') : null, number > 1 ? archivePageUrl(number - 1) : null);
		assert.equal(next ? attr(next, 'href') : null, number < totalPages ? archivePageUrl(number + 1) : null);
	}
});

test('archive uses the homepage header and sidebar with a single mobile menu and no duplicated post title', () => {
	for (const { dom } of pages) {
		assert.equal(walk(dom, (node) => node.tagName === 'button' && attr(node, 'aria-controls') === 'home-navigation').length, 1);
		assert.equal(walk(dom, (node) => node.tagName === 'aside' && attr(node, 'aria-label') === 'プロフィールと記事を探す').length, 1);
		const grid = walk(dom, (node) => attr(node, 'data-archive-grid') !== undefined)[0];
		const cards = grid.childNodes.filter((node) => node.tagName === 'li');
		for (const card of cards) {
			assert.equal(walk(card, (node) => node.tagName === 'a').length, 1);
			assert.equal(walk(card, (node) => node.tagName === 'h2').length, 1);
			for (const image of walk(card, (node) => node.tagName === 'img')) {
				assert.equal(attr(image, 'alt'), '');
				assert.ok(attr(image, 'width'));
				assert.ok(attr(image, 'height'));
			}
		}
	}
});
