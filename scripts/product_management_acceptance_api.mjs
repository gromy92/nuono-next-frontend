import assert from 'node:assert/strict'
import {
  baseUrl,
  CLEAN_SKU_PARENT,
  OWNER_USER_ID,
  STORE_CODE
} from './product_management_acceptance_config.mjs'

export async function loadListPayload() {
  const response = await fetch(`${baseUrl}/api/product-master/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerUserId: OWNER_USER_ID, storeCode: STORE_CODE }),
    signal: AbortSignal.timeout(10000)
  });
  const text = await response.text();
  assert.equal(response.status, 200, `商品列表接口返回 ${response.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

export async function restoreCleanProductBaseline() {
  const command = { ownerUserId: OWNER_USER_ID, storeCode: STORE_CODE, skuParent: CLEAN_SKU_PARENT };
  const openResponse = await fetch(`${baseUrl}/api/product-master/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(15000)
  });
  const openText = await openResponse.text();
  assert.equal(openResponse.status, 200, `清理商品草稿打开详情失败 ${openResponse.status}: ${openText.slice(0, 300)}`);
  const openPayload = JSON.parse(openText);
  const baselineSnapshot = openPayload.baselineSnapshot ?? openPayload;
  const saveResponse = await fetch(`${baseUrl}/api/product-master/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...command,
      action: 'save',
      currentSiteCode: STORE_CODE,
      snapshot: baselineSnapshot
    }),
    signal: AbortSignal.timeout(15000)
  });
  const saveText = await saveResponse.text();
  assert.equal(saveResponse.status, 200, `清理商品草稿保存基线失败 ${saveResponse.status}: ${saveText.slice(0, 300)}`);
}

export async function verifyTranslateApi() {
  const response = await fetch(`${baseUrl}/api/product-master/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operatorUserId: 10002,
      text: 'Astronaut Galaxy Projector',
      targetLang: 'ZH'
    }),
    signal: AbortSignal.timeout(20000)
  });
  const text = await response.text();
  assert.equal(response.status, 200, `翻译接口返回 ${response.status}: ${text.slice(0, 300)}`);
  const payload = JSON.parse(text);
  assert.equal(payload.source, 'ai', '翻译接口必须走 AI 通道');
  if (payload.ready === false) {
    assert(String(payload.message ?? '').includes('AI 翻译暂时不可用'), `AI 不可用时必须明确返回原因: ${text.slice(0, 300)}`);
    return false;
  }
  assert.equal(payload.ready, true, `翻译接口未 ready: ${payload.message ?? ''}`);
  assert(String(payload.data?.translation?.text ?? '').trim(), 'AI 翻译成功时必须返回非空 translation.text');
  return true;
}

export async function verifyClassificationOptionsApi() {
  const response = await fetch(`${baseUrl}/api/product-master/classification-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerUserId: OWNER_USER_ID,
      storeCode: STORE_CODE,
      limit: 20
    }),
    signal: AbortSignal.timeout(15000)
  });
  const text = await response.text();
  assert.equal(response.status, 200, `品牌/类目字典接口返回 ${response.status}: ${text.slice(0, 300)}`);
  const payload = JSON.parse(text);
  assert.equal(payload.ready, true, `品牌/类目字典接口未 ready: ${payload.message ?? ''}`);
  assert.equal(payload.source, 'dictionary', `品牌/类目候选必须来自数据库字典，实际 source=${payload.source}`);
  const brands = (payload.brands ?? []).map((item) => String(item.value ?? '').toLowerCase());
  const fulltypes = (payload.fulltypes ?? []).map((item) => String(item.value ?? ''));
  assert((payload.fulltypes ?? []).length >= 20, `类目候选必须使用系统全量字典搜索，不能只返回当前店铺少量类目: ${text.slice(0, 300)}`);
  assert(brands.includes('milkyway'), `品牌字典缺少 milkyway: ${text.slice(0, 300)}`);
  assert(
    fulltypes.includes('home_decor-kids_room_decor-lamps_lighting') ||
      fulltypes.includes('home_decor-lighting-table_lamps'),
    `类目字典缺少当前验收商品类目: ${text.slice(0, 300)}`
  );

  const sportsResponse = await fetch(`${baseUrl}/api/product-master/classification-options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerUserId: OWNER_USER_ID,
      storeCode: STORE_CODE,
      fulltypeQuery: 'sports_outdoor',
      limit: 20
    }),
    signal: AbortSignal.timeout(15000)
  });
  const sportsText = await sportsResponse.text();
  assert.equal(sportsResponse.status, 200, `系统类目搜索返回 ${sportsResponse.status}: ${sportsText.slice(0, 300)}`);
  const sportsPayload = JSON.parse(sportsText);
  const sportsFulltypes = (sportsPayload.fulltypes ?? []).map((item) => String(item.value ?? ''));
  assert(
    sportsFulltypes.some((item) => item.startsWith('sports_outdoor-')),
    `系统全量类目搜索没有返回其它店铺类目: ${sportsText.slice(0, 300)}`
  );
}
