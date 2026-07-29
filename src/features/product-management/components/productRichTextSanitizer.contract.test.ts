import { strict as assert } from 'node:assert';
import {
  getSafeProductRichTextUrl,
  normalizeProductRichTextHtml,
  sanitizeProductRichTextHtml
} from './productRichTextSanitizer';

assert.equal(getSafeProductRichTextUrl('https://example.com/item'), 'https://example.com/item');
assert.equal(getSafeProductRichTextUrl('/products/PSKU-1'), '/products/PSKU-1');
assert.equal(getSafeProductRichTextUrl('mailto:buyer@example.com'), 'mailto:buyer@example.com');
assert.equal(getSafeProductRichTextUrl('javascript:alert(1)'), null);
assert.equal(getSafeProductRichTextUrl('data:text/html,danger'), null);
assert.equal(getSafeProductRichTextUrl(' https://example.com '), 'https://example.com');
assert.equal(getSafeProductRichTextUrl('https://example.com/\u0000danger'), null);

assert.equal(
  normalizeProductRichTextHtml(null),
  '',
  'normalization should turn missing product copy into empty HTML'
);
assert.equal(
  sanitizeProductRichTextHtml('<p>server-safe passthrough</p>'),
  '<p>server-safe passthrough</p>',
  'server rendering should not require browser DOM globals'
);
