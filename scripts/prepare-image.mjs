#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const HELP = `ブログ画像を既定サイズのJPEGへ変換します。

使い方:
  npm run image:prepare -- --input <入力画像> --output <出力.jpg> --mode hero|body [options]

必須:
  --input <path>       入力画像
  --output <path>      出力先（.jpg または .jpeg）
  --mode <mode>        hero または body

オプション:
  --position <value>   heroの切り抜き位置（既定: centre）
                       centre, center, north, northeast, east, southeast,
                       south, southwest, west, northwest, entropy, attention
  --quality <1-100>    JPEG品質（既定: 85）
  --force              既存の出力ファイルを上書き
  --help               このヘルプを表示

処理:
  hero  EXIF回転補正 → 16:9クロップ → 1200x675
  body  EXIF回転補正 → 比率を維持し長辺1200px以内（拡大なし）
`;

const POSITION_VALUES = new Set([
	'centre',
	'center',
	'north',
	'northeast',
	'east',
	'southeast',
	'south',
	'southwest',
	'west',
	'northwest',
	'entropy',
	'attention',
]);

function fail(message) {
	console.error(`ERROR: ${message}`);
	process.exit(1);
}

function parseArgs(argv) {
	const options = {
		input: undefined,
		output: undefined,
		mode: undefined,
		position: 'centre',
		quality: 85,
		force: false,
		help: false,
	};
	const valueOptions = new Set(['input', 'output', 'mode', 'position', 'quality']);

	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];
		if (token === '--force') {
			options.force = true;
			continue;
		}
		if (token === '--help' || token === '-h') {
			options.help = true;
			continue;
		}
		if (!token.startsWith('--')) fail(`不明な引数です: ${token}`);

		const equalsAt = token.indexOf('=');
		const name = token.slice(2, equalsAt === -1 ? undefined : equalsAt);
		if (!valueOptions.has(name)) fail(`不明なオプションです: --${name}`);
		const value = equalsAt === -1 ? argv[++index] : token.slice(equalsAt + 1);
		if (!value || value.startsWith('--')) fail(`--${name} の値が必要です`);
		options[name] = value;
	}

	return options;
}

async function sha256(filePath) {
	const buffer = await readFile(filePath);
	return createHash('sha256').update(buffer).digest('hex');
}

function formatBytes(bytes) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
	return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	if (options.help) {
		console.log(HELP);
		return;
	}
	if (!options.input || !options.output || !options.mode) {
		fail('--input、--output、--mode は必須です。--help で使い方を確認できます');
	}
	if (!['hero', 'body'].includes(options.mode)) fail('--mode は hero または body を指定してください');
	if (!POSITION_VALUES.has(options.position)) fail(`sharpで使用できない --position です: ${options.position}`);

	const quality = Number(options.quality);
	if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
		fail('--quality は1〜100の整数で指定してください');
	}

	const inputPath = path.resolve(options.input);
	const outputPath = path.resolve(options.output);
	if (inputPath === outputPath) fail('入力ファイル自身は上書きできません');
	if (!/\.jpe?g$/i.test(outputPath)) fail('出力拡張子は .jpg または .jpeg にしてください');

	let inputStats;
	try {
		inputStats = await stat(inputPath);
	} catch {
		fail(`入力ファイルが見つかりません: ${inputPath}`);
	}
	if (!inputStats.isFile()) fail(`入力が通常ファイルではありません: ${inputPath}`);

	try {
		await stat(outputPath);
		if (!options.force) fail(`出力ファイルが既にあります。上書きする場合は --force を付けてください: ${outputPath}`);
	} catch (error) {
		if (error?.code !== 'ENOENT') throw error;
	}

	await mkdir(path.dirname(outputPath), { recursive: true });

	// 透過PNGは白背景へ合成してからRGB化する。removeAlpha()だけだと、
	// 透明部分の元画素色がそのままJPEGへ出ることがある。
	let pipeline = sharp(inputPath).rotate().flatten({ background: '#ffffff' }).toColourspace('srgb');
	if (options.mode === 'hero') {
		pipeline = pipeline.resize(1200, 675, {
			fit: 'cover',
			position: options.position,
		});
	} else {
		pipeline = pipeline.resize({
			width: 1200,
			height: 1200,
			fit: 'inside',
			withoutEnlargement: true,
		});
	}

	await pipeline.jpeg({ quality, chromaSubsampling: '4:2:0' }).toFile(outputPath);
	const [metadata, outputStats, digest] = await Promise.all([
		sharp(outputPath).metadata(),
		stat(outputPath),
		sha256(outputPath),
	]);

	if (metadata.format !== 'jpeg' || metadata.space !== 'srgb' || metadata.channels !== 3) {
		fail(`出力画像がRGB JPEGではありません: format=${metadata.format}, space=${metadata.space}, channels=${metadata.channels}`);
	}

	console.log('画像変換完了');
	console.log(`  mode   : ${options.mode}`);
	console.log(`  output : ${outputPath}`);
	console.log(`  size   : ${metadata.width}x${metadata.height}`);
	console.log(`  bytes  : ${formatBytes(outputStats.size)} (${outputStats.size} bytes)`);
	console.log(`  sha256 : ${digest}`);
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
