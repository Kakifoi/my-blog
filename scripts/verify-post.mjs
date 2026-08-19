#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HELP = `記事の変更範囲・画像・ビルド結果をまとめて検品します。

使い方:
  npm run verify:post -- --slug <slug> [--mode full|text-only|image-only]

必須:
  --slug <slug>       対象記事のスラッグ

オプション:
  --mode <mode>       full（既定）、text-only、image-only
  --help              このヘルプを表示

モード:
  full / text-only    postcheck後、npm run buildを1回実行し生成HTMLを検査
  image-only          記事が未変更かつheroImage 1ファイルだけの変更時に限り、buildを省略
`;

function fail(message) {
	console.error(`ERROR: ${message}`);
	process.exit(1);
}

function parseArgs(argv) {
	const options = { slug: undefined, mode: 'full', help: false };
	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];
		if (token === '--help' || token === '-h') {
			options.help = true;
			continue;
		}
		if (!token.startsWith('--')) fail(`不明な引数です: ${token}`);
		const equalsAt = token.indexOf('=');
		const name = token.slice(2, equalsAt === -1 ? undefined : equalsAt);
		if (!['slug', 'mode'].includes(name)) fail(`不明なオプションです: --${name}`);
		const value = equalsAt === -1 ? argv[++index] : token.slice(equalsAt + 1);
		if (!value || value.startsWith('--')) fail(`--${name} の値が必要です`);
		options[name] = value;
	}
	return options;
}

function run(command, args) {
	return execFileSync(command, args, {
		cwd: ROOT,
		encoding: 'utf8',
		stdio: 'inherit',
	});
}

function parseArticle(articlePath) {
	const text = readFileSync(articlePath, 'utf8');
	const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/);
	if (!match) fail(`frontmatterが見つかりません: ${path.relative(ROOT, articlePath)}`);
	const [, frontmatter, body] = match;
	const heroMatch = frontmatter.match(/^heroImage\s*:\s*(['"]?)([^'"\r\n]+)\1\s*$/m);
	const heroImage = heroMatch ? heroMatch[2].trim() : undefined;

	const imageRefs = new Set();
	for (const regex of [
		/["'](\/images\/[^"']+)["']/g,
		/\]\((\/images\/[^)\s]+)(?:\s+["'][^"']*["'])?\)/g,
	]) {
		for (const refMatch of body.matchAll(regex)) imageRefs.add(refMatch[1].split(/[?#]/, 1)[0]);
	}
	if (heroImage?.startsWith('/images/')) imageRefs.add(heroImage.split(/[?#]/, 1)[0]);
	return { heroImage, imageRefs: [...imageRefs].sort() };
}

function gitChanges() {
	const output = execFileSync('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'], {
		cwd: ROOT,
		encoding: 'buffer',
	});
	const fields = output.toString('utf8').split('\0');
	const changes = [];
	for (let index = 0; index < fields.length; index += 1) {
		const field = fields[index];
		if (!field) continue;
		if (field.length < 4 || field[2] !== ' ') fail(`git statusの解析に失敗しました: ${JSON.stringify(field)}`);
		const status = field.slice(0, 2);
		changes.push({ status, file: field.slice(3) });
		if (/[RC]/.test(status)) {
			const original = fields[++index];
			if (!original) fail('git statusのrename/copy情報が不完全です');
			changes.push({ status, file: original });
		}
	}
	return changes;
}

function canonicalFromHtml(html) {
	const tags = html.match(/<link\b[^>]*>/gi) ?? [];
	for (const tag of tags) {
		if (!/\brel=["']canonical["']/i.test(tag)) continue;
		return tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
	}
	return undefined;
}

async function verifyHero(heroImage) {
	if (!heroImage) return undefined;
	if (!heroImage.startsWith('/')) fail(`heroImageはpublicパスで指定してください: ${heroImage}`);
	const cleanPath = heroImage.split(/[?#]/, 1)[0];
	const localPath = path.join(ROOT, 'public', cleanPath.replace(/^\/+/, ''));
	if (!existsSync(localPath)) fail(`heroImageの実ファイルがありません: ${cleanPath}`);
	const metadata = await sharp(localPath).metadata();
	if (metadata.width !== 1200 || metadata.height !== 675) {
		fail(`heroImageが1200x675ではありません: ${metadata.width}x${metadata.height} (${cleanPath})`);
	}
	return { cleanPath, localPath };
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	if (options.help) {
		console.log(HELP);
		return;
	}
	if (!options.slug) fail('--slug は必須です。--help で使い方を確認できます');
	if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(options.slug)) fail(`不正なslugです: ${options.slug}`);
	if (!['full', 'text-only', 'image-only'].includes(options.mode)) {
		fail('--mode は full、text-only、image-only のいずれかです');
	}

	const articleCandidates = [
		path.join(ROOT, 'src', 'content', 'blog', `${options.slug}.md`),
		path.join(ROOT, 'src', 'content', 'blog', `${options.slug}.mdx`),
	];
	const articlePath = articleCandidates.find(existsSync);
	if (!articlePath) fail(`対象記事が見つかりません: ${options.slug}`);
	const articleRelative = path.relative(ROOT, articlePath);
	const { heroImage, imageRefs } = parseArticle(articlePath);
	const hero = await verifyHero(heroImage);

	const allowed = new Set([articleRelative]);
	for (const imageRef of imageRefs) allowed.add(path.posix.join('public', imageRef.replace(/^\/+/, '')));
	const changes = gitChanges();
	const unrelated = changes.filter(({ file }) => !allowed.has(file));
	if (unrelated.length) {
		fail(`対象記事と参照画像以外の変更があります:\n${unrelated.map(({ status, file }) => `  ${status} ${file}`).join('\n')}`);
	}

	if (options.mode === 'image-only') {
		if (!hero) fail('image-onlyにはheroImageの指定が必要です');
		if (changes.some(({ file }) => file === articleRelative)) fail('image-onlyでは記事ファイルを変更できません');
		if (changes.length !== 1 || changes[0].file !== path.relative(ROOT, hero.localPath)) {
			fail('image-onlyはheroImage 1ファイルだけが変更されている場合に限り使用できます');
		}
	} else if (options.mode === 'text-only') {
		if (changes.length !== 1 || changes[0].file !== articleRelative) {
			fail('text-onlyは対象記事ファイル1件だけが変更されている場合に限り使用できます');
		}
	}

	console.log(`\n[1/3] postcheck: ${options.slug}`);
	run('python3', ['scripts/postcheck.py', options.slug]);

	if (options.mode === 'image-only') {
		console.log('\n[2/3] build: image-only条件を満たしたため省略');
		console.log('[3/3] 生成HTML: 既存記事本文は未変更のため省略');
		console.log('\n検品完了');
		console.log(`  slug     : ${options.slug}`);
		console.log(`  mode     : ${options.mode}`);
		console.log(`  changes  : ${changes.length} file`);
		console.log('  build    : skipped');
		console.log('  result   : OK');
		return;
	}

	console.log('\n[2/3] build: npm run build');
	run('npm', ['run', 'build']);

	console.log('\n[3/3] 生成HTMLを確認');
	const htmlPath = path.join(ROOT, 'dist', 'blog', options.slug, 'index.html');
	if (!existsSync(htmlPath)) fail(`生成HTMLがありません: ${path.relative(ROOT, htmlPath)}`);
	const html = readFileSync(htmlPath, 'utf8');
	const expectedCanonical = `https://kakifoi.net/blog/${options.slug}/`;
	const actualCanonical = canonicalFromHtml(html);
	if (actualCanonical !== expectedCanonical) {
		fail(`canonicalが不一致です: expected=${expectedCanonical}, actual=${actualCanonical ?? '(なし)'}`);
	}
	if (hero && !html.includes(hero.cleanPath)) fail(`生成HTMLにheroImage参照がありません: ${hero.cleanPath}`);

	console.log('\n検品完了');
	console.log(`  slug      : ${options.slug}`);
	console.log(`  mode      : ${options.mode}`);
	console.log(`  changes   : ${changes.length} file(s)`);
	console.log('  postcheck : OK');
	console.log('  build     : OK (1回)');
	console.log(`  canonical : ${expectedCanonical}`);
	console.log(`  heroImage : ${hero?.cleanPath ?? '(なし)'}`);
	console.log('  result    : OK');
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
