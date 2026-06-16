import assert from 'node:assert/strict';
import process from 'node:process';

const baseUrl = stripTrailingSlash(
  process.env.COMPETITOR_ANALYSIS_API_BASE_URL || process.env.E2E_API_BASE_URL || 'http://127.0.0.1:18080'
);
const storeCode = process.env.COMPETITOR_ANALYSIS_STORE_CODE || 'STR69486-NSA';
const siteCode = process.env.COMPETITOR_ANALYSIS_SITE_CODE || 'SA';
const pageSize = boundedNumber(process.env.COMPETITOR_ANALYSIS_PAGE_SIZE, 100, 1, 100);
const minTotal = boundedNumber(process.env.COMPETITOR_ANALYSIS_MIN_TOTAL, 1, 0, Number.MAX_SAFE_INTEGER);
const requireChanges = process.env.COMPETITOR_ANALYSIS_REQUIRE_CHANGES !== 'false';

const sortChecks = [
  { sortBy: 'candidateCountDesc', field: 'pendingCandidateCount', direction: 'desc', label: '候选数↓' },
  { sortBy: 'candidateCountAsc', field: 'pendingCandidateCount', direction: 'asc', label: '候选数↑' },
  { sortBy: 'monitoredCountDesc', field: 'confirmedCompetitorCount', direction: 'desc', label: '监控数↓' },
  { sortBy: 'monitoredCountAsc', field: 'confirmedCompetitorCount', direction: 'asc', label: '监控数↑' },
  { sortBy: 'recent7dChangeCountDesc', field: 'recent7dCompetitorChangeCount', direction: 'desc', label: '7日变化次数↓' },
  { sortBy: 'recent7dChangeCountAsc', field: 'recent7dCompetitorChangeCount', direction: 'asc', label: '7日变化次数↑' }
];

async function main() {
  const baselineList = await listBaselines({ sortBy: 'candidateCountDesc', pageSize });
  assert(Array.isArray(baselineList.items), 'product-baselines.items 必须是数组');
  assert(
    Number(baselineList.pagination?.total ?? 0) >= minTotal,
    `product-baselines total 必须 >= ${minTotal}，实际 ${baselineList.pagination?.total ?? 0}`
  );
  assert(baselineList.items.length > 0, 'product-baselines 当前页必须返回商品');
  baselineList.items.forEach(assertListItemData);

  const sortSummaries = [];
  for (const check of sortChecks) {
    const list = await listBaselines({ sortBy: check.sortBy, pageSize: Math.min(pageSize, 20) });
    list.items.forEach(assertListItemData);
    assertMonotonic(list.items, check.field, check.direction, check.label);
    sortSummaries.push({
      sortBy: check.sortBy,
      first: list.items[0]?.partnerSku || list.items[0]?.selfNoonProductCode || null,
      values: list.items.slice(0, 5).map((item) => Number(item[check.field] ?? 0))
    });
  }

  const confirmedZero = await listBaselines({ confirmedCompetitorCountZero: true, pageSize: 10 });
  confirmedZero.items.forEach((item) => {
    assert.equal(Number(item.confirmedCompetitorCount ?? 0), 0, '监控为0筛选返回了非 0 监控商品');
  });
  const pendingZero = await listBaselines({ pendingCandidateCountZero: true, pageSize: 10 });
  pendingZero.items.forEach((item) => {
    assert.equal(Number(item.pendingCandidateCount ?? 0), 0, '候选为0筛选返回了非 0 候选商品');
  });

  const detail = await findDetailWithRankAndCandidates(baselineList.items);
  assertDetailData(detail);

  const keywordId = chooseRankKeywordId(detail);
  const rankHistory = await requestJson(`/api/competitor-analysis/watch-products/${detail.watchProduct.id}/rank-history?${new URLSearchParams({
    keywordId: String(keywordId),
    rangeDays: '30'
  })}`);
  assert(Array.isArray(rankHistory.items), 'rank-history.items 必须是数组');
  assert(rankHistory.items.length > 0, 'rank-history 必须返回至少一条排名事实');
  rankHistory.items.forEach(assertRankPointData);

  const changeProbe = await findProductChangesWithRows();
  assert(Array.isArray(changeProbe.changes.items), 'product-changes.items 必须是数组');
  if (requireChanges) {
    assert(changeProbe.changes.items.length > 0, 'product-changes 必须返回至少一组变化；如只想验证空态，设置 COMPETITOR_ANALYSIS_REQUIRE_CHANGES=false');
    changeProbe.changes.items.forEach(assertChangeGroupData);
  }

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    storeCode,
    siteCode,
    total: baselineList.pagination?.total ?? baselineList.items.length,
    sampledWatchProductId: detail.watchProduct.id,
    sampledPartnerSku: detail.watchProduct.partnerSku,
    sampledKeywordId: keywordId,
    rankHistoryCount: rankHistory.items.length,
    changeWatchProductId: changeProbe.watchProductId,
    changeGroupCount: changeProbe.changes.items.length,
    sortSummaries
  }, null, 2));
}

async function listBaselines(params = {}) {
  const query = new URLSearchParams({
    storeCode,
    siteCode,
    page: '1',
    pageSize: String(params.pageSize || pageSize)
  });
  for (const [key, value] of Object.entries(params)) {
    if (key === 'pageSize' || value === undefined || value === null || value === '') continue;
    query.set(key, String(value));
  }
  return requestJson(`/api/competitor-analysis/product-baselines?${query}`);
}

async function findDetailWithRankAndCandidates(items) {
  let fallbackDetail = null;
  for (const item of items) {
    if (!item.id) continue;
    const detail = await requestJson(`/api/competitor-analysis/watch-products/${item.id}`);
    if (!fallbackDetail) fallbackDetail = detail;
    const keywordCount = Array.isArray(detail.keywords) ? detail.keywords.length : 0;
    const candidateCount = Array.isArray(detail.candidates) ? detail.candidates.length : 0;
    const rankCount = Array.isArray(detail.latestRankPoints) ? detail.latestRankPoints.length : 0;
    if (keywordCount > 0 && candidateCount > 0 && rankCount > 0) {
      return detail;
    }
  }
  assert(fallbackDetail, '当前列表没有可读取详情的已监控商品');
  return fallbackDetail;
}

async function findProductChangesWithRows() {
  const changedList = await listBaselines({ sortBy: 'recent7dChangeCountDesc', pageSize: Math.min(pageSize, 100) });
  for (const item of changedList.items) {
    if (!item.id) continue;
    const changes = await requestJson(`/api/competitor-analysis/watch-products/${item.id}/product-changes?limit=100`);
    if (Array.isArray(changes.items) && changes.items.length > 0) {
      return { watchProductId: item.id, changes };
    }
  }
  return { watchProductId: changedList.items.find((item) => item.id)?.id ?? null, changes: { items: [] } };
}

async function requestJson(path, options = {}) {
  const { method = 'GET', body, expectedStatus = 200, timeoutMs = 15000 } = options;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders(body),
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
  const authHint = response.status === 401 || response.status === 403
    ? '。真实环境请提供 COMPETITOR_ANALYSIS_SESSION_COOKIE 或 COMPETITOR_ANALYSIS_AUTHORIZATION；本机 loopback 会默认使用 X-Nuono-Dev-Session-User-Id。'
    : '';
  assert.equal(response.status, expectedStatus, `${method} ${path} 返回 ${response.status}: ${text.slice(0, 500)}${authHint}`);
  return payload;
}

function requestHeaders(body) {
  const headers = {};
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (process.env.COMPETITOR_ANALYSIS_SESSION_COOKIE) {
    headers.Cookie = process.env.COMPETITOR_ANALYSIS_SESSION_COOKIE;
  }
  if (process.env.COMPETITOR_ANALYSIS_AUTHORIZATION) {
    headers.Authorization = process.env.COMPETITOR_ANALYSIS_AUTHORIZATION;
  } else if (process.env.COMPETITOR_ANALYSIS_BEARER_TOKEN) {
    headers.Authorization = `Bearer ${process.env.COMPETITOR_ANALYSIS_BEARER_TOKEN}`;
  }
  if (!headers.Cookie && !headers.Authorization && isLoopbackBaseUrl(baseUrl)) {
    headers['X-Nuono-Dev-Session-User-Id'] = process.env.COMPETITOR_ANALYSIS_DEV_SESSION_USER_ID || '307';
    if (process.env.COMPETITOR_ANALYSIS_DEV_SESSION_ROLE_ID) {
      headers['X-Nuono-Dev-Session-Role-Id'] = process.env.COMPETITOR_ANALYSIS_DEV_SESSION_ROLE_ID;
    }
    headers['X-Nuono-Dev-Session-Level'] = process.env.COMPETITOR_ANALYSIS_DEV_SESSION_LEVEL || '1';
  }
  return headers;
}

function assertListItemData(item) {
  assert(item, '列表商品不能为空');
  assertString(item.storeCode, '列表商品 storeCode');
  assertString(item.siteCode, '列表商品 siteCode');
  assertString(item.partnerSku || item.skuParent || item.childSku, '列表商品 SKU');
  assertNoonCode(item.selfNoonProductCode, '列表商品 selfNoonProductCode');
  assertNumber(item.activeKeywordCount, '列表商品 activeKeywordCount');
  assert(Array.isArray(item.activeKeywords), '列表商品 activeKeywords 必须是数组');
  assert(Array.isArray(item.activeKeywordStats), '列表商品 activeKeywordStats 必须是数组');
  item.activeKeywordStats.forEach((stat) => {
    assertString(stat.keyword, 'activeKeywordStats.keyword');
    assertNumber(stat.monitoredCount, 'activeKeywordStats.monitoredCount');
  });
  assertNumber(item.pendingCandidateCount, '列表商品 pendingCandidateCount');
  assertNumber(item.confirmedCompetitorCount, '列表商品 confirmedCompetitorCount');
  assertNumber(item.recent7dChangedCompetitorCount, '列表商品 recent7dChangedCompetitorCount');
  assertNumber(item.recent7dCompetitorChangeCount, '列表商品 recent7dCompetitorChangeCount');
}

function assertDetailData(detail) {
  assert(detail?.watchProduct, '详情必须返回 watchProduct');
  const product = detail.watchProduct;
  assertNumber(product.id, '详情 watchProduct.id');
  assertString(product.storeCode, '详情 storeCode');
  assertString(product.siteCode, '详情 siteCode');
  assertString(product.partnerSku || product.skuParent || product.childSku, '详情 SKU');
  assertNoonCode(product.selfNoonProductCode, '详情 selfNoonProductCode');
  assert(Array.isArray(detail.keywords) && detail.keywords.length > 0, '详情必须返回关键词');
  assert(Array.isArray(detail.candidates) && detail.candidates.length > 0, '详情必须返回候选/竞品');
  assert(Array.isArray(detail.keywordRelations), '详情 keywordRelations 必须是数组');
  assert(Array.isArray(detail.latestRankPoints) && detail.latestRankPoints.length > 0, '详情必须返回 latestRankPoints');
  detail.keywords.forEach((keyword) => {
    assertNumber(keyword.id, '关键词 id');
    assertString(keyword.keyword, '关键词 keyword');
    assertString(keyword.status, '关键词 status');
  });
  detail.candidates.forEach((candidate) => {
    assertNumber(candidate.id, '竞品 id');
    assertNoonCode(candidate.noonProductCode, '竞品 noonProductCode');
    assertString(candidate.reviewStatus, '竞品 reviewStatus');
  });
  detail.latestRankPoints.forEach(assertRankPointData);
}

function assertRankPointData(point) {
  assertNumber(point.keywordId, '排名 keywordId');
  assertString(point.keyword || point.noonProductCode, '排名 keyword/noonProductCode');
  assertNoonCode(point.noonProductCode, '排名 noonProductCode');
  assertString(point.trackedProductType, '排名 trackedProductType');
  assertString(point.rankStatus, '排名 rankStatus');
  assertString(point.factTime, '排名 factTime');
  if (String(point.rankStatus).toUpperCase() === 'RANKED') {
    assertNumber(point.rankNo, '排名 rankNo');
  } else if (point.scanDepth !== undefined && point.scanDepth !== null) {
    assertNumber(point.scanDepth, '排名 scanDepth');
  }
}

function assertChangeGroupData(group) {
  assertString(group.factDate, '变化 factDate');
  assertNoonCode(group.noonProductCode, '变化 noonProductCode');
  assertString(group.productName || group.noonProductCode, '变化 productName');
  assertString(group.subjectType, '变化 subjectType');
  assert(Array.isArray(group.changes) && group.changes.length > 0, '变化 changes 必须非空');
  group.changes.forEach((change) => {
    assertString(change.fieldKey, '变化 fieldKey');
    assertString(change.fieldLabel, '变化 fieldLabel');
    assertString(change.changeType, '变化 changeType');
  });
}

function chooseRankKeywordId(detail) {
  const rankedPoint = detail.latestRankPoints.find((point) => point.keywordId);
  if (rankedPoint?.keywordId) {
    return rankedPoint.keywordId;
  }
  return detail.keywords[0].id;
}

function assertMonotonic(items, field, direction, label) {
  for (let index = 1; index < items.length; index += 1) {
    const previous = Number(items[index - 1]?.[field] ?? 0);
    const current = Number(items[index]?.[field] ?? 0);
    if (direction === 'desc') {
      assert(previous >= current, `${label} 排序异常：${previous} < ${current}`);
    } else {
      assert(previous <= current, `${label} 排序异常：${previous} > ${current}`);
    }
  }
}

function assertString(value, label) {
  assert.equal(typeof value, 'string', `${label} 必须是字符串`);
  assert(value.trim().length > 0, `${label} 不能为空`);
}

function assertNumber(value, label) {
  assert.equal(typeof value, 'number', `${label} 必须是数字`);
  assert(Number.isFinite(value), `${label} 必须是有限数字`);
}

function assertNoonCode(value, label) {
  assertString(value, label);
  assert(/^[ZN][A-Z0-9]{4,79}$/i.test(value), `${label} 必须是 Noon Z/N 码，实际 ${value}`);
}

function boundedNumber(rawValue, fallback, min, max) {
  const parsed = Number(rawValue ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function isLoopbackBaseUrl(value) {
  try {
    const url = new URL(value);
    return ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
  }
}

await main();
