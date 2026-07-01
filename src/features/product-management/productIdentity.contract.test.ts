import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { isSameProductDetailRequest } from './workspaceAccess';
import {
  getProductIdentityLookupKeys,
  getProductListRowIdentityKey,
  getProductStableIdentityKey,
  isSameStableProductIdentity
} from './utils/productIdentity';

assert.equal(
  isSameProductDetailRequest(
    {
      mode: 'real',
      storeCode: 'STR69486-NSA',
      skuParent: 'ZOLDPSKU001',
      partnerSku: 'SGGRB113',
      pskuCode: 'old-noon-psku-code'
    },
    {
      mode: 'real',
      storeCode: 'STR69486-NSA',
      skuParent: 'ZNEWPSKU001',
      partnerSku: 'SGGRB113',
      pskuCode: 'new-noon-psku-code'
    }
  ),
  true,
  'product detail tab identity should be stable by partnerSku within store scope'
);

assert.equal(
  isSameProductDetailRequest(
    {
      mode: 'real',
      storeCode: 'STR69486-NSA',
      currentZCode: 'ZOLD',
      skuParent: 'ZOLD',
      partnerSku: 'SGGRB113',
      pskuCode: 'external-old'
    },
    {
      mode: 'real',
      storeCode: 'STR69486-NSA',
      currentZCode: 'ZNEW',
      skuParent: 'ZNEW',
      partnerSku: 'SGGRB113',
      pskuCode: 'external-new'
    }
  ),
  true,
  'current Z code changes must not create a different product tab when store + partnerSku are the same'
);

assert.equal(
  isSameProductDetailRequest(
    {
      mode: 'real',
      storeCode: 'STR69486-NSA',
      currentZCode: 'ZSAME',
      skuParent: 'ZSAME'
    },
    {
      mode: 'real',
      storeCode: 'STR69486-NSA',
      currentZCode: 'ZSAME',
      skuParent: 'ZSAME'
    }
  ),
  false,
  'product detail tab identity must not fall back to current Z code when partnerSku is missing'
);

assert.equal(
  isSameStableProductIdentity(
    {
      storeCode: 'STR69486-NSA',
      currentZCode: 'ZSAME',
      skuParent: 'ZSAME'
    },
    {
      storeCode: 'STR69486-NSA',
      currentZCode: 'ZSAME',
      skuParent: 'ZSAME'
    }
  ),
  false,
  'stable product identity comparisons must not treat current Z code as product identity'
);

assert.equal(
  isSameStableProductIdentity(
    {
      storeCode: 'STR69486-NSA',
      currentZCode: 'ZOLD',
      skuParent: 'ZOLD',
      partnerSku: 'SGGRB113'
    },
    {
      storeCode: 'STR69486-NSA',
      currentZCode: 'ZNEW',
      skuParent: 'ZNEW',
      partnerSku: 'SGGRB113'
    }
  ),
  true,
  'stable product identity comparisons must match by store + partnerSku even when current Z code changes'
);

assert.deepEqual(
  getProductIdentityLookupKeys({
    storeCode: 'STR69486-NSA',
    currentZCode: 'Z20152FFCAE5DA47AC88EZ',
    skuParent: 'Z20152FFCAE5DA47AC88EZ',
    partnerSku: 'SGGRB113'
  }),
  ['STR69486-NSA|psku:SGGRB113'],
  'product identity lookup keys must not include current Z code aliases when partnerSku is present'
);

assert.deepEqual(
  getProductIdentityLookupKeys({
    currentZCode: 'Z20152FFCAE5DA47AC88EZ',
    partnerSku: 'SGGRB113'
  }),
  [],
  'product identity lookup keys must not match partnerSku globally without store scope'
);

assert.deepEqual(
  getProductIdentityLookupKeys({
    storeCode: 'STR69486-NSA',
    currentZCode: 'Z20152FFCAE5DA47AC88EZ',
    skuParent: 'Z20152FFCAE5DA47AC88EZ'
  }),
  [],
  'product identity lookup keys must not use current Z code aliases when partnerSku is missing'
);

assert.deepEqual(
  getProductIdentityLookupKeys({
    storeCode: 'STR69486-NSA',
    currentZCode: 'Z20152FFCAE5DA47AC88EZ',
    productVariantId: 123
  }),
  ['STR69486-NSA|row:123', 'row:123'],
  'legacy row refs may remain as compatibility lookup keys only when partnerSku is missing'
);

assert.equal(
  getProductStableIdentityKey({
    storeCode: 'STR69486-NSA',
    currentZCode: 'ZOLD',
    partnerSku: 'SGGRB113'
  }),
  'STR69486-NSA|psku:SGGRB113',
  'stable product key must use store + partnerSku'
);

assert.equal(
  getProductStableIdentityKey({
    currentZCode: 'ZOLD',
    partnerSku: 'SGGRB113'
  }),
  '',
  'stable product key must not use partnerSku without store scope'
);

assert.equal(
  isSameStableProductIdentity(
    {
      currentZCode: 'ZOLD',
      partnerSku: 'SGGRB113'
    },
    {
      currentZCode: 'ZNEW',
      partnerSku: 'SGGRB113'
    }
  ),
  false,
  'stable product identity comparisons must require store scope'
);

assert.equal(
  isSameStableProductIdentity(
    {
      storeCode: 'STR69486-NSA',
      currentZCode: 'ZOLD',
      partnerSku: 'SGGRB113'
    },
    {
      storeCode: 'STR245027-NAE',
      currentZCode: 'ZOLD',
      partnerSku: 'SGGRB113'
    }
  ),
  false,
  'stable product identity comparisons must not match the same partnerSku across stores'
);

assert.equal(
  getProductStableIdentityKey({
    storeCode: 'STR69486-NSA',
    currentZCode: 'ZSAME'
  }),
  '',
  'stable product key must not fall back to current Z code when partnerSku and row refs are missing'
);

assert.equal(
  getProductStableIdentityKey({
    storeCode: 'STR69486-NSA',
    currentZCode: 'ZSAME',
    productVariantId: 123
  }),
  'STR69486-NSA|row:123',
  'legacy row refs are the only stable-key fallback when partnerSku is missing'
);

assert.equal(
  getProductListRowIdentityKey({
    storeCode: 'STR69486-NSA',
    currentZCode: 'ZSAME'
  }),
  '',
  'list row identity keys must not fall back to current Z code'
);

const baselineDisplaySource = readFileSync(
  new URL('./components/ProductBaselineDisplay.tsx', import.meta.url),
  'utf8'
);

assert.equal(
  baselineDisplaySource.includes('summary.partnerSku || summary.pskuCode'),
  false,
  'ProductBaselineDisplay must not display external pskuCode as business PSKU fallback'
);
