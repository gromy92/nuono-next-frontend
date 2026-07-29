import { strict as assert } from 'node:assert';
import {
  fetchProductSpecDetail,
  fetchProductVariantSpecs,
  saveProductVariantSpec
} from './api';
import {
  fetchProductLogisticsProfiles,
  saveProductLogisticsProfile
} from './logisticsProfileApi';

const previousFetch = globalThis.fetch;
const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
const detail = {
  ready: true,
  storeCode: 'STR108065-NSA',
  partnerSku: 'PSKU-1',
  currentZCode: 'Z-1',
  effectiveSpec: {
    storeCode: 'STR108065-NSA',
    partnerSku: 'PSKU-1',
    currentZCode: 'Z-1',
    siteLabels: [],
    liveStatuses: []
  }
};

try {
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    const url = String(input);
    if (url.includes('/sources/')) {
      return Response.json({ sourceId: 88 });
    }
    if (url.includes('/effective-source')) {
      return Response.json(detail);
    }
    if (url.includes('/product-logistics-profiles')) {
      return Response.json({
        storeCode: 'STR108065-NSA',
        partnerSku: 'PSKU-1',
        currentZCode: 'Z-1',
        profileStatus: 'confirmed'
      });
    }
    return Response.json(detail);
  };

  const specs = await fetchProductVariantSpecs({
    ownerUserId: 307,
    storeCode: 'STR108065-NSA',
    partnerSku: 'PSKU-1',
    currentZCode: 'Z-1'
  });
  assert.equal(specs.items[0]?.partnerSku, 'PSKU-1');
  assert.match(String(calls[0]?.input), /\/api\/product-specs\/by-psku/);

  const saved = await saveProductVariantSpec({
    ownerUserId: 307,
    storeCode: 'STR108065-NSA',
    partnerSku: 'PSKU-1',
    currentZCode: 'Z-1',
    productWeightG: 500
  });
  assert.equal(saved.currentZCode, 'Z-1');
  assert.equal(calls[1]?.init?.method, 'PUT');
  assert.match(String(calls[1]?.input), /\/sources\/ali1688/);
  assert.equal(calls[2]?.init?.method, 'PUT');
  assert.match(String(calls[2]?.input), /\/effective-source/);

  const profiles = await fetchProductLogisticsProfiles({
    ownerUserId: 307,
    storeCode: 'STR108065-NSA',
    partnerSku: 'PSKU-1'
  });
  assert.equal(profiles.items[0]?.profileStatus, 'confirmed');

  await saveProductLogisticsProfile({
    ownerUserId: 307,
    storeCode: 'STR108065-NSA',
    partnerSku: 'PSKU-1',
    profileStatus: 'confirmed'
  });
  assert.equal(calls.at(-1)?.init?.method, 'PUT');

  globalThis.fetch = async () =>
    Response.json({ message: '规格事实不可用' }, { status: 409 });
  await assert.rejects(
    () =>
      fetchProductSpecDetail({
        storeCode: 'STR108065-NSA',
        partnerSku: 'PSKU-1'
      }),
    /规格事实不可用/
  );
} finally {
  globalThis.fetch = previousFetch;
}
