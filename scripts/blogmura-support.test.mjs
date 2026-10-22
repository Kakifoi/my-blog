import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseFragment } from 'parse5';

// Source-only checks: never open or click Blogmura links, or request external assets.
const support = await readFile(new URL('../src/components/BlogmuraSupport.astro', import.meta.url), 'utf8');
const elements = (node, tagName) => [
	...(node.tagName === tagName ? [node] : []),
	...(node.childNodes ?? []).flatMap((child) => elements(child, tagName)),
];
const attribute = (node, name) => node?.attrs?.find((attr) => attr.name === name)?.value;
const tree = parseFragment(support);
const links = elements(tree, 'a');
const followLink = links.find((link) => attribute(link, 'class') === 'follow-link');
const inUrl = 'https://blogmura.com/ranking/in?p_cid=11218995';
const followUrl = 'https://blogmura.com/profiles/11218995/?p_cid=11218995&reader=11218995';

test('support uses the issued general Blogmura IN link and badge, not a regional claim', () => {
	assert.match(support, /href="https:\/\/blogmura\.com\/ranking\/in\?p_cid=11218995"/);
	assert.match(support, /src="https:\/\/b\.blogmura\.com\/banner-blogmura-landscape\.svg" width="120" height="33"/);
	assert.match(support, /aria-label="にほんブログ村で応援する（新しいタブで開きます）"/);
	assert.doesNotMatch(support, /埼玉県情報|localkantou|saitama/);
});

test('support keeps external link safety, referrer, accessible labeling, and search exclusion', () => {
	assert.equal(links.length, 2);
	for (const link of links) {
		assert.equal(attribute(link, 'target'), '_blank');
		assert.equal(attribute(link, 'rel'), 'noopener');
		assert.match(attribute(link, 'aria-label'), /新しいタブで開きます/);
		assert.equal(attribute(link, 'aria-hidden'), undefined);
		assert.equal(attribute(link, 'tabindex'), undefined, 'links stay in the normal keyboard tab order');
	}
	assert.doesNotMatch(support, /noreferrer/);
	assert.match(support, /alt="ブログランキング・にほんブログ村へ"/);
	const [section] = elements(tree, 'section');
	assert.equal(attribute(section, 'aria-label'), 'にほんブログ村で応援・フォロー');
	assert.equal(attribute(section, 'data-pagefind-ignore'), '');
	assert.match(support, /min-height: 44px/);
	assert.match(support, /:focus-visible/);
});

test('follow uses the full issued URL exactly once, after the unchanged IN link', () => {
	assert.deepEqual(links.map((link) => attribute(link, 'href')), [inUrl, followUrl]);
	assert.equal(support.split(followUrl).length - 1, 1, 'the issued URL is neither shortened nor duplicated');
	assert.equal(attribute(followLink, 'href'), followUrl);
});

test('follow has one official reader badge and retains the existing support badge', () => {
	const images = elements(tree, 'img');
	assert.deepEqual(images.map((img) => attribute(img, 'src')), [
		'https://b.blogmura.com/banner-blogmura-landscape.svg',
		'https://b.blogmura.com/banner-blogmura-reader-white-small.svg',
	]);
	assert.ok(followLink);
	const badges = elements(followLink, 'img');
	assert.equal(badges.length, 1);
	assert.equal(attribute(badges[0], 'width'), '160');
	assert.equal(attribute(badges[0], 'height'), '36');
	assert.equal(attribute(badges[0], 'alt'), 'ブログ村でフォロー');
	assert.equal(attribute(badges[0], 'decoding'), 'async');
	assert.equal(attribute(followLink, 'aria-label'), 'ブログ村でフォロー（新しいタブで開きます）');
});

test('follow explains its update-reading purpose separately below the support action', () => {
	assert.match(support, /<div class="follow-entry">\s*<p class="follow-message">更新を見逃したくない方へ<\/p>\s*<a class="follow-link"/);
	assert.match(support, /\.follow-entry\s*\{[^}]*border-top: 1px solid #e6caca;/);
	assert.doesNotMatch(attribute(followLink, 'aria-label'), /応援|投票/);
	assert.match(support, /<span aria-hidden="true">↗<\/span>\s*<\/a>\s*<\/div>/);
});

test('follow keeps a 44px tap target, visible keyboard focus, and red-toned styling', () => {
	const rule = support.match(/\.follow-link\s*\{([^}]+)\}/)?.[1];
	assert.ok(rule);
	assert.match(rule, /display: inline-flex;/);
	assert.match(rule, /min-width: 44px;/);
	assert.match(rule, /min-height: 44px;/);
	assert.match(rule, /box-sizing: border-box;/);
	assert.match(rule, /color: #a00;/);
	assert.match(support, /\.follow-link:focus-visible\s*\{[^}]*outline: 3px solid #a00;[^}]*outline-offset: 4px;/);
});

test('support adds no PV widget, external script, embedded page, or automatic navigation', () => {
	assert.doesNotMatch(support, /BlogmuraRanking|parts_view\.js|data-type=["']pv["']|<script\b|<iframe\b|on(?:click|load|focus)\s*=/i);
});
