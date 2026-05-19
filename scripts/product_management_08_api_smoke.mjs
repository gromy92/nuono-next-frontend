import assert from 'node:assert/strict';
import process from 'node:process';

const baseUrl = process.env.PRODUCT_08_API_BASE_URL ?? 'http://127.0.0.1:18080';
const ownerUserId = Number(process.env.PRODUCT_08_OWNER_USER_ID ?? 10002);
const storeCode = process.env.PRODUCT_08_STORE_CODE ?? 'STR245027-NAE';
const skuParent = process.env.PRODUCT_08_SKU_PARENT ?? 'ZAF42BC48A32F9B7E7FA2Z';
const currentSiteLivePartnerSku = process.env.PRODUCT_08_CURRENT_SITE_LIVE_PARTNER_SKU ?? 'MILKYWAYA02';

async function requestJson(path, options = {}) {
  const { method = 'GET', body, expectedStatus = 200, timeoutMs = 10000 } = options;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs)
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  assert.equal(response.status, expectedStatus, `${method} ${path} 返回 ${response.status}: ${text.slice(0, 500)}`);
  return payload;
}

async function uploadSmokeImage() {
  const pngBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGOSHzRgAAAAABJRU5ErkJggg==',
    'base64'
  );
  const form = new FormData();
  form.append('file', new Blob([pngBytes], { type: 'image/png' }), 'product-management-08-smoke.png');
  form.append('ownerUserId', String(ownerUserId));
  form.append('storeCode', storeCode);
  form.append('skuParent', skuParent);

  const response = await fetch(`${baseUrl}/api/product-master/image-assets`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(10000)
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  assert.equal(response.status, 200, `上传图片返回 ${response.status}: ${text.slice(0, 500)}`);
  assert(payload.url, '上传图片必须返回 url');
  assert(payload.filename, '上传图片必须返回 filename');
  assert(payload.assetId, '带商品上下文上传图片必须落 product_image_asset 并返回 assetId');

  const imageResponse = await fetch(`${baseUrl}${payload.url}`, {
    signal: AbortSignal.timeout(5000)
  });
  assert.equal(imageResponse.status, 200, `读取上传图片返回 ${imageResponse.status}`);
  assert(
    imageResponse.headers.get('content-type')?.startsWith('image/'),
    `读取上传图片 content-type 异常：${imageResponse.headers.get('content-type')}`
  );

  return payload;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

async function verifyUnsupportedPublishBoundary() {
  const workbench = await requestJson('/api/product-master/open', {
    method: 'POST',
    body: command,
    timeoutMs: 15000
  });
  assert.equal(workbench.ready, true, `商品详情工作台未 ready: ${workbench.message ?? ''}`);

  const baselineSnapshot = cloneJson(workbench.baselineSnapshot ?? workbench);
  const blockedDraft = cloneJson(workbench.draftSnapshot ?? workbench);
  blockedDraft.group = {
    ...(blockedDraft.group ?? {}),
    memberCount: Number(blockedDraft.group?.memberCount ?? 0) + 1,
    smokeBlockedAt: new Date(0).toISOString()
  };

  const blockedPublish = await requestJson('/api/product-master/action', {
    method: 'POST',
    body: {
      ...command,
      action: 'publish-current',
      currentSiteCode: storeCode,
      snapshot: blockedDraft
    },
    timeoutMs: 15000
  });
  assert.equal(blockedPublish.ready, true, `发布阻断接口未 ready: ${blockedPublish.message ?? ''}`);
  assert.equal(blockedPublish.syncStatus, 'failed', '未适配 Group 发布必须返回 failed');
  assert.match(
    String(blockedPublish.note ?? blockedPublish.message ?? ''),
    /Group 关联/,
    '未适配 Group 发布必须返回明确阻断原因'
  );
  assert(
    (blockedPublish.recentActions ?? []).some(
      (item) => item.actionType === 'publish-current' && item.resultStatus === 'failed'
    ),
    '发布阻断必须回读到 publish-current failed 动作日志'
  );

  await requestJson('/api/product-master/action', {
    method: 'POST',
    body: {
      ...command,
      action: 'save',
      currentSiteCode: storeCode,
      snapshot: baselineSnapshot
    },
    timeoutMs: 15000
  });

  return blockedPublish;
}

const command = { ownerUserId, storeCode, skuParent };

const list = await requestJson('/api/product-master/list', {
  method: 'POST',
  body: { ownerUserId, storeCode },
  timeoutMs: 15000
});
assert.equal(list.ready, true, `商品列表数据面未 ready: ${list.message ?? ''}`);
assert(Array.isArray(list.items) && list.items.length > 0, '商品列表必须返回商品行');
const currentSiteLiveItem = list.items.find(
  (item) => item.partnerSku === currentSiteLivePartnerSku || item.sku === currentSiteLivePartnerSku
);
assert(currentSiteLiveItem, `商品列表缺少当前站点在线样本：${currentSiteLivePartnerSku}`);
assert.equal(
  String(currentSiteLiveItem.liveStatus),
  'true',
  `${currentSiteLivePartnerSku} 当前站点应为在线，不能用跨站点聚合状态覆盖`
);

const summary = await requestJson('/api/product-master/list-summary', {
  method: 'POST',
  body: command
});
assert.equal(summary.ready, true, `商品列表摘要未 ready: ${summary.message ?? ''}`);
assert.equal(summary.skuParent, skuParent, '商品摘要 skuParent 不匹配');

const translation = await requestJson('/api/product-master/translate', {
  method: 'POST',
  body: {
    operatorUserId: ownerUserId,
    text: 'Astronaut Galaxy Projector',
    targetLang: 'ZH'
  },
  timeoutMs: 20000
});
assert.equal(translation.ready, true, `翻译接口未 ready: ${translation.message ?? ''}`);
assert(
  String(translation.data?.translation?.text ?? '').trim(),
  '翻译接口必须返回非空 translation.text'
);

const candidates = await requestJson('/api/product-master/group-candidates', {
  method: 'POST',
  body: command
});
assert.equal(candidates.ready, true, `Group 候选未 ready: ${candidates.message ?? ''}`);
assert(Array.isArray(candidates.items), 'Group 候选必须返回 items 数组');
assert(!candidates.items.some((item) => item.skuParent === skuParent), 'Group 候选不应包含当前商品自身');

const uploadedImage = await uploadSmokeImage();
const blockedPublish = await verifyUnsupportedPublishBoundary();

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  ownerUserId,
  storeCode,
  skuParent,
  listItems: list.items.length,
  groupedCount: list.groupedCount,
  summary: {
    title: summary.title,
    pskuCode: summary.pskuCode,
    partnerSku: summary.partnerSku,
    galleryImages: summary.galleryImages?.length ?? 0,
    totalFbnStock: summary.totalFbnStock,
    totalSupermallStock: summary.totalSupermallStock
  },
  groupCandidates: candidates.items.length,
  uploadedImage: {
    assetId: uploadedImage.assetId,
    filename: uploadedImage.filename,
    contentType: uploadedImage.contentType,
    size: uploadedImage.size
  },
  publishBoundary: {
    syncStatus: blockedPublish.syncStatus,
    note: blockedPublish.note
  }
}, null, 2));
