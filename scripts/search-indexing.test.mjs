import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';
import {parse} from 'parse5';

// Run after the PM's single production build. This test does not build or fetch.
const root = new URL('../', import.meta.url);
const auxiliary = ['/search/', '/contact/thanks/'];
const attr = (n, k) => n.attrs?.find(a => a.name === k)?.value;
const all = (n, p) => [...(p(n) ? [n] : []), ...(n.childNodes ?? []).flatMap(c => all(c, p))];
const read = file => readFile(new URL(file, root), 'utf8');
const normalizedPath = value => decodeURI(new URL(value).pathname).replace(/\/+$/, '') || '/';
const isAuxiliary = value => ['/search', '/contact/thanks'].includes(normalizedPath(value));
const sitemapLocations = xml => [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(m => m[1]);

async function htmlFiles(dir, prefix = '') {
	const result = [];
	for (const entry of await readdir(new URL(dir, root), {withFileTypes: true})) {
		const relative = prefix + entry.name;
		if (entry.isDirectory()) result.push(...await htmlFiles(dir + entry.name + '/', relative + '/'));
		else if (entry.name.endsWith('.html')) result.push(relative);
	}
	return result;
}

test('source: only search and contact confirmation opt out; crawling remains allowed', async () => {
	for (const route of auxiliary) {
		const source = await read(`src/pages/${route === '/search/' ? 'search' : 'contact/thanks'}.astro`);
		const head = source.match(/<head>([\s\S]*?)<\/head>/)?.[1];
		assert.ok(head);
		assert.match(head, /<meta name="robots" content="noindex, follow"\s*\/>/);
		assert.equal((source.match(/name="robots"/g) ?? []).length, 1);
		assert.match(head, /<BaseHead\b/);
	}
	const robots = await read('public/robots.txt');
	assert.match(robots, /^Allow: \/$/m);
	assert.doesNotMatch(robots, /^Disallow:.*(?:search|contact|\/\s*$)/m);
	assert.doesNotMatch(robots, /^noindex:/im);
});

test('build: both auxiliary pages have one robots tag in head and keep canonical', async () => {
	for (const route of auxiliary) {
		const dom = parse(await read(`dist${route}index.html`));
		const head = all(dom, n => n.tagName === 'head')[0];
		const robots = all(dom, n => n.tagName === 'meta' && attr(n, 'name') === 'robots');
		assert.equal(robots.length, 1);
		assert.ok(all(head, n => n === robots[0]).length === 1);
		assert.equal(attr(robots[0], 'content'), 'noindex, follow');
		const canonical = all(head, n => n.tagName === 'link' && attr(n, 'rel') === 'canonical');
		assert.equal(canonical.length, 1);
		assert.equal(attr(canonical[0], 'href'), `https://kakifoi.net${route}`);
		assert.equal(all(head, n => n.tagName === 'meta' && attr(n, 'name') === 'google-adsense-account').length, 1);
	}
});

test('build: every other page except 404 remains free of noindex', async () => {
	const files = await htmlFiles('dist/');
	assert.ok(files.length > 400);
	for (const file of files) {
		if (['404.html', 'search/index.html', 'contact/thanks/index.html'].includes(file)) continue;
		const dom = parse(await read('dist/' + file));
		const robots = all(dom, n => n.tagName === 'meta' && ['robots', 'googlebot'].includes(attr(n, 'name')));
		assert.ok(robots.every(n => !/\b(?:noindex|none)\b/i.test(attr(n, 'content') ?? '')), file);
	}
});

test('build: sitemap excludes auxiliary pages and retains articles, categories and tags', async () => {
	const names = (await readdir(new URL('dist/', root))).filter(f => /^sitemap.*\.xml$/.test(f));
	assert.ok(names.includes('sitemap-index.xml'));
	const xmls = await Promise.all(names.map(f => read('dist/' + f)));
	const locations = xmls.filter(xml => /<urlset\b/.test(xml)).flatMap(sitemapLocations);
	assert.ok(locations.length > 400);
	assert.ok(locations.every(location => !isAuxiliary(location)));
	assert.ok(locations.every(location => !/^\/404(?:\.html)?\/?$/.test(new URL(location).pathname)));
	const paths = new Set(locations.map(normalizedPath));
	for (const expected of ['/', '/about', '/privacy', '/contact', '/blog', '/tags']) assert.ok(paths.has(expected), expected);
	for (const dir of ['blog', 'categories', 'tags']) {
		const files = await htmlFiles(`dist/${dir}/`);
		for (const file of files) {
			if (!file.endsWith('index.html')) continue;
			const relative = file.slice(0, -'index.html'.length).replace(/\/+$/, '');
			const route = `/${dir}` + (relative ? '/' + relative : '');
			assert.ok(paths.has(route), route);
		}
	}
});

test('build: search controls and confirmation recovery link remain available', async () => {
	const search = parse(await read('dist/search/index.html'));
	assert.equal(all(search, n => n.tagName === 'input' && attr(n, 'id') === 'search-input').length, 1);
	assert.equal(all(search, n => n.tagName === 'ol' && attr(n, 'id') === 'search-results').length, 1);
	const thanks = parse(await read('dist/contact/thanks/index.html'));
	assert.equal(all(thanks, n => n.tagName === 'a' && attr(n, 'href') === '/' && attr(n, 'class') === 'btn-home').length, 1);
});
