import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { parse } from 'parse5';
import { articleFooter, articleFooterGuides, footerParts, validateArticleFooter } from './article-footer.mjs';
import rehypeAffiliateSearch from './rehype-affiliate-search.mjs';

const dir = new URL('../src/content/blog/', import.meta.url);
const files = readdirSync(dir).filter((name) => /\.mdx?$/.test(name));
const ending = (slug = '') => `---\n\n${footerParts(slug).join('\n\n')}`;

test('unconfigured and same-category articles have no product fallback', async () => {
	for (const slug of ['new-food-article', 'new-game-article', 'unknown']) {
		assert.deepEqual(footerParts(slug), [articleFooter.thanks, articleFooter.notice]);
		const source = `本文には紹介商品がない。\n\n${ending(slug)}`;
		validateArticleFooter(source, slug);
		const processor = await createMarkdownProcessor({ rehypePlugins: [rehypeAffiliateSearch] });
		const html = (await processor.render(source, { frontmatter: { category: 'グルメ', tags: ['焼肉'] } })).code;
		assert.doesNotMatch(html, /product-card|article-footer-(intro|action|cta)|recommended-products|<h[2-6]/);
		assert.equal((html.match(/data-pagefind-ignore/g) ?? []).length, 2);
	}
});

test('an old global product guide cannot silently return on an unreviewed article', () => {
	const source = `本文。\n\n---\n\n${articleFooter.thanks}\n\n家で焼肉を楽しみたい方へ。\n\n[商品を見る](/#recommended-products)\n\n${articleFooter.notice}`;
	assert.throws(() => validateArticleFooter(source, 'unreviewed'), /未設定時に商品を補充せず/);
});

test('CRLF is equivalent to LF, but a Setext heading is not a footer divider', () => {
	const source = `本文。\n\n${ending()}`;
	assert.doesNotThrow(() => validateArticleFooter(source.replaceAll('\n', '\r\n'), 'new-article'));
	assert.throws(() => validateArticleFooter(source.replace('本文。\n\n---', '本文。\n---'), 'new-article'), /末尾案内が共通データと不一致/);
});

test('postcheck rejects a missing approved guide instead of downgrading it to a warning', () => {
	const script = `
import runpy
from pathlib import Path
ns = runpy.run_path('scripts/postcheck.py')
source = Path('src/content/blog/amaike-yakiniku-2026.md').read_text()
source = source.split('\\n最後まで読んでいただき、ありがとうございます。')[0]
class Article:
    stem = 'amaike-yakiniku-2026'
    def read_text(self, encoding): return source
errors, _, _ = ns['check_article'](Article(), {})
assert any('記事末尾に案内が無い' in e for e in errors), errors
`;
	execFileSync('python3', ['-c', script], { cwd: new URL('..', import.meta.url) });
});

test('all article endings and explicitly selected guides match their source evidence', () => {
	for (const file of files) {
		const slug = file.replace(/\.mdx?$/, '');
		validateArticleFooter(readFileSync(new URL(file, dir), 'utf8'), slug);
	}
	for (const [slug, guide] of Object.entries(articleFooterGuides)) {
		assert.ok(files.includes(`${slug}.md`), slug);
		assert.ok(guide.reason.length > 10, slug);
		assert.ok(guide.evidence.every((text) => text.length > 10), slug);
		assert.ok(guide.href.startsWith('/') && !guide.href.startsWith('//'), slug);
		assert.throws(() => validateArticleFooter(`根拠のない本文。\n\n${ending(slug)}`, slug), /本文中の根拠/);
	}
});

test('reviewed product guides render only on their explicit article, without hiding body links', async () => {
	const processor = await createMarkdownProcessor({ rehypePlugins: [rehypeAffiliateSearch] });
	for (const [slug, guide] of Object.entries(articleFooterGuides)) {
		const source = readFileSync(new URL(`${slug}.md`, dir), 'utf8');
		const result = (await processor.render(source, { fileURL: new URL(`${slug}.md`, dir) })).code;
		assert.equal((result.match(/class="article-footer-cta"/g) ?? []).length, 1, slug);
		assert.ok(result.includes(guide.linkText), slug);
		assert.equal((result.match(/data-pagefind-ignore/g) ?? []).length, 4, slug);
	}
});

function nodes(root) { return [root, ...(root.childNodes ?? []).flatMap(nodes)]; }
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const hasClass = (node, name) => (attr(node, 'class') ?? '').split(/\s+/).includes(name);

test('built examples retain the real product or remove the entire unrelated product area', () => {
	for (const [slug, expectedCards] of [['az4u-wireless-chime', 1], ['wisdom-tooth-extraction-pain-swelling', 0]]) {
		const file = new URL(`../dist/blog/${slug}/index.html`, import.meta.url);
		assert.ok(existsSync(file), 'Run the build before this rendered-output test');
		const all = nodes(parse(readFileSync(file, 'utf8')));
		const prose = all.find((n) => hasClass(n, 'prose'));
		const content = nodes(prose);
		assert.equal(content.filter((n) => hasClass(n, 'product-card')).length, expectedCards, slug);
		assert.equal(content.filter((n) => hasClass(n, 'article-footer-cta')).length, 0, slug);
		assert.equal(content.filter((n) => hasClass(n, 'article-footer-intro') || hasClass(n, 'article-footer-action')).length, 0, slug);
		assert.ok(all.some((n) => hasClass(n, 'affiliate-notice')), slug);
	}
});
