import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'parse5';

// Full run requires the main PM's completed production build in dist/:
//   node --test scripts/not-found.test.mjs
// This test never builds, serves, or fetches anything. Before that build, run only:
//   node --test --test-name-pattern='^source:' scripts/not-found.test.mjs
// Static HTML cannot prove Cloudflare's HTTP status; check an unknown URL after deployment.
const source = await readFile(new URL('../src/pages/404.astro', import.meta.url), 'utf8');
const distRoot = new URL('../dist/', import.meta.url);
const expectedLinks = [['/', 'ホーム'], ['/blog/', '記事一覧'], ['/search/', '検索']];
const attr = (node, name) => node.attrs?.find((attribute) => attribute.name === name)?.value;
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
function walk(node, predicate) {
	return [...(predicate(node) ? [node] : []), ...(node.childNodes ?? []).flatMap((child) => walk(child, predicate))];
}
const byTag = (root, name) => walk(root, (node) => node.tagName === name);

async function readBuildFile(file) {
	try {
		return await readFile(new URL(file, distRoot), 'utf8');
	} catch (error) {
		if (error.code === 'ENOENT') assert.fail(`dist/${file} is missing. Requires the main PM's completed production build; this test does not build.`);
		throw error;
	}
}

function checkMain(dom) {
	const mains = byTag(dom, 'main');
	assert.equal(mains.length, 1);
	const main = mains[0];
	assert.notEqual(attr(main, 'data-pagefind-ignore'), undefined);
	const headings = byTag(main, 'h1');
	assert.equal(headings.length, 1);
	assert.equal(text(headings[0]), 'ページが見つかりませんでした');
	assert.ok(attr(headings[0], 'id'));
	assert.equal(attr(main, 'aria-labelledby'), attr(headings[0], 'id'));
	assert.ok(byTag(main, 'p').some((node) => /URLが間違っている可能性/.test(text(node))), 'explain why the page may be missing');
	const navigation = byTag(main, 'nav');
	assert.equal(navigation.length, 1);
	assert.ok(attr(navigation[0], 'aria-label'));
	const links = byTag(main, 'a');
	assert.deepEqual(links.map((node) => [attr(node, 'href'), text(node).trim()]), expectedLinks);
	for (const link of links) {
		assert.equal(attr(link, 'onclick'), undefined);
		assert.equal(attr(link, 'target'), undefined);
		assert.equal(attr(link, 'role'), undefined, 'keep ordinary link semantics');
	}
	assert.equal(walk(dom, (node) => attr(node, 'data-pagefind-body') !== undefined).length, 0);
}

test('source: reuse BaseHead, HomeHeader and Footer without the old Header', () => {
	for (const component of ['BaseHead', 'HomeHeader', 'Footer']) {
		assert.ok(source.includes(`import ${component} from '../components/${component}.astro';`));
		assert.equal([...source.matchAll(new RegExp(`<${component}\\b[^>]*\\/>`, 'g'))].length, 1);
	}
	assert.doesNotMatch(source, /components\/Header\.astro|<Header\b/);
	assert.match(source, /<html lang="ja">/);
	const head = source.match(/<head>([\s\S]*?)<\/head>/)?.[1];
	assert.ok(head);
	assert.match(head, /<meta name="robots" content="noindex, follow"\s*\/>/);
	assert.equal((source.match(/name="robots"/g) ?? []).length, 1);
});

test('source: ignored main has the Japanese heading, explanation and three ordinary links', () => {
	const main = source.match(/<main\b[^>]*>[\s\S]*?<\/main>/)?.[0];
	assert.ok(main);
	checkMain(parse(main));
	assert.doesNotMatch(source, /data-pagefind-body|<script\b|Astro\.redirect|http-equiv\s*=\s*["']refresh/i);
});

test('source: local styles allow narrow screens and show keyboard focus', () => {
	assert.doesNotMatch(source, /<style\s+is:global/);
	assert.match(source, /width: calc\(100% - 2rem\)/);
	assert.match(source, /overflow-wrap: anywhere/);
	assert.match(source, /flex-wrap: wrap/);
	assert.match(source, /min-width: 0/);
	assert.match(source, /a:focus-visible\s*\{[^}]*outline: 3px solid[^}]*outline-offset: 4px/s);
});

test('build: top-level dist/404.html retains shared chrome, robots and recovery links', async () => {
	const dom = parse(await readBuildFile('404.html'));
	assert.equal(attr(byTag(dom, 'html')[0], 'lang'), 'ja');
	const head = byTag(dom, 'head')[0];
	assert.ok(head);
	const robots = byTag(dom, 'meta').filter((node) => attr(node, 'name') === 'robots');
	assert.equal(robots.length, 1);
	assert.ok(byTag(head, 'meta').includes(robots[0]));
	assert.equal(attr(robots[0], 'content'), 'noindex, follow');
	assert.match(text(byTag(head, 'title')[0]), /404.*ページが見つかりませんでした/);
	assert.equal(byTag(dom, 'meta').filter((node) => attr(node, 'http-equiv')?.toLowerCase() === 'refresh').length, 0);
	for (const [tag, className] of [['header', 'home-header'], ['footer', 'site-footer']]) {
		assert.equal(byTag(dom, tag).filter((node) => (attr(node, 'class') ?? '').split(/\s+/).includes(className)).length, 1);
	}
	checkMain(dom);
});

test('build: generated sitemap index and URL sets exclude every 404 route form', async () => {
	await readBuildFile('sitemap-index.xml');
	const files = (await readdir(distRoot)).filter((file) => /^sitemap.*\.xml$/.test(file));
	const sitemaps = await Promise.all(files.map(readBuildFile));
	const urlsets = sitemaps.filter((xml) => /<urlset\b/.test(xml));
	assert.ok(urlsets.length > 0, 'require actual sitemap URL sets, not an empty index');
	assert.ok(urlsets.some((xml) => /<loc>/.test(xml)), 'require existing public URLs');
	for (const [index, xml] of sitemaps.entries()) {
		for (const [, location] of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) {
			assert.doesNotMatch(new URL(location).pathname, /^\/404(?:\.html|\/index\.html)?\/?$/, `${files[index]} must exclude ${location}`);
		}
	}
});
