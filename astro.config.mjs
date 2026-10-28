// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeAffiliateSearch from './scripts/rehype-affiliate-search.mjs';

// サイト内で使う補助画面は残し、検索結果向けのサイトマップからだけ除外する。
const nonIndexablePaths = new Set(['/search', '/contact/thanks']);

// https://astro.build/config
export default defineConfig({
	site: 'https://kakifoi.net',
	integrations: [mdx(), sitemap({
		filter: (page) => !nonIndexablePaths.has(new URL(page).pathname.replace(/\/+$/, '')),
	})],
	markdown: { rehypePlugins: [rehypeAffiliateSearch] },
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
