import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const support = await readFile(new URL('../src/components/BlogmuraSupport.astro', import.meta.url), 'utf8');

test('support uses the issued general Blogmura IN link and badge, not a regional claim', () => {
	assert.match(support, /href="https:\/\/blogmura\.com\/ranking\/in\?p_cid=11218995"/);
	assert.match(support, /src="https:\/\/b\.blogmura\.com\/banner-blogmura-landscape\.svg" width="120" height="33"/);
	assert.match(support, /aria-label="にほんブログ村で応援する（新しいタブで開きます）"/);
	assert.doesNotMatch(support, /埼玉県情報|localkantou|saitama/);
});

test('support keeps external link safety, referrer, accessible labeling, and search exclusion', () => {
	assert.match(support, /target="_blank" rel="noopener"/);
	assert.doesNotMatch(support, /noreferrer/);
	assert.match(support, /alt="ブログランキング・にほんブログ村へ"/);
	assert.match(support, /data-pagefind-ignore/);
	assert.match(support, /min-height: 44px/);
	assert.match(support, /:focus-visible/);
});
