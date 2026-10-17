import { readFileSync } from 'node:fs';

// 文末の共通案内だけを装飾し、Pagefind の検索対象から外す。
// 最後の区切り線に続く4段落全体を照合し、通常の本文を巻き込まない。
export const articleFooter = JSON.parse(readFileSync(new URL('./article-footer.json', import.meta.url), 'utf8'));
const normalize = (text) => text.replace(/[\s\uFE0F]/g, '');
const paragraphs = ['thanks', 'intro', 'linkText', 'notice'].map((key) => normalize(articleFooter[key]));
const classes = ['article-footer-thanks', 'article-footer-intro', 'article-footer-action', 'article-footer-disclosure'];

function textContent(node) {
	if (node.type === 'text') return node.value;
	return (node.children ?? []).map(textContent).join('');
}

export default function rehypeAffiliateSearch() {
	return function transform(tree) {
		function visit(node) {
			const children = (node.children ?? []).filter((child) => child.type !== 'text' || child.value.trim());
			const ending = children.slice(-5);
			if (ending.length === 5 && ending[0].tagName === 'hr' &&
				ending.slice(1).every((child, index) => child.tagName === 'p' && normalize(textContent(child)) === paragraphs[index])) {
				const link = ending[3].children?.find((child) => child.tagName === 'a');
				if (link?.properties?.href === articleFooter.href) {
					ending.slice(1).forEach((child, index) => {
						child.properties ??= {};
						child.properties['data-pagefind-ignore'] = '';
						child.properties.className = [...(child.properties.className ?? []), classes[index]];
					});
					link.properties.className = [...(link.properties.className ?? []), 'article-footer-cta'];
				}
			}
			for (const child of node.children ?? []) visit(child);
		}
		visit(tree);
	};
}
