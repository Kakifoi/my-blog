import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { parse } from 'parse5';
import { optimizeBuildImages } from './optimize-build-images.mjs';

const digest = (buffer) => createHash('sha256').update(buffer).digest('hex');
function elements(html, tag) {
	const nodes = [];
	function visit(node) {
		if (node.tagName === tag) nodes.push(node);
		for (const child of node.childNodes ?? []) visit(child);
	}
	visit(parse(html));
	return nodes;
}
const attrs = (node) => Object.fromEntries(node.attrs.map(({ name, value }) => [name, value]));

test('large photos become smaller, retain orientation and originals, and keep merchant links and text', async (t) => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'blog-images-test-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(path.join(root, 'public/images'), { recursive: true });
	await mkdir(path.join(root, 'dist/images'), { recursive: true });
	const pixels = Buffer.alloc(1800 * 1200 * 3);
	let seed = 42;
	for (let i = 0; i < pixels.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; pixels[i] = seed >>> 24; }
	const original = await sharp(pixels, { raw: { width: 1800, height: 1200, channels: 3 } }).jpeg({ quality: 95 }).withMetadata({ orientation: 6 }).toBuffer();
	assert.ok(original.length > 512 * 1024);
	await writeFile(path.join(root, 'public/images/photo.jpg'), original);
	await copyFile(path.join(root, 'public/images/photo.jpg'), path.join(root, 'dist/images/photo.jpg'));
	const html = '<!doctype html><html><head><meta property="og:image" content="/images/photo.jpg"></head><body><article data-pagefind-body><div class="hero-image"><img src="/images/photo.jpg" alt="見出し"></div><div class="prose"><p>価格や文章 &amp; 記号は保持。</p><p><img src="/images/photo.jpg" alt="メニュー &amp; 料理"></p><a href="https://merchant.example/?x=1&amp;y=2" rel="sponsored"><img src="/images/photo.jpg" alt="商品"></a><img src="https://m.media-amazon.com/image.jpg" alt="外部商品"><script>const sample = "<img src=untouched>";</script></div></article></body></html>';
	await writeFile(path.join(root, 'dist/index.html'), html);
	const report = await optimizeBuildImages({ root });
	assert.equal(report.optimizedImages.length, 1, 'same source is encoded only once');
	const image = report.optimizedImages[0];
	assert.equal(image.width, 800);
	assert.equal(image.height, 1200);
	assert.ok(image.afterBytes < image.beforeBytes * 0.8);
	assert.equal(digest(await readFile(path.join(root, 'public/images/photo.jpg'))), digest(original));
	assert.equal(digest(await readFile(path.join(root, 'dist/images/photo.jpg'))), digest(original));
	const output = await readFile(path.join(root, 'dist/index.html'), 'utf8');
	assert.ok(output.includes('<p>価格や文章 &amp; 記号は保持。</p>'));
	assert.ok(output.includes('<meta property="og:image" content="/images/photo.jpg">'));
	assert.ok(output.includes('const sample = "<img src=untouched>";'));
	const images = elements(output, 'img').map(attrs);
	assert.equal(images[0].loading, 'eager');
	assert.equal(images[1].loading, 'lazy');
	assert.deepEqual(images.map((image) => image.alt), ['見出し', 'メニュー & 料理', '商品', '外部商品']);
	assert.equal(images[3].src, 'https://m.media-amazon.com/image.jpg');
	const links = elements(output, 'a');
	assert.equal(links.length, 2, 'original-photo link plus unchanged merchant link');
	assert.equal(attrs(links[0]).href, '/images/photo.jpg');
	assert.equal(attrs(links[1]).href, 'https://merchant.example/?x=1&y=2');
	assert.equal(links[1].childNodes[0].tagName, 'img', 'no nested link inside merchant link');
});

test('small and transparent images keep their files; explicit dimensions and responsive markup are respected', async (t) => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'blog-images-small-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(path.join(root, 'public/images'), { recursive: true });
	await mkdir(path.join(root, 'dist'), { recursive: true });
	await sharp({ create: { width: 100, height: 80, channels: 4, background: '#00000000' } }).png().toFile(path.join(root, 'public/images/diagram.png'));
	const before = '<img src="/images/missing.jpg" srcset="/images/another.jpg 2x" alt="responsive">';
	const html = `<article data-pagefind-body><div class="prose"><img src="/images/diagram.png" width="50" height="40" loading="eager" alt="透過図">${before}<picture><source srcset="/images/other.webp"><img src="/images/other.jpg"></picture></div></article>`;
	await writeFile(path.join(root, 'dist/index.html'), html);
	const report = await optimizeBuildImages({ root });
	assert.equal(report.optimizedImages.length, 0);
	const output = await readFile(path.join(root, 'dist/index.html'), 'utf8');
	assert.ok(output.includes(before));
	const image = attrs(elements(output, 'img')[0]);
	assert.equal(image.src, '/images/diagram.png');
	assert.equal(image.width, '50');
	assert.equal(image.height, '40');
	assert.equal(image.loading, 'eager');
	assert.equal(elements(output, 'a').length, 0);
});
