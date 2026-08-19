import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		category: z.enum([
			'グルメ',
			'旅行・おでかけ',
			'子育て・日常',
			'ゲーム・エンタメ',
			'ガジェット・テクノロジー',
			'お金・投資',
			'健康・ランニング',
		]),
		tags: z.array(z.string()).min(1),
	}),
});

export const collections = { blog };
