import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'parse5';

// Inspect the completed build. This test must never trigger another full build.
const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
const walk = (node, predicate) => [
	...(predicate(node) ? [node] : []),
	...(node.childNodes ?? []).flatMap((child) => walk(child, predicate)),
];
const hasClass = (node, name) => (attr(node, 'class') ?? '').split(/\s+/).includes(name);
const expectedSeries = [
	'nasu-family-trip-day-one', 'nasu-highland-park-family-trip',
	'fukaya-nisseki-wisdom-tooth-extraction', 'wisdom-tooth-extraction-pain-swelling', 'wisdom-tooth-suture-removal',
];

for (const route of ['index.html', 'blog/index.html', 'categories/子育て・日常/index.html']) {
	test(`${route}: sidebar removes duplicate latest posts and leaves one product-guide CTA`, async () => {
		const dom = parse(await readFile(new URL(`../dist/${route}`, import.meta.url), 'utf8'));
		const sidebar = walk(dom, (node) => hasClass(node, 'home-sidebar'));
		assert.equal(sidebar.length, 1);
		const copy = text(sidebar[0]);
		assert.doesNotMatch(copy, /最近の投稿|Sponsored Link/);
		assert.match(copy, /続けて読める体験記/);
		assert.match(copy, /那須の家族旅行/);
		assert.match(copy, /親知らずの抜歯記録/);
		const anchors = walk(sidebar[0], (node) => node.tagName === 'a');
		assert.equal(anchors.filter((node) => attr(node, 'href') === '/#recommended-products').length, 1);
		for (const id of expectedSeries) {
			assert.equal(anchors.filter((node) => attr(node, 'href') === `/blog/${id}/`).length, 1, id);
			assert.ok((await stat(new URL(`../dist/blog/${id}/index.html`, import.meta.url))).isFile(), id);
		}
		const profile = walk(sidebar[0], (node) => hasClass(node, 'profile-copy'))[0];
		assert.ok(profile);
		assert.equal(walk(profile, (node) => node.tagName === 'p').length, 1);
		assert.ok(text(profile).trim().length >= 100 && text(profile).trim().length <= 150, 'profile stays a concise introduction');
		const social = walk(sidebar[0], (node) => hasClass(node, 'profile-social-link'));
		assert.equal(social.length, 2);
		assert.deepEqual(social.map((node) => attr(node, 'href')), ['https://x.com/amekagari', 'https://www.instagram.com/kakifoi_blog/']);
		for (const link of social) {
			assert.ok(walk(link, (node) => node.tagName === 'strong').some((node) => text(node).trim()));
			assert.equal(attr(link, 'target'), '_blank');
			assert.match(attr(link, 'rel'), /noopener/);
		}
		const topicTags = walk(sidebar[0], (node) => hasClass(node, 'sidebar-tags'))[0];
		assert.ok(walk(topicTags, (node) => node.tagName === 'a').length <= 18);
		assert.equal(walk(dom, (node) => attr(node, 'data-type') === 'pv').length, 1, 'PV is never duplicated');
		assert.equal(walk(sidebar[0], (node) => attr(node, 'data-type') === 'pv').length, 0, 'ranking is not in the sidebar');
		const footer = walk(dom, (node) => hasClass(node, 'site-footer'))[0];
		assert.ok(footer);
		assert.equal(walk(footer, (node) => attr(node, 'data-type') === 'pv').length, 1, 'ranking appears once inside the pink footer');
	});
}

for (const route of ['index.html', 'blog/wisdom-tooth-suture-removal/index.html']) {
	test(`${route}: general Blogmura banner renders with the correct tracking ID`, async () => {
		const dom = parse(await readFile(new URL(`../dist/${route}`, import.meta.url), 'utf8'));
		const support = walk(dom, (node) => hasClass(node, 'blogmura-support'));
		assert.equal(support.length, 1);
		assert.doesNotMatch(text(support[0]), /埼玉県情報/);
		const link = walk(support[0], (node) => node.tagName === 'a')[0];
		assert.equal(attr(link, 'href'), 'https://blogmura.com/ranking/in?p_cid=11218995');
		const image = walk(link, (node) => node.tagName === 'img')[0];
		assert.equal(attr(image, 'src'), 'https://b.blogmura.com/banner-blogmura-landscape.svg');
	});
}
