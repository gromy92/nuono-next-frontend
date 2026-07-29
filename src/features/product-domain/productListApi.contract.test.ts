import { strict as assert } from 'node:assert';
import { fetchProductListDataset } from './productListApi';

const previousFetch = globalThis.fetch;
const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

try {
  globalThis.fetch = async (input, init) => {
    requests.push({ input, init });
    return Response.json({
      ready: true,
      source: 'workspace-empty',
      warnings: [],
      items: []
    });
  };

  const result = await fetchProductListDataset({
    ownerUserId: 307,
    storeCode: 'STR108065-NSA'
  });
  assert.equal(result.ready, true);
  assert.deepEqual(result.items, []);
  assert.equal(requests[0]?.input, '/api/product-master/list');
  assert.equal(requests[0]?.init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(requests[0]?.init?.body)), {
    ownerUserId: 307,
    storeCode: 'STR108065-NSA'
  });

  globalThis.fetch = async () =>
    Response.json({ message: '商品目录暂不可用' }, { status: 503 });
  await assert.rejects(
    () => fetchProductListDataset({ ownerUserId: 307, storeCode: 'STR108065-NSA' }),
    /商品目录暂不可用/
  );
} finally {
  globalThis.fetch = previousFetch;
}
