import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBlogmuraItems } from '../src/utils/rssBlogmura.mjs';

function makePost(day) {
	return {
		id: `post-${day}`,
		body: '本文はRSSに含めない',
		data: {
			title: `記事 ${day}：元のタイトル`,
			description: `記事 ${day} の説明`,
			pubDate: new Date(`2026-10-${String(day).padStart(2, '0')}T09:00:00+09:00`),
			updatedDate: new Date('2026-11-01T00:00:00Z'),
			heroImage: '/images/example.jpg',
			heroImageAlt: '画像の説明',
			category: '子育て・日常',
			tags: ['日常'],
			content: '<p>本文や画像を含めない</p>',
			customData: '<extra>追加データ</extra>',
		},
	};
}

test('keeps only the latest 20 posts, sorting before limiting', () => {
	const posts = Array.from({ length: 25 }, (_, index) => makePost(index + 1));
	const items = buildBlogmuraItems(posts);
	assert.equal(items.length, 20);
	assert.deepEqual(items.map((item) => item.link),
		Array.from({ length: 20 }, (_, index) => `/blog/post-${25 - index}/`));
});

test('orders an unsorted input by publication date descending', () => {
	const posts = [makePost(12), makePost(3), makePost(25), makePost(18)];
	assert.deepEqual(buildBlogmuraItems(posts).map((item) => item.pubDate),
		[posts[2], posts[3], posts[0], posts[1]].map((post) => post.data.pubDate));
});

test('does not mutate the input array or source posts', () => {
	const posts = [makePost(2), makePost(19), makePost(8)];
	const before = structuredClone(posts);
	for (const post of posts) {
		Object.freeze(post.data.tags);
		Object.freeze(post.data);
		Object.freeze(post);
	}
	Object.freeze(posts);
	buildBlogmuraItems(posts);
	assert.deepEqual(posts, before);
});

test('preserves the original titles, descriptions, publication dates and existing link format', () => {
	const posts = [makePost(4), makePost(16)];
	posts[1].id = 'nested/日本語の記事';
	posts[1].data.title = '  元のタイトル & <テスト>  ';
	for (const item of buildBlogmuraItems(posts)) {
		const post = posts.find((entry) => item.link === `/blog/${entry.id}/`);
		assert.ok(post);
		assert.equal(item.title, post.data.title);
		assert.equal(item.description, post.data.description);
		assert.strictEqual(item.pubDate, post.data.pubDate);
		assert.equal(item.link, `/blog/${post.id}/`);
	}
});

test('passes only title, description, pubDate and link to RSS', () => {
	const [item] = buildBlogmuraItems([makePost(1)]);
	assert.deepEqual(Object.keys(item).sort(), ['description', 'link', 'pubDate', 'title']);
});

test('handles empty input and keeps all posts when there are at most 20', () => {
	for (const count of [0, 1, 19, 20]) {
		const posts = Array.from({ length: count }, (_, index) => makePost(index + 1));
		assert.equal(buildBlogmuraItems(posts).length, count);
	}
});

test('keeps the original relative order when publication dates are equal', () => {
	const posts = [makePost(9), makePost(9)];
	posts[0].id = 'same-date-first';
	posts[1].id = 'same-date-second';
	assert.deepEqual(buildBlogmuraItems(posts).map((item) => item.link),
		['/blog/same-date-first/', '/blog/same-date-second/']);
});
