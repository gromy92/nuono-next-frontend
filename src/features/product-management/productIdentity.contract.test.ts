import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { isSameProductDetailRequest } from './workspaceAccess';

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

const baselineDisplaySource = readFileSync(
  new URL('./components/ProductBaselineDisplay.tsx', import.meta.url),
  'utf8'
);

assert.equal(
  baselineDisplaySource.includes('summary.partnerSku || summary.pskuCode'),
  false,
  'ProductBaselineDisplay must not display external pskuCode as business PSKU fallback'
);
