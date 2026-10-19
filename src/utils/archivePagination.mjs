export const ARCHIVE_PAGE_SIZE = 12;
export const ARCHIVE_CATEGORIES = ['子育て・日常', '旅行・おでかけ'];

export function archivePageUrl(page, category) {
	const base = category ? `/categories/${encodeURIComponent(category)}/` : '/blog/';
	return page === 1 ? base : `${base}page/${page}/`;
}

export function archivePageNumbers(currentPage, totalPages) {
	const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
	const numbers = new Set([1, totalPages]);
	for (let page = start; page <= Math.min(totalPages, start + 4); page++) numbers.add(page);
	const result = [];
	let previous = 0;
	for (const page of [...numbers].sort((a, b) => a - b)) {
		if (page - previous === 2) result.push(previous + 1);
		else if (page - previous > 2) result.push(null);
		result.push(page);
		previous = page;
	}
	return result;
}
