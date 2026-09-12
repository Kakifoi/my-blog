// 共通の応援文は表示を保ち、Pagefind の検索対象からだけ外す。
// 部分一致ではなく段落全体を照合し、商品紹介や通常の本文を巻き込まない。
const normalize = (text) => text.replace(/[\s\uFE0F]/g, '');
const footer = 'このブログの商品リンクから飛んで、そのままAmazon・楽天・Yahoo!ショッピングで別の商品（日用品や消耗品など）を買ってもらっても、ブログへの応援になります😊リンク先の商品を買わなくてもOKです。もし使う機会があればぜひ活用してください✌️';
const knownFooters = new Set([
	normalize(footer),
	// 既存の記事にある表記も、原稿を書き換えずに扱う。
	normalize(footer.replace('リンク先の商品', '先の商品')),
]);

function textContent(node) {
	if (node.type === 'text') return node.value;
	return (node.children ?? []).map(textContent).join('');
}

export default function rehypeAffiliateSearch() {
	return function transform(tree) {
		function visit(node) {
			if (node.type === 'element' && node.tagName === 'p' && knownFooters.has(normalize(textContent(node)))) {
				node.properties ??= {};
				node.properties['data-pagefind-ignore'] = '';
			}
			for (const child of node.children ?? []) visit(child);
		}
		visit(tree);
	};
}
