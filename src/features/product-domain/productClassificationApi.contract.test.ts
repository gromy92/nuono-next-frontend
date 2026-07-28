import { strict as assert } from 'node:assert';
import { fetchProductClassificationOptions } from './productClassificationApi';

const previousFetch = globalThis.fetch;
const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

try {
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return Response.json({
      ready: true,
      warnings: [],
      brands: [{ value: 'PAPERSAY', usageCount: 12 }],
      fulltypes: [{ value: 'stationery-paper-notes', usageCount: 8 }]
    });
  };

  const result = await fetchProductClassificationOptions({
    ownerUserId: 307,
    storeCode: 'STR108065-NSA',
    fulltypeQuery: 'stationery',
    limit: 50,
    includeGlobalFulltypes: true
  });

  assert.equal(result.brands[0]?.value, 'PAPERSAY');
  assert.equal(String(calls[0]?.input), '/api/product-master/classification-options');
  assert.equal(calls[0]?.init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    ownerUserId: 307,
    storeCode: 'STR108065-NSA',
    fulltypeQuery: 'stationery',
    limit: 50,
    includeGlobalFulltypes: true
  });

  globalThis.fetch = async () =>
    Response.json({ code: 'CLASSIFICATION_UNAVAILABLE', message: '候选数据暂不可用' }, { status: 503 });

  await assert.rejects(
    fetchProductClassificationOptions({ storeCode: 'STR108065-NSA' }),
    /服务正在更新，请稍后重试/
  );
} finally {
  globalThis.fetch = previousFetch;
}
