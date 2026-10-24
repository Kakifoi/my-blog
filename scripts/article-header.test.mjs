import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import test from 'node:test';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parse } from 'parse5';

// Read the single completed production build, including its image report.
// Missing/stale output must fail; this test never builds, optimizes, or skips posts.
const origin = 'https://kakifoi.net';
const home = parse(await readFile(new URL('../dist/index.html', import.meta.url), 'utf8'));
const report = JSON.parse(await readFile(new URL('../.astro/image-optimization.json', import.meta.url), 'utf8'));
const optimizedByOutput = new Map(report.optimizedImages.map((image) => [image.output, image]));
const sourceFiles = (await readdir(new URL('../src/content/blog/', import.meta.url)))
	.filter((file) => /\.mdx?$/.test(file)).sort();
const posts = await Promise.all(sourceFiles.map(async (file) => {
	const id = file.replace(/\.mdx?$/, '');
	const pathname = `/blog/${id}/`;
	const source = await readFile(new URL(`../src/content/blog/${file}`, import.meta.url), 'utf8');
	const html = await readFile(new URL(`../dist${pathname}index.html`, import.meta.url), 'utf8');
	return { id, pathname, data: parseFrontmatter(source).frontmatter, dom: parse(html) };
}));

const attr = (node, name) => node.attrs?.find((attribute) => attribute.name === name)?.value;
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
function walk(node, predicate) {
	return [...(predicate(node) ? [node] : []), ...(node.childNodes ?? []).flatMap((child) => walk(child, predicate))];
}
const byClass = (name, root) => walk(root, (node) => (attr(node, 'class') ?? '').split(/\s+/).includes(name));
function one(nodes, message) {
	assert.equal(nodes.length, 1, message);
	return nodes[0];
}
const headerOf = (dom, id) => one(byClass('home-header', dom), `${id}: exactly one HomeHeader`);
const linksOf = (node) => walk(node, (child) => child.tagName === 'a').map((link) => ({
	href: attr(link, 'href'),
	text: text(link).replace(/\s+/g, ' ').trim(),
	label: attr(link, 'aria-label'),
	target: attr(link, 'target'),
	rel: (attr(link, 'rel') ?? '').split(/\s+/).filter(Boolean).sort(),
}));
const navigationOf = (header, id) => one(byClass('home-navigation', header), `${id}: main navigation`);
const socialOf = (header, id) => one(byClass('header-social', header), `${id}: social links`);
function meta(dom, key, id) {
	const attribute = key.startsWith('og:') ? 'property' : 'name';
	return attr(one(walk(dom, (node) => node.tagName === 'meta' && attr(node, attribute) === key), `${id}: one ${key}`), 'content');
}
function imageSource(url, id, displayPreset) {
	assert.equal(typeof url, 'string', `${id}: image URL required`);
	if (!url.startsWith('/images/optimized/')) return url;
	const image = optimizedByOutput.get(url);
	assert.ok(image, `${id}: optimized image must have a source mapping: ${url}`);
	assert.equal(image.displayPreset, displayPreset, `${id}: image preset`);
	assert.ok(!image.thumbnail, `${id}: do not substitute an archive thumbnail`);
	return image.source;
}
const checkedAssets = new Map();
async function builtAssetExists(pathname) {
	if (!checkedAssets.has(pathname)) {
		checkedAssets.set(pathname, stat(new URL(`../dist${pathname}`, import.meta.url)));
	}
	assert.ok((await checkedAssets.get(pathname)).isFile(), `built image required: ${pathname}`);
}
const illustrations = [
	{ side: 'left', preset: 'header-left', source: '/images/home-header-travel-food-v2.jpg' },
	{ side: 'right', preset: 'header-right', source: '/images/home-header-sisters-cat-v2.jpg' },
];

test('the completed build contains every Markdown/MDX post and a nonempty homepage header reference', () => {
	assert.ok(sourceFiles.length > 0, 'the article collection must not be empty');
	assert.equal(new Set(posts.map((post) => post.pathname)).size, sourceFiles.length);
	const header = headerOf(home, 'home');
	assert.equal(header.tagName, 'header');
	assert.deepEqual(linksOf(navigationOf(header, 'home')).map(({ href, text }) => ({ href, text })), [
		{ href: '/about/', text: 'プロフィール' },
		{ href: '/', text: 'ホーム' },
		{ href: '/contact/', text: 'お問い合わせ' },
		{ href: '/tags/', text: 'タグ一覧' },
		{ href: '/categories/', text: 'カテゴリ一覧' },
		{ href: '/privacy/', text: 'プライバシー＆免責事項' },
	]);
	const socialLinks = linksOf(socialOf(header, 'home'));
	assert.deepEqual(socialLinks.map(({ href }) => href), [
		'https://x.com/amekagari', 'https://www.instagram.com/kakifoi_blog/', '/contact/', '/search/',
	]);
	for (const link of socialLinks.slice(0, 2)) {
		assert.equal(link.target, '_blank', link.href);
		assert.ok(link.label, `${link.href}: accessible social link name`);
		assert.ok(link.rel.includes('noopener') && link.rel.includes('noreferrer'), link.href);
	}
});

test('every article has exactly one site header outside its searchable content and no legacy header', () => {
	for (const { id, dom } of posts) {
		const header = headerOf(dom, id);
		assert.equal(header.tagName, 'header', id);
		assert.equal(walk(dom, (node) => node.tagName === 'header').length, 1, `${id}: no duplicate site header`);
		assert.equal(byClass('header-top', dom).length, 0, `${id}: no old red header`);
		assert.equal(byClass('header-nav', dom).length, 0, `${id}: no old navigation`);
		const main = one(walk(dom, (node) => node.tagName === 'main'), `${id}: main content`);
		const article = one(walk(main, (node) => node.tagName === 'article' && attr(node, 'data-pagefind-body') !== undefined), `${id}: searchable article`);
		assert.equal(byClass('home-header', main).length, 0, `${id}: header stays outside main`);
		assert.equal(walk(header, (node) => node.tagName === 'h1').length, 0, `${id}: branding is not an article h1`);
		assert.ok(text(one(byClass('prose', article), `${id}: article body`)).trim(), `${id}: body is retained`);
		assert.equal(byClass('affiliate-notice', article).length, 1, `${id}: advertising disclosure is retained`);
	}
});

test('every article retains the homepage branding, main menu, social links and accessible mobile controls', () => {
	const reference = headerOf(home, 'home');
	const referenceBrand = one(byClass('brand', reference), 'home: brand');
	for (const { id, dom } of posts) {
		const header = headerOf(dom, id);
		const brand = one(byClass('brand', header), `${id}: brand`);
		assert.equal(brand.tagName, 'a', id);
		assert.equal(attr(brand, 'href'), '/', `${id}: brand links home`);
		assert.equal(attr(brand, 'aria-label'), attr(referenceBrand, 'aria-label'), id);
		for (const name of ['brand-title', 'brand-tagline']) {
			assert.equal(text(one(byClass(name, brand), `${id}: ${name}`)), text(one(byClass(name, referenceBrand), `home: ${name}`)), id);
		}
		const navigation = navigationOf(header, id);
		assert.equal(navigation.tagName, 'nav', id);
		assert.equal(attr(navigation, 'aria-label'), 'メインメニュー', id);
		assert.deepEqual(linksOf(navigation), linksOf(navigationOf(reference, 'home')), `${id}: same ordered main links`);
		assert.deepEqual(linksOf(socialOf(header, id)), linksOf(socialOf(reference, 'home')), `${id}: same social links and safe new-tab attributes`);
		const toggle = one(byClass('mobile-menu-toggle', dom), `${id}: one mobile menu toggle`);
		assert.equal(toggle.tagName, 'button', id);
		assert.equal(attr(toggle, 'type'), 'button', id);
		assert.equal(attr(toggle, 'aria-expanded'), 'false', id);
		assert.equal(attr(toggle, 'aria-label'), 'メニューを開く', id);
		assert.equal(attr(toggle, 'aria-controls'), 'home-navigation', id);
		assert.equal(one(walk(dom, (node) => attr(node, 'id') === 'home-navigation'), `${id}: unique menu target`), navigation);
		assert.ok(walk(header, (node) => node === toggle).length, `${id}: toggle belongs to header`);
		const search = one(byClass('mobile-search', header), `${id}: mobile search`);
		assert.equal(search.tagName, 'a', id);
		assert.equal(attr(search, 'href'), '/search/', id);
		assert.equal(attr(search, 'aria-label'), 'サイト内検索', id);
	}
});

test('home and all articles use the same left/right illustration sources, including optimized WebP candidates', async () => {
	for (const { id, dom } of [{ id: 'home', dom: home }, ...posts]) {
		const header = headerOf(dom, id);
		assert.equal(walk(header, (node) => node.tagName === 'img').length, 2, `${id}: two header illustrations`);
		for (const { side, preset, source } of illustrations) {
			const image = one(byClass(`brand-illustration-${side}`, header), `${id}: ${side} illustration`);
			assert.equal(image.tagName, 'img', id);
			assert.equal(attr(image, 'data-display-image'), preset, id);
			assert.equal(imageSource(attr(image, 'src'), id, preset), source, `${id}: ${side} original source`);
			assert.equal(attr(image, 'alt'), '', `${id}: decorative illustration`);
			assert.equal(attr(image, 'loading'), 'eager', id);
			assert.ok(Number(attr(image, 'width')) > 0 && Number(attr(image, 'height')) > 0, `${id}: illustration dimensions`);
			await builtAssetExists(attr(image, 'src'));
			const srcset = attr(image, 'srcset');
			if (attr(image, 'src').startsWith('/images/optimized/')) {
				assert.match(attr(image, 'src'), /\.webp$/, id);
				assert.ok(srcset && attr(image, 'sizes'), `${id}: responsive optimized illustration`);
			}
			if (srcset) {
				const candidates = srcset.split(',').map((candidate) => candidate.trim().split(/\s+/));
				assert.ok(candidates.some(([url]) => url === attr(image, 'src')), `${id}: fallback is in srcset`);
				for (const [url, descriptor] of candidates) {
					assert.match(descriptor, /^\d+w$/, id);
					assert.equal(imageSource(url, id, preset), source, `${id}: all ${side} candidates use the original`);
					await builtAssetExists(url);
				}
			}
		}
	}
});

test('all article headings, canonical URLs and social metadata retain their own frontmatter values', () => {
	for (const { id, pathname, data, dom } of posts) {
		assert.deepEqual(walk(dom, (node) => node.tagName === 'h1').map(text), [data.title], `${id}: one original article title`);
		const articleHeader = one(byClass('article-header', dom), `${id}: article metadata header`);
		assert.deepEqual(walk(articleHeader, (node) => node.tagName === 'h1').map(text), [data.title], id);
		assert.deepEqual(walk(dom, (node) => node.tagName === 'title').map(text), [data.title], id);
		const canonical = one(walk(dom, (node) => node.tagName === 'link' && (attr(node, 'rel') ?? '').split(/\s+/).includes('canonical')), `${id}: one canonical`);
		const url = new URL(pathname, origin).href;
		assert.equal(attr(canonical, 'href'), url, `${id}: canonical remains the article URL`);
		for (const key of ['og:url', 'twitter:url']) assert.equal(meta(dom, key, id), url, id);
		for (const key of ['title', 'og:title', 'twitter:title']) assert.equal(meta(dom, key, id), data.title, id);
		for (const key of ['description', 'og:description', 'twitter:description']) assert.equal(meta(dom, key, id), data.description, id);
		assert.equal(meta(dom, 'twitter:card', id), 'summary_large_image', id);
	}
});

test('article hero images and original-image OGP survive the header change; hero-less posts stay hero-less', async () => {
	for (const { id, data, dom } of posts) {
		const heroes = byClass('hero-image', dom);
		const ogImage = meta(dom, 'og:image', id);
		assert.equal(meta(dom, 'twitter:image', id), ogImage, `${id}: social image parity`);
		assert.equal(typeof ogImage, 'string', `${id}: social image is present`);
		const socialImage = new URL(ogImage);
		assert.equal(socialImage.origin, origin, `${id}: absolute social image URL`);
		await builtAssetExists(socialImage.pathname);
		if (!data.heroImage) {
			assert.equal(heroes.length, 0, `${id}: do not invent an article hero`);
			assert.doesNotMatch(socialImage.pathname, /home-header-/, `${id}: branding must not replace the fallback OGP`);
			continue;
		}
		const hero = one(heroes, `${id}: one article hero`);
		const image = one(walk(hero, (node) => node.tagName === 'img'), `${id}: hero image`);
		assert.equal(imageSource(attr(image, 'src'), id), data.heroImage, `${id}: hero keeps its original source`);
		assert.equal(attr(image, 'alt'), data.heroImageAlt ?? data.title, `${id}: hero ALT`);
		assert.equal(attr(image, 'loading'), 'eager', `${id}: hero is not lazy-loaded`);
		assert.ok(Number(attr(image, 'width')) > 0 && Number(attr(image, 'height')) > 0, `${id}: hero dimensions`);
		assert.equal(ogImage, new URL(data.heroImage, origin).href, `${id}: OGP uses the original hero, not its optimized variant or header art`);
		await builtAssetExists(attr(image, 'src'));
	}
});

test('HomeHeader styles do not require the homepage-only home-reference body class', async () => {
	const source = await readFile(new URL('../src/components/HomeHeader.astro', import.meta.url), 'utf8');
	const styles = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)];
	assert.ok(styles.length > 0, 'HomeHeader owns its styles');
	for (const [, css] of styles) {
		assert.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g, ''), /\.home-reference\b/, 'header CSS must work outside body.home-reference');
	}
});
