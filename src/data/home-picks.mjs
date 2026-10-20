// 編集おすすめの表示順。新着順とは別に管理し、入れ替えはこのリストで行う。
export const HOME_PICK_IDS = Object.freeze([
	'hanabusa-takeout-kumagaya',
	'kodomo-fukka-park',
	'nzxt-relay-speakers-review',
	'datenoya-seafood-dinner',
	'nasu-family-trip-day-one',
	'ushigama-yakiniku-set',
]);

/**
 * @template {{ id: string, data: { heroImage?: string } }} T
 * @param {readonly T[]} posts
 * @param {readonly string[]} [ids]
 * @returns {T[]}
 */
export function getHomePicks(posts, ids = HOME_PICK_IDS) {
	if (ids.length !== 6) throw new Error('[home-picks] おすすめ記事は6件指定してください。');
	const postsById = new Map(posts.map((post) => [post.id, post]));
	const seen = new Set();
	return ids.map((id) => {
		if (seen.has(id)) throw new Error(`[home-picks] おすすめ記事IDが重複しています: ${id}`);
		seen.add(id);
		const post = postsById.get(id);
		if (!post) throw new Error(`[home-picks] おすすめ記事が見つかりません: ${id}`);
		if (!post.data.heroImage?.trim()) throw new Error(`[home-picks] おすすめ記事にheroImageがありません: ${id}`);
		return post;
	});
}
