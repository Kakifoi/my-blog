#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const execFileAsync = promisify(execFile);
const HELP = `kakifoi.netの記事と画像が本番反映されるまで自動確認します。

使い方:
  npm run verify:production -- --slug <slug> [options]

必須:
  --slug <slug>       対象記事のスラッグ

オプション:
  --contains <text>   本番HTMLに含まれるべき記事固有文字列
  --image <path>      public配下のローカル画像
                       例: public/images/example.jpg, /images/example.jpg
  --timeout <秒>      最大待機時間（既定: 90）
  --interval <秒>     確認間隔（既定: 10）
  --help              このヘルプを表示

--contains または --image の少なくとも一方が必要です。
空コミットやpushは行いません。時間切れはexit code 1です。
`;

function fail(message) {
	console.error(`ERROR: ${message}`);
	process.exit(1);
}

function parseArgs(argv) {
	const options = { slug: undefined, contains: undefined, image: undefined, timeout: 90, interval: 10, help: false };
	const names = new Set(['slug', 'contains', 'image', 'timeout', 'interval']);
	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];
		if (token === '--help' || token === '-h') {
			options.help = true;
			continue;
		}
		if (!token.startsWith('--')) fail(`不明な引数です: ${token}`);
		const equalsAt = token.indexOf('=');
		const name = token.slice(2, equalsAt === -1 ? undefined : equalsAt);
		if (!names.has(name)) fail(`不明なオプションです: --${name}`);
		const value = equalsAt === -1 ? argv[++index] : token.slice(equalsAt + 1);
		if (!value || value.startsWith('--')) fail(`--${name} の値が必要です`);
		options[name] = value;
	}
	return options;
}

function sha256(buffer) {
	return createHash('sha256').update(buffer).digest('hex');
}

function canonicalFromHtml(html) {
	const tags = html.match(/<link\b[^>]*>/gi) ?? [];
	for (const tag of tags) {
		if (!/\brel=["']canonical["']/i.test(tag)) continue;
		return tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
	}
	return undefined;
}

function inside(parent, child) {
	const relative = path.relative(parent, child);
	return relative !== '' && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

async function resolveImage(input) {
	let localPath;
	if (path.isAbsolute(input)) {
		localPath = input.startsWith('/images/') ? path.join(PUBLIC_DIR, input.replace(/^\/+/, '')) : path.resolve(input);
	} else if (input === 'public' || input.startsWith(`public${path.sep}`) || input.startsWith('public/')) {
		localPath = path.resolve(ROOT, input);
	} else {
		localPath = path.resolve(PUBLIC_DIR, input);
	}
	if (!inside(PUBLIC_DIR, localPath)) fail(`--image はpublic配下のファイルを指定してください: ${input}`);
	let fileStats;
	try {
		fileStats = await stat(localPath);
	} catch {
		fail(`ローカル画像が見つかりません: ${localPath}`);
	}
	if (!fileStats.isFile()) fail(`--image が通常ファイルではありません: ${localPath}`);
	const publicRelative = path.relative(PUBLIC_DIR, localPath).split(path.sep).map(encodeURIComponent).join('/');
	const buffer = await readFile(localPath);
	return {
		localPath,
		publicPath: `/${publicRelative}`,
		productionUrl: `https://kakifoi.net/${publicRelative}`,
		hash: sha256(buffer),
	};
}

function withCacheBuster(url, attempt) {
	const target = new URL(url);
	target.searchParams.set('_verify', `${Date.now()}-${attempt}`);
	return target;
}

async function fetchBuffer(url, attempt, deadline) {
	const remaining = Math.max(1, deadline - Date.now());
	const response = await fetch(withCacheBuster(url, attempt), {
		cache: 'no-store',
		signal: AbortSignal.timeout(remaining),
		headers: {
			'cache-control': 'no-cache, no-store, max-age=0',
			pragma: 'no-cache',
		},
	});
	if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
	return Buffer.from(await response.arrayBuffer());
}

async function sleep(milliseconds) {
	await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function parseGitHubRepository(remoteUrl) {
	const normalized = remoteUrl.trim().replace(/\.git$/i, '');
	const patterns = [
		/^https?:\/\/github\.com\/([^/]+)\/([^/]+)$/i,
		/^git@github\.com:([^/]+)\/([^/]+)$/i,
		/^ssh:\/\/git@github\.com\/([^/]+)\/([^/]+)$/i,
	];
	for (const pattern of patterns) {
		const match = normalized.match(pattern);
		if (match) return { owner: match[1], repository: match[2] };
	}
	throw new Error('originが対応するGitHubリポジトリ形式ではありません');
}

function statusInJapanese(status) {
	const labels = {
		queued: '待機中',
		in_progress: '処理中',
		completed: '完了',
		waiting: '待機中',
		pending: '保留中',
		requested: '開始待ち',
	};
	return labels[status] ?? '不明';
}

function conclusionInJapanese(conclusion) {
	if (!conclusion) return '未確定';
	const labels = {
		success: '成功',
		failure: '失敗',
		neutral: '中立',
		cancelled: 'キャンセル',
		skipped: 'スキップ',
		timed_out: 'タイムアウト',
		action_required: '要対応',
		stale: '無効',
		startup_failure: '開始失敗',
	};
	return labels[conclusion] ?? '不明';
}

async function diagnoseCloudflarePages() {
	const [{ stdout: headOutput }, { stdout: remoteOutput }] = await Promise.all([
		execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }),
		execFileAsync('git', ['remote', 'get-url', 'origin'], { cwd: ROOT, encoding: 'utf8' }),
	]);
	const head = headOutput.trim();
	if (!/^[0-9a-f]{40}$/i.test(head)) throw new Error('ローカルHEADコミットを取得できませんでした');
	const { owner, repository } = parseGitHubRepository(remoteOutput);
	const apiUrl = new URL(
		`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits/${head}/check-runs`,
	);
	apiUrl.searchParams.set('per_page', '100');
	const response = await fetch(apiUrl, {
		signal: AbortSignal.timeout(10_000),
		headers: {
			accept: 'application/vnd.github+json',
			'user-agent': 'kakifoi-verify-production',
			'x-github-api-version': '2022-11-28',
		},
	});
	if (!response.ok) throw new Error(`GitHub API: HTTP ${response.status} ${response.statusText}`);
	const result = await response.json();
	if (!Array.isArray(result.check_runs)) throw new Error('GitHub APIの応答形式が想定と異なります');

	const cloudflarePagesRuns = result.check_runs.filter(
		(run) => typeof run?.name === 'string' && run.name.toLowerCase().includes('cloudflare pages'),
	);
	console.error(`追加診断: ローカルHEAD ${head.slice(0, 7)} のCloudflare Pages状態`);
	if (cloudflarePagesRuns.length === 0) {
		console.error('  Cloudflare Pagesのcheck-runは見つかりませんでした。Workers Buildsは本番判定の対象外です。');
		return;
	}
	for (const run of cloudflarePagesRuns) {
		const status = typeof run.status === 'string' ? run.status : 'unknown';
		const conclusion = typeof run.conclusion === 'string' ? run.conclusion : null;
		const detailsUrl = typeof run.details_url === 'string' && run.details_url ? run.details_url : 'なし';
		console.error(`  ${run.name}`);
		console.error(`    状態 (status): ${status}（${statusInJapanese(status)}）`);
		console.error(`    結果 (conclusion): ${conclusion ?? 'null'}（${conclusionInJapanese(conclusion)}）`);
		console.error(`    詳細URL (details_url): ${detailsUrl}`);
	}
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	if (options.help) {
		console.log(HELP);
		return;
	}
	if (!options.slug) fail('--slug は必須です。--help で使い方を確認できます');
	if (!options.contains && !options.image) fail('--contains または --image の少なくとも一方を指定してください');
	if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(options.slug)) fail(`不正なslugです: ${options.slug}`);
	const timeoutSeconds = Number(options.timeout);
	const intervalSeconds = Number(options.interval);
	if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) fail('--timeout は0より大きい秒数で指定してください');
	if (!Number.isFinite(intervalSeconds) || intervalSeconds <= 0) fail('--interval は0より大きい秒数で指定してください');

	const articleUrl = `https://kakifoi.net/blog/${options.slug}/`;
	const expectedCanonical = articleUrl;
	const image = options.image ? await resolveImage(options.image) : undefined;
	const startedAt = Date.now();
	const deadline = startedAt + timeoutSeconds * 1000;
	let attempt = 0;
	let lastReason = '未確認';

	console.log(`本番確認を開始: ${articleUrl}`);
	if (image) console.log(`画像ハッシュも確認: ${image.productionUrl}`);

	do {
		attempt += 1;
		try {
			const articleBuffer = await fetchBuffer(articleUrl, attempt, deadline);
			const html = articleBuffer.toString('utf8');
			const canonical = canonicalFromHtml(html);
			if (canonical !== expectedCanonical) {
				lastReason = `canonical不一致 (${canonical ?? 'なし'})`;
			} else if (options.contains && !html.includes(options.contains)) {
				lastReason = `指定文字列が未反映 (${options.contains})`;
			} else if (image && !html.includes(image.publicPath) && !html.includes(image.productionUrl)) {
				lastReason = `記事HTMLに画像参照がありません (${image.publicPath})`;
			} else if (image) {
				const productionImage = await fetchBuffer(image.productionUrl, attempt, deadline);
				const productionHash = sha256(productionImage);
				if (productionHash !== image.hash) {
					lastReason = `画像ハッシュ未一致 (local=${image.hash.slice(0, 12)}, production=${productionHash.slice(0, 12)})`;
				} else {
					console.log(`OK: ${attempt}回目、${((Date.now() - startedAt) / 1000).toFixed(1)}秒で本番反映を確認`);
					console.log(`  canonical : ${canonical}`);
					console.log(`  image     : ${image.productionUrl}`);
					console.log(`  sha256    : ${image.hash}`);
					return;
				}
			} else {
				console.log(`OK: ${attempt}回目、${((Date.now() - startedAt) / 1000).toFixed(1)}秒で本番反映を確認`);
				console.log(`  canonical : ${canonical}`);
				if (options.contains) console.log(`  contains  : ${options.contains}`);
				return;
			}
		} catch (error) {
			lastReason = error instanceof Error ? error.message : String(error);
		}

		const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
		console.log(`待機: ${attempt}回目 (${elapsed}秒) - ${lastReason}`);
		if (Date.now() >= deadline) break;
		await sleep(Math.min(intervalSeconds * 1000, Math.max(0, deadline - Date.now())));
	} while (Date.now() <= deadline);

	const productionError = `本番反映を${timeoutSeconds}秒以内に確認できませんでした。最終状態: ${lastReason}`;
	try {
		await diagnoseCloudflarePages();
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		console.error(`追加診断不能: GitHub公開APIからCloudflare Pagesの状態を取得できませんでした。${reason}`);
	}
	fail(productionError);
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
