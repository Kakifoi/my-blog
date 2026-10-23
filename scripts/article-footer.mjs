import { readFileSync } from 'node:fs';

export const articleFooter = JSON.parse(readFileSync(new URL('./article-footer.json', import.meta.url), 'utf8'));
// An editorial allowlist, not a recommendation engine. Missing entries have NO product fallback.
export const articleFooterGuides = JSON.parse(readFileSync(new URL('./article-footer-guides.json', import.meta.url), 'utf8'));

export function footerParts(slug) {
	const guide = articleFooterGuides[slug];
	return guide
		? [articleFooter.thanks, guide.intro, `[${guide.linkText}](${guide.href})`, articleFooter.notice]
		: [articleFooter.thanks, articleFooter.notice];
}

export function validateArticleFooter(source, slug) {
	source = source.replace(/\r\n/g, '\n');
	const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
	const marker = `\n${articleFooter.thanks}`;
	const start = body.lastIndexOf(marker);
	const guide = articleFooterGuides[slug];
	if (guide && (!guide.reason || !guide.evidence?.length ||
		guide.evidence.some((text) => !body.slice(0, start).includes(text)))) {
		throw new Error(`${slug}: 末尾の商品紹介には本文中の根拠と選定理由が必要です`);
	}
	if (start === -1) {
		if (guide) throw new Error(`${slug}: 確認済みの末尾案内がありません`);
		return;
	}
	const before = body.slice(0, start).trimEnd();
	// Without a blank line before it, --- is a Setext heading, not a divider.
	if (!/(?:^|\n[ \t]*\n)---$/.test(before) || body.slice(start).trim() !== footerParts(slug).join('\n\n')) {
		throw new Error(`${slug}: 末尾案内が共通データと不一致です。未設定時に商品を補充せず、関連性を個別確認してください`);
	}
}
