import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';
import { isSameProductDetailRequest } from './workspaceAccess';

test('product detail request identity is stable by store and partnerSku', () => {
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
});

test('product baseline display does not use external pskuCode as business PSKU fallback', () => {
  const baselineDisplaySource = readFileSync(
    new URL('./components/ProductBaselineDisplay.tsx', import.meta.url),
    'utf8'
  );

  assert.equal(
    baselineDisplaySource.includes('summary.partnerSku || summary.pskuCode'),
    false,
    'ProductBaselineDisplay must not display external pskuCode as business PSKU fallback'
  );
});
