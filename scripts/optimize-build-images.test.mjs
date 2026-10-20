import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile, copyFile } from 'node:fs/promises';
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
		if (node.content) visit(node.content);
	}
	visit(parse(html));
	return nodes;
}
const attrs = (node) => Object.fromEntries(node.attrs.map(({ name, value }) => [name, value]));

async function displayFixture(t, name) {
	const root = await mkdtemp(path.join(os.tmpdir(), `blog-display-${name}-`));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(path.join(root, 'public/images'), { recursive: true });
	await mkdir(path.join(root, 'dist/images'), { recursive: true });
	return root;
}

function srcsetCandidates(image) {
	return image.srcset.split(', ').map((candidate) => {
		const match = candidate.match(/^(\/images\/optimized\/[^\s,]+\.webp) (\d+)w$/);
		assert.ok(match, `local WebP width candidate: ${candidate}`);
		return { output: match[1], width: Number(match[2]) };
	});
}

test('inert homepage card templates receive the same optimized thumbnails before pagination', async (t) => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'blog-home-templates-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(path.join(root, 'public/images'), { recursive: true });
	await mkdir(path.join(root, 'dist'), { recursive: true });
	const image = await sharp({ create: { width: 1200, height: 675, channels: 3, background: '#82c45c' } }).jpeg().toBuffer();
	await writeFile(path.join(root, 'public/images/hero.jpg'), image);
	const card = '<a href="/blog/example/"><img src="/images/hero.jpg" data-list-thumbnail width="1200" height="675" loading="lazy" alt="記事"></a>';
	await writeFile(path.join(root, 'dist/index.html'), `<ul><li>${card}</li><template class="card" data-category="グルメ">${card}</template></ul>`);
	const report = await optimizeBuildImages({ root });
	const output = await readFile(path.join(root, 'dist/index.html'), 'utf8');
	const images = elements(output, 'img').map(attrs);
	assert.equal(images.length, 2);
	assert.equal(report.optimizedImages.length, 1);
	assert.equal(images[0].src, images[1].src);
	assert.match(images[1].src, /\.webp$/);
	assert.equal(images[1].width, '320');
	assert.equal(images[1].height, '180');
	assert.equal(images[1].loading, 'lazy');
	assert.ok(output.includes('<template class="card" data-category="グルメ">'));
	assert.deepEqual(elements(output, 'a').map((node) => attrs(node).href), ['/blog/example/', '/blog/example/']);
	assert.equal(digest(await readFile(path.join(root, 'public/images/hero.jpg'))), digest(image));
});

test('list thumbnails are small WebP files and do not replace article or unmarked images', async (t) => {
	const root = await mkdtemp(path.join(os.tmpdir(), 'blog-images-thumbnails-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(path.join(root, 'public/images'), { recursive: true });
	await mkdir(path.join(root, 'dist/images'), { recursive: true });
	const original = await sharp({ create: { width: 640, height: 360, channels: 3, background: '#cc0000' } }).png().toBuffer();
	await writeFile(path.join(root, 'public/images/photo.png'), original);
	await writeFile(path.join(root, 'dist/images/photo.png'), original);
	const unmarked = '<img src="/images/photo.png" alt="そのまま">';
	const card = '<a href="/blog/example/"><img src="/images/photo.png" data-list-thumbnail width="1200" height="675" loading="eager" alt=""></a>';
	await writeFile(path.join(root, 'dist/index.html'), `${card}${card}${unmarked}<article data-pagefind-body><div class="hero-image"><img src="/images/photo.png" alt="記事写真"></div></article>`);
	const report = await optimizeBuildImages({ root });
	assert.equal(report.optimizedImages.length, 1, 'duplicate thumbnails share a generated file');
	const output = await readFile(path.join(root, 'dist/index.html'), 'utf8');
	const images = elements(output, 'img').map(attrs);
	assert.equal(images[0].src, images[1].src);
	assert.match(images[0].src, /\.webp$/);
	assert.equal(images[0].width, '320');
	assert.equal(images[0].height, '180');
	assert.equal(images[0].loading, 'eager');
	const generated = await readFile(path.join(root, 'dist', images[0].src));
	const metadata = await sharp(generated).metadata();
	assert.equal(metadata.width, 320);
	assert.equal(metadata.height, 180);
	assert.ok(generated.length < original.length);
	assert.ok(output.includes(unmarked));
	assert.equal(images[3].src, '/images/photo.png', 'article uses its own image variant');
	assert.deepEqual(elements(output, 'a').map(n => attrs(n).href), ['/blog/example/', '/blog/example/']);
	assert.equal(digest(await readFile(path.join(root, 'public/images/photo.png'))), digest(original));
	assert.equal(digest(await readFile(path.join(root, 'dist/images/photo.png'))), digest(original));
});

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

test('display presets preserve artwork, explicit attributes and originals; pages share unique hashed variants', async (t) => {
	const root = await displayFixture(t, 'presets');
	const blue = await sharp({ create: { width: 1200, height: 450, channels: 3, background: '#0022dd' } }).png().toBuffer();
	const artwork = await sharp({ create: { width: 1200, height: 900, channels: 3, background: '#dd2200' } })
		.composite([{ input: blue, left: 0, top: 450 }]).jpeg({ quality: 95 }).toBuffer();
	const avatar = await sharp({ create: { width: 1024, height: 1024, channels: 3, background: '#3b915d' } }).png().toBuffer();
	const originals = new Map([['artwork.jpg', artwork], ['avatar.png', avatar]]);
	for (const [name, original] of originals) {
		await writeFile(path.join(root, 'public/images', name), original);
		await writeFile(path.join(root, 'dist/images', name), original);
	}
	const html = '<!doctype html><html><head><meta property="og:image" content="/images/artwork.jpg"></head><body><h1>構図と原本を保持</h1>'
		+ '<a href="/"><img src="/images/artwork.jpg" data-display-image="header-left" width="1200" height="900" loading="eager" decoding="sync" fetchpriority="high" alt="赤 &amp; 青" style="aspect-ratio:4/3" data-astro-cid-fixture></a>'
		+ '<img src="/images/artwork.jpg" data-display-image="header-right" width="600" height="450" loading="eager" alt="" sizes="100vw">'
		+ '<img src="/images/avatar.png" data-display-image="avatar" width="110" height="110" loading="lazy" alt="プロフィール">'
		+ '</body></html>';
	await mkdir(path.join(root, 'dist/archive'), { recursive: true });
	await writeFile(path.join(root, 'dist/index.html'), html);
	await writeFile(path.join(root, 'dist/archive/index.html'), html);
	const report = await optimizeBuildImages({ root });
	const output = await readFile(path.join(root, 'dist/index.html'), 'utf8');
	assert.equal(await readFile(path.join(root, 'dist/archive/index.html'), 'utf8'), output);
	assert.equal(report.optimizedImages.length, 9, 'three variants per preset, not per occurrence/page');
	assert.equal(new Set(report.optimizedImages.map((image) => image.output)).size, 9);
	assert.equal((await readdir(path.join(root, 'dist/images/optimized'))).length, 9);
	assert.equal(report.dimensionedImages, 0, 'explicit dimensions retain the original aspect-ratio attributes');
	assert.equal(report.lazyImages, 2);
	assert.ok(output.includes('<meta property="og:image" content="/images/artwork.jpg">'));
	assert.ok(output.includes('<h1>構図と原本を保持</h1>'));
	assert.deepEqual(elements(output, 'a').map((node) => attrs(node).href), ['/']);
	const images = elements(output, 'img').map(attrs);
	const expected = [
		{ key: 'header-left', widths: [220, 520, 780], sizes: '(max-width: 359px) 96px, (max-width: 767px) 110px, (max-width: 1199px) 220px, 260px', dimensions: ['1200', '900'], original: artwork, name: 'artwork' },
		{ key: 'header-right', widths: [220, 420, 630], sizes: '(max-width: 359px) 96px, (max-width: 767px) 110px, (max-width: 1199px) 200px, 210px', dimensions: ['600', '450'], original: artwork, name: 'artwork' },
		{ key: 'avatar', widths: [110, 220, 330], sizes: '110px', dimensions: ['110', '110'], original: avatar, name: 'avatar' },
	];
	for (const [index, preset] of expected.entries()) {
		const image = images[index];
		const candidates = srcsetCandidates(image);
		assert.deepEqual(candidates.map((candidate) => candidate.width), preset.widths);
		assert.equal(image.src, candidates[1].output, 'middle width is the fallback');
		assert.equal(image.sizes, preset.sizes);
		assert.deepEqual([image.width, image.height], preset.dimensions);
		assert.equal(image.loading, preset.key === 'avatar' ? 'lazy' : 'eager');
		assert.equal(image.decoding, index === 0 ? 'sync' : 'async');
		for (const candidate of candidates) {
			const expectedHash = createHash('sha256').update(preset.original).update(`display-${preset.key}-${candidate.width}w-webp-q80-v1`).digest('hex').slice(0, 16);
			assert.equal(candidate.output, `/images/optimized/${preset.name}.${preset.key}-${candidate.width}w.${expectedHash}.webp`);
			const generated = await readFile(path.join(root, 'dist', candidate.output));
			const metadata = await sharp(generated).metadata();
			assert.equal(metadata.format, 'webp');
			assert.equal(metadata.width, candidate.width);
			assert.equal(metadata.height, Math.round(candidate.width * (preset.key === 'avatar' ? 1 : 0.75)));
			const entry = report.optimizedImages.find((item) => item.output === candidate.output);
			assert.equal(entry.displayPreset, preset.key);
			assert.equal(entry.quality, 80);
			assert.equal(entry.beforeBytes, preset.original.length);
			assert.equal(entry.afterBytes, generated.length);
			assert.deepEqual([entry.width, entry.height], [metadata.width, metadata.height]);
			if (preset.key !== 'avatar') {
				const { data, info } = await sharp(generated).raw().toBuffer({ resolveWithObject: true });
				const top = (5 * info.width + 5) * info.channels;
				const bottom = ((info.height - 6) * info.width + info.width - 6) * info.channels;
				assert.ok(data[top] > 180 && data[top + 2] < 60, 'red top edge is not cropped away');
				assert.ok(data[bottom] < 60 && data[bottom + 2] > 180, 'blue bottom edge is not cropped away');
			}
		}
	}
	assert.equal(images[0].alt, '赤 & 青');
	assert.equal(images[0].fetchpriority, 'high');
	assert.equal(images[0].style, 'aspect-ratio:4/3');
	assert.ok('data-astro-cid-fixture' in images[0]);
	for (const [name, original] of originals) {
		assert.equal(digest(await readFile(path.join(root, 'public/images', name))), digest(original));
		assert.equal(digest(await readFile(path.join(root, 'dist/images', name))), digest(original));
	}
	const fallbackBytes = images.reduce((sum, image) => sum + report.optimizedImages.find((item) => item.output === image.src).afterBytes, 0);
	for (const page of report.pages) {
		assert.equal(page.beforeBytes, artwork.length * 2 + avatar.length);
		assert.equal(page.afterBytes, fallbackBytes, 'page estimate counts the fallback, not every srcset candidate');
	}
	assert.deepEqual(JSON.parse(await readFile(path.join(root, '.astro/image-optimization.json'), 'utf8')), report);
});

test('display images respect EXIF orientation, cap widths without enlargement and fill missing dimensions', async (t) => {
	const root = await displayFixture(t, 'orientation');
	const original = await sharp({ create: { width: 80, height: 200, channels: 3, background: '#31b8a2' } })
		.jpeg().withMetadata({ orientation: 6 }).toBuffer();
	await writeFile(path.join(root, 'public/images/rotated.jpg'), original);
	await writeFile(path.join(root, 'dist/index.html'), '<img src="/images/rotated.jpg" data-display-image="avatar" alt="横向き">');
	const report = await optimizeBuildImages({ root });
	const image = attrs(elements(await readFile(path.join(root, 'dist/index.html'), 'utf8'), 'img')[0]);
	const candidates = srcsetCandidates(image);
	assert.deepEqual(candidates.map((candidate) => candidate.width), [110, 200]);
	assert.equal(image.src, candidates[1].output);
	assert.deepEqual([image.width, image.height], ['200', '80']);
	assert.equal(image.loading, 'lazy');
	assert.equal(report.dimensionedImages, 1);
	assert.equal(report.optimizedImages.length, 2);
	for (const candidate of candidates) {
		const metadata = await sharp(await readFile(path.join(root, 'dist', candidate.output))).metadata();
		assert.equal(metadata.width, candidate.width);
		assert.equal(metadata.height, Math.round(candidate.width * 0.4));
		assert.equal(metadata.orientation, undefined);
	}
	assert.equal(digest(await readFile(path.join(root, 'public/images/rotated.jpg'))), digest(original));
});

test('tiny transparent originals collapse repeated widths but keep each display preset cache separate', async (t) => {
	const root = await displayFixture(t, 'tiny');
	const original = await sharp({ create: { width: 70, height: 50, channels: 4, background: '#8844bb80' } }).png().toBuffer();
	await writeFile(path.join(root, 'public/images/tiny.png'), original);
	const presets = ['header-left', 'header-right', 'avatar'];
	await writeFile(path.join(root, 'dist/index.html'), presets.map((preset) => `<img src="/images/tiny.png" data-display-image="${preset}" width="70" height="50">`).join(''));
	const report = await optimizeBuildImages({ root });
	const images = elements(await readFile(path.join(root, 'dist/index.html'), 'utf8'), 'img').map(attrs);
	assert.equal(report.optimizedImages.length, 3);
	assert.equal(new Set(images.map((image) => image.src)).size, 3);
	for (const [index, image] of images.entries()) {
		assert.deepEqual(srcsetCandidates(image), [{ output: image.src, width: 70 }]);
		assert.equal(image.loading, index === 2 ? 'lazy' : 'eager');
		assert.deepEqual([image.width, image.height], ['70', '50']);
		const metadata = await sharp(await readFile(path.join(root, 'dist', image.src))).metadata();
		assert.deepEqual([metadata.width, metadata.height, metadata.hasAlpha], [70, 50, true]);
	}
	assert.equal(digest(await readFile(path.join(root, 'public/images/tiny.png'))), digest(original));
});

test('display, list and article uses of the same source never share incompatible cached results', async (t) => {
	const root = await displayFixture(t, 'mixed');
	const original = await sharp({ create: { width: 1200, height: 900, channels: 3, background: '#ac7842' } }).jpeg().toBuffer();
	await writeFile(path.join(root, 'public/images/shared.jpg'), original);
	await writeFile(path.join(root, 'dist/index.html'), '<article data-pagefind-body><img src="/images/shared.jpg" alt="本文"></article>'
		+ '<img src="/images/shared.jpg" data-list-thumbnail>'
		+ '<img src="/images/shared.jpg" data-display-image="avatar">');
	const report = await optimizeBuildImages({ root });
	const [article, list, avatar] = elements(await readFile(path.join(root, 'dist/index.html'), 'utf8'), 'img').map(attrs);
	assert.equal(article.src, '/images/shared.jpg');
	assert.deepEqual([article.width, article.height], ['1200', '900']);
	assert.equal(article.srcset, undefined);
	assert.deepEqual([list.width, list.height], ['320', '180']);
	assert.equal(list.srcset, undefined);
	assert.deepEqual([avatar.width, avatar.height], ['220', '165']);
	assert.deepEqual(srcsetCandidates(avatar).map((candidate) => candidate.width), [110, 220, 330]);
	assert.notEqual(avatar.src, list.src);
	assert.equal(report.optimizedImages.length, 4);
	assert.equal(report.optimizedImages.filter((image) => image.thumbnail).length, 1);
	assert.equal(report.optimizedImages.filter((image) => image.displayPreset).length, 3);
	assert.equal(digest(await readFile(path.join(root, 'public/images/shared.jpg'))), digest(original));
});

test('display opt-in leaves remote, unmarked, unknown, query/hash and existing responsive markup byte-identical', async (t) => {
	const root = await displayFixture(t, 'untouched');
	const html = '<img src="/images/unmarked-missing.jpg" alt="原本のまま">'
		+ '<img src="/images/unknown-missing.jpg" data-display-image="toString">'
		+ '<img src="https://example.com/image.png" data-display-image="avatar" loading="eager">'
		+ '<img src="//example.com/image.jpg" data-display-image="header-left">'
		+ '<img src="data:image/png;base64,AA==" data-display-image="avatar">'
		+ '<img src="/other/image.png" data-display-image="avatar">'
		+ '<img src="/images/missing.png?v=1" data-display-image="avatar">'
		+ '<img src="/images/missing.png#crop" data-display-image="avatar">'
		+ '<img src="/images/missing.svg" data-display-image="header-left">'
		+ '<img src="/images/missing.jpg" srcset="/images/ready.webp 2x" sizes="40px" data-display-image="header-right">'
		+ '<picture><source srcset="/images/ready.webp"><img src="/images/missing.png" data-display-image="avatar"></picture>'
		+ '<article data-pagefind-body><img src="https://example.com/remote.png" data-display-image="avatar"></article>';
	await writeFile(path.join(root, 'dist/index.html'), html);
	const report = await optimizeBuildImages({ root });
	assert.equal(await readFile(path.join(root, 'dist/index.html'), 'utf8'), html);
	assert.equal(report.optimizedImages.length, 0);
	assert.deepEqual(await readdir(path.join(root, 'dist/images')), []);
});

test('display paths cannot traverse out of public/images, including encoded separators', async (t) => {
	const root = await displayFixture(t, 'traversal');
	for (const src of ['/images/%2e%2e/outside.jpg', '/images/..%2foutside.jpg', '/images/%2e%2e/%2e%2e/outside.jpg']) {
		await writeFile(path.join(root, 'dist/index.html'), `<img src="${src}" data-display-image="avatar">`);
		await assert.rejects(optimizeBuildImages({ root }), /public\/images配下にありません/);
	}
	assert.deepEqual(await readdir(path.join(root, 'dist/images')), []);
});

test('display paths cannot read outside public/images through a symlink', async (t) => {
	const root = await displayFixture(t, 'symlink');
	await writeFile(path.join(root, 'outside.jpg'), 'not an image: must not reach the decoder');
	await symlink(path.join(root, 'outside.jpg'), path.join(root, 'public/images/linked.jpg'));
	await writeFile(path.join(root, 'dist/index.html'), '<img src="/images/linked.jpg" data-display-image="avatar">');
	await assert.rejects(optimizeBuildImages({ root }), /public\/images配下にありません/);
	assert.deepEqual(await readdir(path.join(root, 'dist/images')), []);
});

test('current header/avatar assets produce measured variants in an isolated fixture, never the project dist', async (t) => {
	const root = await displayFixture(t, 'current-assets');
	const assets = [
		{ preset: 'header-left', name: 'home-header-travel-food-v2.jpg' },
		{ preset: 'header-right', name: 'home-header-sisters-cat-v2.jpg' },
		{ preset: 'avatar', name: 'profile.png' },
	];
	for (const asset of assets) {
		asset.original = await readFile(new URL(`../public/images/${asset.name}`, import.meta.url));
		await writeFile(path.join(root, 'public/images', asset.name), asset.original);
		await writeFile(path.join(root, 'dist/images', asset.name), asset.original);
	}
	await writeFile(path.join(root, 'dist/index.html'), assets.map(({ preset, name }) => `<img src="/images/${name}" data-display-image="${preset}">`).join(''));
	const report = await optimizeBuildImages({ root });
	const images = elements(await readFile(path.join(root, 'dist/index.html'), 'utf8'), 'img').map(attrs);
	assert.equal(report.optimizedImages.length, 9);
	for (const [index, asset] of assets.entries()) {
		const variants = report.optimizedImages.filter((image) => image.displayPreset === asset.preset);
		const fallback = variants.find((image) => image.output === images[index].src);
		assert.equal(variants.length, 3);
		assert.ok(variants.every((image) => image.afterBytes < asset.original.length));
		for (const directory of ['public/images', 'dist/images']) {
			assert.equal(digest(await readFile(path.join(root, directory, asset.name))), digest(asset.original));
		}
		assert.equal(digest(await readFile(new URL(`../public/images/${asset.name}`, import.meta.url))), digest(asset.original));
		t.diagnostic(`${asset.preset}: original=${asset.original.length}B; ${variants.map((image) => `${image.width}w=${image.afterBytes}B`).join(', ')}; fallback=${fallback.afterBytes}B`);
	}
});
