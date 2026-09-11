#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import sharp from 'sharp';
import { prepareImage } from './prepare-image.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN_BYTES = 512 * 1024;
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
function articleImages(html) {
	const images = [];
	function visit(node, inArticle = false, inProse = false, inLink = false, hero = false, inPicture = false) {
		const attrs = attrsOf(node);
		inArticle ||= node.tagName === 'article' && 'data-pagefind-body' in attrs;
		inProse ||= hasClass(node, 'prose');
		inLink ||= node.tagName === 'a';
		hero ||= hasClass(node, 'hero-image');
		inPicture ||= node.tagName === 'picture';
		if (inArticle && node.tagName === 'img' && node.sourceCodeLocation) images.push({ node, attrs, inProse, inLink, hero, inPicture });
		for (const child of node.childNodes ?? []) visit(child, inArticle, inProse, inLink, hero, inPicture);
	}
	visit(parse(html, { sourceCodeLocationInfo: true }));
	return images;
}

export async function optimizeBuildImages({ root = ROOT, dist = path.join(root, 'dist') } = {}) {
	const publicDir = path.join(root, 'public');
	const cache = new Map();
	const report = { optimizedImages: [], pages: [], lazyImages: 0, dimensionedImages: 0 };

	async function prepare(src) {
		if (cache.has(src)) return cache.get(src);
		const work = (async () => {
			const url = new URL(src, 'https://kakifoi.net');
			if (!src.startsWith('/images/') || url.search || url.hash) return null;
			const input = path.resolve(publicDir, `.${decodeURIComponent(url.pathname)}`);
			if (!input.startsWith(`${publicDir}${path.sep}`)) throw new Error(`画像がpublic配下にありません: ${src}`);
			if (!/\.(?:jpe?g|png|webp|avif|gif)$/i.test(input)) return null;
			const [metadata, inputStat] = await Promise.all([sharp(input).metadata(), stat(input)]);
			const rotated = metadata.orientation >= 5 && metadata.orientation <= 8;
			const image = { source: src, output: src, width: rotated ? metadata.height : metadata.width, height: rotated ? metadata.width : metadata.height, beforeBytes: inputStat.size, afterBytes: inputStat.size };
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
		cache.set(src, work);
		return work;
	}

	for (const file of await htmlFiles(dist)) {
		const html = await readFile(file, 'utf8');
		const images = articleImages(html);
		if (!images.length) continue;
		const edits = [];
		const page = { path: `/${path.relative(dist, file).split(path.sep).join('/').replace(/index\.html$/, '')}`, images: images.length, beforeBytes: 0, afterBytes: 0 };
		for (const { node, attrs, inProse, inLink, hero, inPicture } of images) {
			// 既存のレスポンシブ画像はsrcsetとの整合を保ち、そのままにする。
			if (inPicture || attrs.srcset) continue;
			const image = await prepare(attrs.src ?? '');
			if (image) {
				attrs.src = image.output;
				if (!attrs.width && !attrs.height) {
					attrs.width = String(image.width);
					attrs.height = String(image.height);
					report.dimensionedImages++;
				}
				page.beforeBytes += image.beforeBytes;
				page.afterBytes += image.afterBytes;
			}
			attrs.loading = hero ? 'eager' : attrs.loading ?? 'lazy';
			attrs.decoding ??= 'async';
			if (attrs.loading === 'lazy') report.lazyImages++;
			let replacement = `<img${Object.entries(attrs).map(([key, value]) => ` ${key}="${escapeAttribute(value)}"`).join('')}>`;
			if (image && image.output !== image.source && inProse && !inLink) {
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
		const before = report.optimizedImages.reduce((sum, image) => sum + image.beforeBytes, 0);
		const after = report.optimizedImages.reduce((sum, image) => sum + image.afterBytes, 0);
		console.log(`記事画像: ${report.optimizedImages.length}枚を軽量化 (${(before / 1e6).toFixed(2)}MB → ${(after / 1e6).toFixed(2)}MB)、${report.lazyImages}箇所を遅延読み込み`);
	}).catch((error) => { console.error(error); process.exitCode = 1; });
}
