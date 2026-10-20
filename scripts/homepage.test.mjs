import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import test from 'node:test';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parse } from 'parse5';
import sharp from 'sharp';
import { HOME_PICK_IDS, getHomePicks } from '../src/data/home-picks.mjs';

// Check the completed production build, never run another build from a test.
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const dom = parse(html);
const attr = (node, name) => node.attrs?.find((attribute) => attribute.name === name)?.value;
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
function walk(node, predicate, templates = false) {
	return [
		...(predicate(node) ? [node] : []),
		...(node.childNodes ?? []).flatMap((child) => walk(child, predicate, templates)),
		...(templates && node.content ? walk(node.content, predicate, true) : []),
	];
}
const byClass = (name, root = dom) => walk(root, (node) => (attr(node, 'class') ?? '').split(/\s+/).includes(name));
const sourceFiles = (await readdir(new URL('../src/content/blog/', import.meta.url))).filter((file) => /\.mdx?$/.test(file));
const sourcePosts = await Promise.all(sourceFiles.map(async (file) => ({
	id: file.replace(/\.mdx?$/, ''),
	data: parseFrontmatter(await readFile(new URL(`../src/content/blog/${file}`, import.meta.url), 'utf8')).frontmatter,
})));
const postsByUrl = new Map(sourcePosts.map((post) => [`/blog/${post.id}/`, post]));

test('editorial picks contain six unique existing posts with real hero images, in configured order', async () => {
	assert.equal(HOME_PICK_IDS.length, 6);
	assert.equal(new Set(HOME_PICK_IDS).size, 6);
	const input = [...sourcePosts].reverse();
	const originalOrder = input.map((post) => post.id);
	const picks = getHomePicks(input);
	assert.deepEqual(picks.map((post) => post.id), HOME_PICK_IDS);
	assert.deepEqual(input.map((post) => post.id), originalOrder, 'selection never reorders the full collection');
	for (const post of picks) {
		assert.ok(sourceFiles.some((file) => file.replace(/\.mdx?$/, '') === post.id), post.id);
		assert.ok(post.data.heroImage, `heroImage required: ${post.id}`);
		assert.ok((await stat(new URL(`../public${post.data.heroImage}`, import.meta.url))).isFile(), `hero file required: ${post.id}`);
	}
});

test('invalid editorial selections fail explicitly instead of falling back to recent posts', () => {
	assert.throws(() => getHomePicks(sourcePosts, HOME_PICK_IDS.slice(0, 5)), /6件/);
	assert.throws(() => getHomePicks(sourcePosts, [...HOME_PICK_IDS.slice(0, 5), HOME_PICK_IDS[0]]), {
		message: `[home-picks] おすすめ記事IDが重複しています: ${HOME_PICK_IDS[0]}`,
	});
	assert.throws(() => getHomePicks(sourcePosts, [...HOME_PICK_IDS.slice(0, 5), 'missing-home-pick']), /見つかりません.*missing-home-pick/);
	for (const heroImage of [undefined, '', '   ']) {
		const withoutHero = sourcePosts.map((post) => post.id === HOME_PICK_IDS[0] ? { ...post, data: { ...post.data, heroImage } } : post);
		assert.throws(() => getHomePicks(withoutHero), {
			message: `[home-picks] おすすめ記事にheroImageがありません: ${HOME_PICK_IDS[0]}`,
		});
	}
});

test('built editorial cards keep the configured order, original titles, categories, hero sources and links', async () => {
	const pickup = byClass('pickup');
	assert.equal(pickup.length, 1);
	const heading = byClass('pickup-title', pickup[0]);
	assert.equal(heading.length, 1);
	assert.equal(heading[0].tagName, 'h2');
	assert.equal(text(heading[0]), 'まず読んでほしい記事');
	assert.equal(attr(pickup[0], 'aria-labelledby'), attr(heading[0], 'id'));
	const cards = byClass('pickup-item', pickup[0]);
	assert.equal(cards.length, 6);
	const report = JSON.parse(await readFile(new URL('../.astro/image-optimization.json', import.meta.url), 'utf8'));
	const links = [];
	for (const [index, card] of cards.entries()) {
		const anchors = walk(card, (node) => node.tagName === 'a');
		assert.equal(anchors.length, 1);
		const href = attr(anchors[0], 'href');
		assert.equal(href, `/blog/${HOME_PICK_IDS[index]}/`);
		links.push(href);
		const post = postsByUrl.get(href);
		assert.ok(post, `source post required: ${href}`);
		const titles = walk(card, (node) => node.tagName === 'p');
		assert.equal(titles.length, 1);
		assert.equal(text(titles[0]), post.data.title);
		assert.equal(text(byClass('category-label', card)[0]), post.data.category);
		const images = walk(card, (node) => node.tagName === 'img');
		assert.equal(images.length, 1);
		const thumbnail = report.optimizedImages.find((image) => image.thumbnail && image.source === post.data.heroImage);
		assert.ok(thumbnail, `thumbnail must use the original hero: ${post.id}`);
		assert.equal(attr(images[0], 'src'), thumbnail.output);
	}
	assert.deepEqual(links, HOME_PICK_IDS.map((id) => `/blog/${id}/`));
});

test('latest six cards remain date-ordered and separately managed from editorial picks', async () => {
	const grid = byClass('hpg-grid')[0];
	assert.ok(grid);
	const activeCards = grid.childNodes.filter((node) => node.tagName === 'li');
	assert.equal(activeCards.length, 6);
	const dates = activeCards.map((card) => {
		const link = walk(card, (node) => node.tagName === 'a')[0];
		const post = postsByUrl.get(attr(link, 'href'));
		assert.ok(post);
		return new Date(post.data.pubDate).valueOf();
	});
	const latestDates = sourcePosts.map((post) => new Date(post.data.pubDate).valueOf()).sort((a, b) => b - a).slice(0, 6);
	assert.deepEqual(dates, latestDates);
	const source = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
	assert.match(source, /const pickupPosts = getHomePicks\(posts\);/);
	assert.match(source, /<HomePostGrid posts=\{posts\} \/>/);
	const carousel = await readFile(new URL('../src/scripts/homepage.ts', import.meta.url), 'utf8');
	assert.match(carousel, /selectSlide\(0\);\s*$/);
});

test('homepage retains six active cards, one copy of every post, and the no-JS archive link', () => {
	const grid = byClass('hpg-grid')[0];
	assert.ok(grid);
	assert.equal(grid.childNodes.filter((node) => node.tagName === 'li').length, 6);
	assert.equal(grid.childNodes.filter((node) => node.tagName === 'template').length, sourceFiles.length - 6);
	const links = walk(grid, (node) => node.tagName === 'a', true).map((node) => attr(node, 'href'));
	assert.deepEqual([...links].sort(), sourceFiles.map((file) => `/blog/${file.replace(/\.mdx?$/, '')}/`).sort());
	assert.equal(new Set(links).size, sourceFiles.length);
	const archive = walk(dom, (node) => attr(node, 'data-hpg-archive-link') !== undefined);
	assert.equal(archive.length, 1);
	assert.equal(attr(archive[0], 'href'), '/blog/');
	assert.equal(text(archive[0]), `すべての記事を見る（${sourceFiles.length}件） →`);
});

test('homepage display images use real responsive WebP files and keep original aspect ratios', async () => {
	const displayImages = walk(dom, (node) => node.tagName === 'img' && attr(node, 'data-display-image'));
	assert.equal(displayImages.length, 3);
	for (const image of displayImages) {
		const preset = attr(image, 'data-display-image');
		assert.ok(['header-left', 'header-right', 'avatar'].includes(preset));
		assert.match(attr(image, 'src'), /^\/images\/optimized\/.+\.webp$/);
		assert.equal(attr(image, 'loading'), preset === 'avatar' ? 'lazy' : 'eager');
		assert.ok(attr(image, 'sizes'));
		const candidates = attr(image, 'srcset').split(', ').map((candidate) => candidate.split(' '));
		assert.equal(candidates.length, 3);
		assert.ok(candidates.some(([url]) => url === attr(image, 'src')));
		for (const [url, descriptor] of candidates) {
			const file = new URL(`../dist${url}`, import.meta.url);
			const metadata = await sharp(await readFile(file)).metadata();
			assert.equal(metadata.format, 'webp');
			assert.equal(`${metadata.width}w`, descriptor);
			const ratio = Number(attr(image, 'width')) / Number(attr(image, 'height'));
			assert.ok(Math.abs(metadata.width / metadata.height - ratio) < 0.01, 'composition is not cropped');
			const original = preset === 'avatar' ? 'profile.png' : preset === 'header-left' ? 'home-header-travel-food-v2.jpg' : 'home-header-sisters-cat-v2.jpg';
			assert.ok((await stat(file)).size < (await stat(new URL(`../public/images/${original}`, import.meta.url))).size);
		}
	}
});
