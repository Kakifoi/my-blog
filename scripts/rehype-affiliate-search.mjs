import path from 'node:path';
import { articleFooter, articleFooterGuides, footerParts, validateArticleFooter } from './article-footer.mjs';
export { articleFooter };

// 文末の共通案内だけを装飾し、Pagefind の検索対象から外す。
// 既定は感謝と開示の2段落。確認済みの記事だけ個別の商品案内を許可する。
const normalize = (text) => text.replace(/[\s\uFE0F]/g, '');

function textContent(node) {
	if (node.type === 'text') return node.value;
	return (node.children ?? []).map(textContent).join('');
}

export default function rehypeAffiliateSearch() {
	return function transform(tree, file) {
		const slug = file.path ? path.basename(file.path).replace(/\.mdx?$/, '') : '';
		if (file.path?.replaceAll('\\', '/').includes('/src/content/blog/')) {
			validateArticleFooter(String(file.value), slug);
		}
		const guide = articleFooterGuides[slug];
		const paragraphs = guide
			? [articleFooter.thanks, guide.intro, guide.linkText, articleFooter.notice].map(normalize)
			: footerParts('').map(normalize);
		const classes = guide
			? ['article-footer-thanks', 'article-footer-intro', 'article-footer-action', 'article-footer-disclosure']
			: ['article-footer-thanks', 'article-footer-disclosure'];
		function visit(node) {
			const children = (node.children ?? []).filter((child) => child.type !== 'text' || child.value.trim());
			const ending = children.slice(-(paragraphs.length + 1));
			if (ending.length === paragraphs.length + 1 && ending[0].tagName === 'hr' &&
				ending.slice(1).every((child, index) => child.tagName === 'p' && normalize(textContent(child)) === paragraphs[index])) {
				const link = guide ? ending[3].children?.find((child) => child.tagName === 'a') : undefined;
				if (!guide || link?.properties?.href === guide.href) {
					ending.slice(1).forEach((child, index) => {
						child.properties ??= {};
						child.properties['data-pagefind-ignore'] = '';
						child.properties.className = [...(child.properties.className ?? []), classes[index]];
					});
					if (link) link.properties.className = [...(link.properties.className ?? []), 'article-footer-cta'];
				}
			}
			for (const child of node.children ?? []) visit(child);
		}
		visit(tree);
	};
}
