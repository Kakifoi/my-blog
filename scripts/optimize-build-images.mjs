#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import sharp from 'sharp';
import { prepareImage } from './prepare-image.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN_BYTES = 512 * 1024;
const DISPLAY_IMAGE_QUALITY = 80;
const DISPLAY_IMAGE_PRESETS = {
	'header-left': {
		widths: [220, 520, 780],
		sizes: '(max-width: 359px) 96px, (max-width: 767px) 110px, (max-width: 1199px) 220px, 260px',
	},
	'header-right': {
		widths: [220, 420, 630],
		sizes: '(max-width: 359px) 96px, (max-width: 767px) 110px, (max-width: 1199px) 200px, 210px',
	},
	avatar: { widths: [110, 220, 330], sizes: '110px' },
};
const attrsOf = (node) => Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value]));
const hasClass = (node, name) => attrsOf(node).class?.split(/\s+/).includes(name);
const escapeAttribute = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

async function htmlFiles(directory) {
	const files = [];
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const file = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...await htmlFiles(file));
		else if (entry.isFile() && entry.name.endsWith('.html')) files.push(file);
	}
	return files.sort();
}

// 元のHTMLは再シリアライズしない。画像タグの位置だけを置換し、本文や広告リンクを保つ。
function pageImages(html) {
	const images = [];
	function visit(node, inArticle = false, inProse = false, inLink = false, hero = false, inPicture = false) {
		const attrs = attrsOf(node);
		inArticle ||= node.tagName === 'article' && 'data-pagefind-body' in attrs;
		inProse ||= hasClass(node, 'prose');
		inLink ||= node.tagName === 'a';
		hero ||= hasClass(node, 'hero-image');
		inPicture ||= node.tagName === 'picture';
		const thumbnail = 'data-list-thumbnail' in attrs;
		const displayPreset = Object.hasOwn(DISPLAY_IMAGE_PRESETS, attrs['data-display-image']) ? attrs['data-display-image'] : undefined;
		if ((inArticle || thumbnail || displayPreset) && node.tagName === 'img' && node.sourceCodeLocation) images.push({ node, attrs, inProse, inLink, hero, inPicture, thumbnail, displayPreset });
		for (const child of node.childNodes ?? []) visit(child, inArticle, inProse, inLink, hero, inPicture);
		// ページ送り用の未表示カードも、表示される前に一覧用画像へ変換する。
		if (node.content) visit(node.content, inArticle, inProse, inLink, hero, inPicture);
	}
	visit(parse(html, { sourceCodeLocationInfo: true }));
	return images;
}

export async function optimizeBuildImages({ root = ROOT, dist = path.join(root, 'dist') } = {}) {
	const publicDir = path.join(root, 'public');
	const cache = new Map();
	const report = { optimizedImages: [], pages: [], lazyImages: 0, dimensionedImages: 0 };

	async function prepare(src, thumbnail = false) {
		const cacheKey = `${thumbnail ? 'thumbnail' : 'article'}:${src}`;
		if (cache.has(cacheKey)) return cache.get(cacheKey);
		const work = (async () => {
			const url = new URL(src, 'https://kakifoi.net');
			if (!src.startsWith('/images/') || url.search || url.hash) return null;
			const input = path.resolve(publicDir, `.${decodeURIComponent(url.pathname)}`);
			if (!input.startsWith(`${publicDir}${path.sep}`)) throw new Error(`画像がpublic配下にありません: ${src}`);
			if (!/\.(?:jpe?g|png|webp|avif|gif)$/i.test(input)) return null;
			const [metadata, inputStat] = await Promise.all([sharp(input).metadata(), stat(input)]);
			const rotated = metadata.orientation >= 5 && metadata.orientation <= 8;
			const image = { source: src, output: src, width: rotated ? metadata.height : metadata.width, height: rotated ? metadata.width : metadata.height, beforeBytes: inputStat.size, afterBytes: inputStat.size };
			// 一覧用だけ小さなWebPを作り、記事本文と元画像は保持する。
			if (thumbnail) {
				const digest = createHash('sha256').update(await readFile(input)).update('list-320x180-webp-q80-v1').digest('hex').slice(0, 16);
				const output = `/images/optimized/${path.parse(input).name}.${digest}.webp`;
				const destination = path.join(dist, output);
				await mkdir(path.dirname(destination), { recursive: true });
				const result = await sharp(input).rotate().resize(320, 180, { fit: 'cover', withoutEnlargement: true }).webp({ quality: 80 }).toFile(destination);
				Object.assign(image, { output, width: result.width, height: result.height, afterBytes: result.size, thumbnail: true });
				report.optimizedImages.push(image);
				return image;
			}
			// JPEG写真のみを縮小。透過画像・アニメ・図表の形式は変えない。
			if (metadata.format === 'jpeg' && inputStat.size >= MIN_BYTES) {
				const digest = createHash('sha256').update(await readFile(input)).update('body-1200-q85-v1').digest('hex').slice(0, 16);
				const output = `/images/optimized/${path.parse(input).name}.${digest}.jpg`;
				const destination = path.join(dist, output);
				const result = await prepareImage({ inputPath: input, outputPath: destination, mode: 'body' });
				if (result.size < inputStat.size * 0.8) {
					Object.assign(image, { output, width: result.width, height: result.height, afterBytes: result.size });
					report.optimizedImages.push(image);
				} else await rm(destination);
			}
			return image;
		})();
		cache.set(cacheKey, work);
		return work;
	}

	async function prepareDisplay(src, displayPreset) {
		const cacheKey = `display:${displayPreset}:${src}`;
		if (cache.has(cacheKey)) return cache.get(cacheKey);
		const work = (async () => {
			const url = new URL(src, 'https://kakifoi.net');
			if (!src.startsWith('/images/') || url.search || url.hash) return null;
			const input = path.resolve(publicDir, `.${decodeURIComponent(url.pathname)}`);
			const invalidPath = () => new Error(`表示用画像がpublic/images配下にありません: ${src}`);
			if (!input.startsWith(`${path.join(publicDir, 'images')}${path.sep}`)) throw invalidPath();
			if (!/\.(?:jpe?g|png|webp|avif|gif)$/i.test(input)) return null;
			// opt-in画像も外部URLやシンボリックリンク経由でpublicの外を読み込まない。
			const [actualInput, actualPublic] = await Promise.all([realpath(input), realpath(publicDir)]);
			if (!actualInput.startsWith(`${path.join(actualPublic, 'images')}${path.sep}`)) throw invalidPath();
			const original = await readFile(actualInput);
			const metadata = await sharp(original).metadata();
			const rotated = metadata.orientation >= 5 && metadata.orientation <= 8;
			const naturalWidth = rotated ? metadata.height : metadata.width;
			const preset = DISPLAY_IMAGE_PRESETS[displayPreset];
			// 小さい原本は拡大せず、同じ実幅に丸められた候補を重複させない。
			const widths = [...new Set(preset.widths.map((width) => Math.min(width, naturalWidth)))];
			const variants = [];
			for (const width of widths) {
				const digest = createHash('sha256').update(original).update(`display-${displayPreset}-${width}w-webp-q${DISPLAY_IMAGE_QUALITY}-v1`).digest('hex').slice(0, 16);
				const output = `/images/optimized/${path.parse(input).name}.${displayPreset}-${width}w.${digest}.webp`;
				const destination = path.join(dist, output);
				await mkdir(path.dirname(destination), { recursive: true });
				// 幅だけを指定して縦横比と構図を維持する。切り抜きは行わない。
				const result = await sharp(original).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: DISPLAY_IMAGE_QUALITY }).toFile(destination);
				const variant = { source: src, output, width: result.width, height: result.height, beforeBytes: original.length, afterBytes: result.size, displayPreset, quality: DISPLAY_IMAGE_QUALITY };
				variants.push(variant);
				report.optimizedImages.push(variant);
			}
			const fallback = variants.find((variant) => variant.width === Math.min(preset.widths[1], naturalWidth));
			return { ...fallback, srcset: variants.map((variant) => `${variant.output} ${variant.width}w`).join(', '), sizes: preset.sizes };
		})();
		cache.set(cacheKey, work);
		return work;
	}

	for (const file of await htmlFiles(dist)) {
		const html = await readFile(file, 'utf8');
		const images = pageImages(html);
		if (!images.length) continue;
		const edits = [];
		const page = { path: `/${path.relative(dist, file).split(path.sep).join('/').replace(/index\.html$/, '')}`, images: images.length, beforeBytes: 0, afterBytes: 0 };
		for (const { node, attrs, inProse, inLink, hero, inPicture, thumbnail, displayPreset } of images) {
			// 既存のレスポンシブ画像はsrcsetとの整合を保ち、そのままにする。
			if (inPicture || attrs.srcset) continue;
			const image = displayPreset ? await prepareDisplay(attrs.src ?? '', displayPreset) : await prepare(attrs.src ?? '', thumbnail);
			if (displayPreset && !image) continue;
			if (image) {
				attrs.src = image.output;
				if (displayPreset) {
					attrs.srcset = image.srcset;
					attrs.sizes = image.sizes;
				}
				if ((!displayPreset && thumbnail) || (!attrs.width && !attrs.height)) {
					attrs.width = String(image.width);
					attrs.height = String(image.height);
					report.dimensionedImages++;
				}
				page.beforeBytes += image.beforeBytes;
				// srcsetの実転送量は表示幅とDPR次第なので、ページ集計はfallbackの値。
				page.afterBytes += image.afterBytes;
			}
			attrs.loading = displayPreset ? attrs.loading ?? (displayPreset === 'avatar' ? 'lazy' : 'eager') : hero ? 'eager' : attrs.loading ?? 'lazy';
			attrs.decoding ??= 'async';
			if (attrs.loading === 'lazy') report.lazyImages++;
			let replacement = `<img${Object.entries(attrs).map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`).join('')}>`;
			if (!displayPreset && image && image.output !== image.source && inProse && !inLink) {
				replacement = `<a href="${escapeAttribute(image.source)}" class="original-photo-link" target="_blank" rel="noopener" aria-label="${escapeAttribute(attrs.alt || '写真')}を元のサイズで開く" title="写真をタップして拡大">${replacement}</a>`;
			}
			edits.push({ start: node.sourceCodeLocation.startOffset, end: node.sourceCodeLocation.endOffset, replacement });
		}
		let output = html;
		for (const { start, end, replacement } of edits.sort((a, b) => b.start - a.start)) output = output.slice(0, start) + replacement + output.slice(end);
		if (output !== html) await writeFile(file, output);
		report.pages.push(page);
	}
	await mkdir(path.join(root, '.astro'), { recursive: true });
	await writeFile(path.join(root, '.astro/image-optimization.json'), JSON.stringify(report, null, 2) + '\n');
	return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	optimizeBuildImages().then((report) => {
		const displaySources = new Set();
		const before = report.optimizedImages.reduce((sum, image) => {
			if (image.displayPreset) {
				if (displaySources.has(image.source)) return sum;
				displaySources.add(image.source);
			}
			return sum + image.beforeBytes;
		}, 0);
		const after = report.optimizedImages.reduce((sum, image) => sum + image.afterBytes, 0);
		console.log(`記事・一覧・表示画像: ${report.optimizedImages.length}ファイルを軽量化 (元画像${(before / 1e6).toFixed(2)}MB → 出力合計${(after / 1e6).toFixed(2)}MB)、${report.lazyImages}箇所を遅延読み込み`);
	}).catch((error) => { console.error(error); process.exitCode = 1; });
}
