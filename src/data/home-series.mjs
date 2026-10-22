// 続きものを読む順番。新着順や人気順ではなく、体験の時系列で並べる。
const HOME_SERIES = [
	{
		id: 'nasu-family-trip',
		title: '那須の家族旅行',
		links: [
			{ id: 'nasu-family-trip-day-one', label: '1日目｜どうぶつ王国とホテル' },
			{ id: 'nasu-highland-park-family-trip', label: '2日目｜那須ハイランドパーク' },
		],
	},
	{
		id: 'wisdom-tooth-extraction',
		title: '親知らずの抜歯記録',
		links: [
			{ id: 'fukaya-nisseki-wisdom-tooth-extraction', label: '抜歯当日のこと' },
			{ id: 'wisdom-tooth-extraction-pain-swelling', label: '抜歯後の痛みと腫れ' },
			{ id: 'wisdom-tooth-suture-removal', label: '1週間後の抜糸' },
		],
	},
];

/**
 * 記事と正式タイトルを照合し、欠けた記事があるシリーズは全体を表示しない。
 * @template {{ id: string, data: { title: string } }} T
 * @param {readonly T[]} posts
 * @returns {{ id: string, title: string, links: { label: string, post: T }[] }[]}
 */
export function getHomeSeries(posts) {
	const postsById = new Map(posts.map((post) => [post.id, post]));
	return HOME_SERIES.flatMap((group) => {
		const links = [];
		for (const { id, label } of group.links) {
			const post = postsById.get(id);
			if (!post || typeof post.data?.title !== 'string' || !post.data.title.trim()) return [];
			links.push({ label, post });
		}
		return [{ id: group.id, title: group.title, links }];
	});
}
