import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';

// Source-only checks: no build, dist files, browser, or external requests required.
// BlogmuraSupport.astro is supplied separately; only its no-props call sites are checked here.
const sourceRoot = new URL('../src/', import.meta.url);
const files = (await readdir(sourceRoot, { recursive: true })).filter((file) => file.endsWith('.astro'));
const sources = new Map(await Promise.all(files.map(async (file) => [
	file, (await readFile(new URL(file, sourceRoot), 'utf8')).replace(/<!--[\s\S]*?-->/g, ''),
])));
const sidebar = sources.get('components/HomeSidebar.astro');
const footer = sources.get('components/Footer.astro');
const home = sources.get('pages/index.astro');
const article = sources.get('layouts/BlogPost.astro');
const calls = (source, component) => [...source.matchAll(new RegExp(`<${component}\\b[^>]*\\/>`, 'g'))].map(([call]) => call);

test('home-only sidebar block shows one no-props support banner after the profile, excluded from search', () => {
	assert.match(sidebar, /import BlogmuraSupport from '\.\/BlogmuraSupport\.astro';/);
	assert.deepEqual(calls(sidebar, 'BlogmuraSupport'), ['<BlogmuraSupport />']);
	assert.match(sidebar, /<section class="profile-widget"[\s\S]*?<\/section>\s*\{showBlogmuraRanking && \(\s*<>\s*<div class="sidebar-blogmura-support" data-pagefind-ignore>\s*<BlogmuraSupport \/>\s*<\/div>/);
});

test('shared article layout puts support immediately after prose, outside searchable article text', () => {
	assert.match(article, /import BlogmuraSupport from '\.\.\/components\/BlogmuraSupport\.astro';/);
	assert.deepEqual(calls(article, 'BlogmuraSupport'), ['<BlogmuraSupport />']);
	assert.match(article, /<article data-pagefind-body>/);
	assert.match(article, /<div class="prose">\s*<slot \/>\s*<\/div>\s*<div class="article-blogmura-support" data-pagefind-ignore>\s*<BlogmuraSupport \/>\s*<\/div>/);
});

test('PV switches default to sidebar off and footer on, and gate their only ranking instance', () => {
	for (const source of [sidebar, footer]) {
		assert.match(source, /showBlogmuraRanking\?: boolean;/);
		assert.match(source, /import BlogmuraRanking from '\.\/BlogmuraRanking\.astro';/);
		assert.deepEqual(calls(source, 'BlogmuraRanking'), ['<BlogmuraRanking />']);
	}
	assert.match(sidebar, /const \{ posts, showBlogmuraRanking = false \} = Astro\.props;/);
	assert.match(footer, /const \{ showBlogmuraRanking = true \} = Astro\.props;/);
	assert.match(sidebar, /\{showBlogmuraRanking && \(\s*<>\s*<div class="sidebar-blogmura-support" data-pagefind-ignore>\s*<BlogmuraSupport \/>\s*<\/div>\s*<div class="sidebar-widget sidebar-blogmura-ranking" data-pagefind-ignore>\s*<BlogmuraRanking \/>\s*<\/div>\s*<\/>\s*\)\}/);
	assert.match(footer, /\{showBlogmuraRanking && <BlogmuraRanking \/>\}/);
	assert.match(footer, /<footer class="site-footer" data-pagefind-ignore>/);
});

test('home enables sidebar PV after support and disables footer PV, giving exactly one instance', () => {
	assert.deepEqual(calls(home, 'HomeSidebar'), ['<HomeSidebar posts={posts} showBlogmuraRanking={true} />']);
	assert.deepEqual(calls(home, 'Footer'), ['<Footer showBlogmuraRanking={false} />']);
	assert.match(sidebar, /<BlogmuraSupport \/>\s*<\/div>\s*<div class="sidebar-widget sidebar-blogmura-ranking" data-pagefind-ignore>\s*<BlogmuraRanking \/>\s*<\/div>\s*<\/>\s*\)\}\s*<a class="sidebar-banner"/);
});

test('archives add no support banner and keep the default single footer PV', () => {
	const homeOnlyBlock = sidebar.match(/\{showBlogmuraRanking && \(\s*<>[\s\S]*?<\/>\s*\)\}/)?.[0];
	assert.ok(homeOnlyBlock, 'support and PV share the home-only condition');
	assert.deepEqual(calls(homeOnlyBlock, 'BlogmuraSupport'), ['<BlogmuraSupport />']);
	assert.deepEqual(calls(homeOnlyBlock, 'BlogmuraRanking'), ['<BlogmuraRanking />']);
	const archiveSidebar = sidebar.replace(homeOnlyBlock, '');
	assert.deepEqual(calls(archiveSidebar, 'BlogmuraSupport'), [], 'no support outside the home-only block');
	assert.deepEqual(calls(archiveSidebar, 'BlogmuraRanking'), [], 'no PV outside the home-only block');
	const archive = sources.get('layouts/BlogArchive.astro');
	assert.deepEqual(calls(archive, 'HomeSidebar'), ['<HomeSidebar posts={allPosts} />']);
	assert.deepEqual(calls(archive, 'Footer'), ['<Footer />']);
	for (const [file, source] of sources) {
		if (file === 'pages/index.astro') continue;
		const sidebars = calls(source, 'HomeSidebar');
		const footers = calls(source, 'Footer');
		assert.ok(sidebars.length <= 1, `${file}: at most one sidebar`);
		assert.ok(footers.length <= 1, `${file}: at most one footer`);
		for (const call of sidebars) assert.doesNotMatch(call, /showBlogmuraRanking|\.\.\./, file);
		for (const call of footers) assert.equal(call, '<Footer />', file);
		if (sidebars.length) assert.equal(footers.length, 1, `${file}: archive PV stays in footer`);
	}
});

test('support is limited to home and article call sites; PV and external script have no extra placements', () => {
	assert.deepEqual([...sources].filter(([, source]) => /<BlogmuraSupport\b/.test(source)).map(([file]) => file).sort(), [
		'components/HomeSidebar.astro', 'layouts/BlogPost.astro',
	]);
	assert.deepEqual([...sources].filter(([, source]) => /<BlogmuraRanking\b/.test(source)).map(([file]) => file).sort(), [
		'components/Footer.astro', 'components/HomeSidebar.astro',
	]);
	assert.deepEqual([...sources].filter(([, source]) => /parts_view\.js|data-type="pv"/.test(source)).map(([file]) => file), [
		'components/BlogmuraRanking.astro',
	]);
});

test('all published article routes continue through the shared layout without per-post edits', () => {
	const route = sources.get('pages/blog/[...slug].astro');
	assert.match(route, /const posts = await getCollection\('blog'\);\s*return posts\.map\(/);
	assert.match(route, /import BlogPost from '\.\.\/\.\.\/layouts\/BlogPost\.astro';/);
	assert.match(route, /<BlogPost \{\.\.\.post\.data\}>\s*<Content \/>\s*<\/BlogPost>/);
	assert.equal(calls(article, 'slot').length, 1);
	assert.deepEqual(calls(article, 'Footer'), ['<Footer />']);
});

test('home footer has a two-column variant that still collapses to one column at 375px', () => {
	assert.match(footer, /class:list=\{\['footer-widgets', \{ 'footer-widgets--two-columns': !showBlogmuraRanking \}\]\}/);
	assert.match(footer, /\.footer-widgets--two-columns\s*\{\s*grid-template-columns: minmax\(0, 1\.15fr\) minmax\(0, 0\.9fr\);\s*\}/);
	const desktop = footer.indexOf('.footer-widgets--two-columns {');
	const mobile = footer.indexOf('@media (max-width: 900px)');
	assert.ok(desktop >= 0 && mobile > desktop, 'mobile rule overrides both desktop variants');
	assert.match(footer.slice(mobile), /\.footer-widgets\s*\{\s*grid-template-columns: minmax\(0, 1fr\);/);
});
