import { strict as assert } from 'node:assert';
import { normalizeNoonImageUrl } from './normalizeNoonImageUrl';

assert.equal(normalizeNoonImageUrl(null), '');
assert.equal(
  normalizeNoonImageUrl('original/pzsku/Z123'),
  'https://f.nooncdn.com/p/pzsku/Z123.jpg'
);
assert.equal(
  normalizeNoonImageUrl('pzsku/Z123.png'),
  'https://f.nooncdn.com/p/pzsku/Z123.png'
);
assert.equal(
  normalizeNoonImageUrl('https://f.nooncdn.com/p/original/pzsku/Z123?width=800'),
  'https://f.nooncdn.com/p/pzsku/Z123?width=800.jpg'
);
assert.equal(
  normalizeNoonImageUrl('https://example.com/product.webp'),
  'https://example.com/product.webp'
);
