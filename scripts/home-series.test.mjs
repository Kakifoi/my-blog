import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { getHomeSeries } from '../src/data/home-series.mjs';

// Read source only. No build, dist files, network requests, or browser required.
const expected = [
	{
		id: 'nasu-family-trip', title: '那須の家族旅行',
		ids: ['nasu-family-trip-day-one', 'nasu-highland-park-family-trip'],
		labels: ['1日目｜どうぶつ王国とホテル', '2日目｜那須ハイランドパーク'],
	},
	{
		id: 'wisdom-tooth-extraction', title: '親知らずの抜歯記録',
		ids: ['fukaya-nisseki-wisdom-tooth-extraction', 'wisdom-tooth-extraction-pain-swelling', 'wisdom-tooth-suture-removal'],
		labels: ['抜歯当日のこと', '抜歯後の痛みと腫れ', '1週間後の抜糸'],
	},
];
const posts = await Promise.all(expected.flatMap((group) => group.ids).map(async (id) => ({
	id,
	data: parseFrontmatter(await readFile(new URL(`../src/content/blog/${id}.md`, import.meta.url), 'utf8')).frontmatter,
})));
const sidebar = await readFile(new URL('../src/components/HomeSidebar.astro', import.meta.url), 'utf8');

test('the two complete series resolve real posts in the requested chronological order, not input order', () => {
	const groups = getHomeSeries([...posts].reverse());
	assert.deepEqual(groups.map(({ id, title }) => ({ id, title })), expected.map(({ id, title }) => ({ id, title })));
	for (const [index, group] of groups.entries()) {
		assert.deepEqual(group.links.map(({ post }) => post.id), expected[index].ids);
		assert.deepEqual(group.links.map(({ label }) => label), expected[index].labels);
		const dates = group.links.map(({ post }) => new Date(post.data.pubDate).valueOf());
		assert.ok(dates.every(Number.isFinite));
		assert.deepEqual(dates, [...dates].sort((a, b) => a - b));
		for (const { post } of group.links) {
			assert.strictEqual(post, posts.find((source) => source.id === post.id), 'keep the actual post and full title');
			assert.ok(post.data.title.trim());
		}
	}
});

test('any missing article skips its entire group while preserving the other complete group', () => {
	for (const [index, group] of expected.entries()) {
		for (const missing of group.ids) {
			const remaining = getHomeSeries(posts.filter((post) => post.id !== missing));
			assert.deepEqual(remaining.map(({ id }) => id), [expected[1 - index].id], missing);
		}
	}
	assert.deepEqual(getHomeSeries([]), []);
	assert.deepEqual(getHomeSeries(posts.filter((post) => !expected.some((group) => group.ids[0] === post.id))), []);
});

test('missing, blank, or non-text full titles cannot produce partial groups or fabricated links', () => {
	for (const title of [undefined, null, '', ' \t ', 123]) {
		const input = posts.map((post, index) => index === 0 ? { ...post, data: { ...post.data, title } } : post);
		assert.deepEqual(getHomeSeries(input).map(({ id }) => id), ['wisdom-tooth-extraction']);
	}
	const input = posts.map((post, index) => index === 0 ? { id: post.id } : post);
	assert.deepEqual(getHomeSeries(input).map(({ id }) => id), ['wisdom-tooth-extraction']);
});

test('selection does not mutate supplied posts or share editable group definitions across calls', () => {
	const input = Object.freeze(posts.map((post) => Object.freeze({ ...post, data: Object.freeze({ ...post.data }) })));
	const before = structuredClone(input);
	const first = getHomeSeries(input);
	assert.deepEqual(input, before);
	assert.strictEqual(first[0].links[0].post, input[0]);
	first[0].title = 'changed';
	first[0].links[0].label = 'changed';
	first[0].links.reverse();
	const again = getHomeSeries(input);
	assert.equal(again[0].title, expected[0].title);
	assert.deepEqual(again[0].links.map(({ label }) => label), expected[0].labels);
});

test('duplicate sponsor promotion and recents code/CSS are removed; one red recommendation link remains', () => {
	assert.doesNotMatch(sidebar, /sponsor-guide|sponsor-title|Sponsored Link|home-products-cta|latestPosts|dateText|recent-posts|最近の投稿|profile-opening/);
	const banners = [...sidebar.matchAll(/<a class="sidebar-banner" href="([^"]+)"/g)];
	assert.equal(banners.length, 1);
	assert.equal(banners[0][1], '/#recommended-products');
	assert.match(sidebar, /\.sidebar-banner\s*\{[^}]*background: #CC0000;/);
});

test('profile uses two factual paragraphs and keeps the avatar, identity, profile button and social links', () => {
	const copy = sidebar.match(/<div class="profile-copy">([\s\S]*?)<\/div>/)?.[1];
	assert.ok(copy);
	assert.deepEqual([...copy.matchAll(/<p>(.*?)<\/p>/g)].map(([, text]) => text), [
		'妻と子供2人の4人家族。育児・家事と仕事をしながら、日常をつづっています。',
		'熊谷・深谷の食べ歩き、子供とのおでかけや家族旅行、買って使ったものの感想、ゲームやジョギングの記録を紹介しています。',
	]);
	assert.doesNotMatch(copy, /<ul|<li|<br/);
	assert.match(sidebar, /class="profile-avatar"><img src="\/images\/profile\.png"/);
	assert.match(sidebar, /<h2 id="profile-name">カキフォイ<\/h2>/);
	assert.match(sidebar, /<p class="profile-subtitle">埼玉在住、2児の父<\/p>/);
	assert.match(sidebar, /<a class="profile-button" href="\/about\/">プロフィール<\/a>/);
	const social = sidebar.match(/<div class="profile-social">([\s\S]*?)<\/div>/)?.[1];
	assert.ok(social);
	for (const href of ['https://x.com/amekagari', '{instagramUrl}', '/contact/', '/rss.xml']) assert.ok(social.includes(href), href);
	assert.match(sidebar, /const instagramUrl = 'https:\/\/www\.instagram\.com\/kakifoi_blog\/';/);
});

test('series are shared with archives, hide the empty widget, and expose short labels plus actual full titles', () => {
	assert.match(sidebar, /const series = getHomeSeries\(posts\);/);
	const sharedSidebar = sidebar.replace(/\{showBlogmuraRanking && \(\s*<>[\s\S]*?<\/>\s*\)\}/, '');
	assert.match(sharedSidebar, /\{series\.length > 0 && \(/);
	assert.match(sharedSidebar, /<h2 class="widget-title" id="sidebar-series-title">続けて読める体験記<\/h2>/);
	assert.match(sharedSidebar, /aria-labelledby="sidebar-series-title"/);
	assert.match(sharedSidebar, /<section class="series-card" aria-labelledby=\{`sidebar-series-\$\{group\.id\}`\}>/);
	assert.match(sharedSidebar, /<ol class="series-links" role="list">/);
	assert.match(sharedSidebar, /href=\{`\/blog\/\$\{post\.id\}\/`\} aria-label=\{`\$\{label\}：\$\{post\.data\.title\}`\} title=\{post\.data\.title\}><span>\{label\}<\/span>/);
});

test('series cards provide red accents, at least 44px targets, wrapping text and visible keyboard focus', () => {
	assert.match(sidebar, /\.series-card\s*\{[^}]*border-top: 3px solid #CC0000;/);
	assert.match(sidebar, /\.series-links a\s*\{[^}]*min-height: 44px;[^}]*overflow-wrap: anywhere;/);
	assert.match(sidebar, /\.series-links a > span:first-child\s*\{ min-width: 0; \}/);
	assert.match(sidebar, /\.series-links a:focus-visible\s*\{[^}]*outline: 2px solid #CC0000;/);
});
