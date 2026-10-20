import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'parse5';
import sharp from 'sharp';

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
const byClass = (name) => walk(dom, (node) => (attr(node, 'class') ?? '').split(/\s+/).includes(name));
const sourceFiles = (await readdir(new URL('../src/content/blog/', import.meta.url))).filter((file) => /\.mdx?$/.test(file));

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
