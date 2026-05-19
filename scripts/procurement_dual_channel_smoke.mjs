const baseUrl = (process.env.PROCUREMENT_BASE_URL || process.env.E2E_API_BASE_URL || 'http://127.0.0.1:18080').replace(
  /\/$/,
  ''
);
const ownerUserId = process.env.PROCUREMENT_OWNER_USER_ID || '10002';
const explicitDemandItemId = process.env.PROCUREMENT_DEMAND_ITEM_ID;
const allowRealSend = process.env.PROCUREMENT_SMOKE_REAL_SEND === 'true';

if (allowRealSend) {
  throw new Error(
    'This smoke only validates dual-channel data wiring. Real 1688 sending must be executed through the controlled backend send smoke with an explicit account, supplier, and message.'
  );
}

const requiredPoolItemFields = [
  'plannedChannel',
  'activeChannel',
  'channelFallbackReason',
  'externalInquiryId',
  'externalInquiryUrl',
  'externalResultStatus',
  'replySource',
  'replyParseStatus',
  'replyParseError'
];

async function main() {
  const demandItemId = explicitDemandItemId || (await resolveDemandItemId());
  const detail = await requestJson(
    `/api/procurement/requirement-confirmation/demands/${encodeURIComponent(demandItemId)}?ownerUserId=${encodeURIComponent(
      ownerUserId
    )}`
  );

  if (!detail.ready) {
    throw new Error(`Procurement detail is not ready: ${detail.message || 'unknown reason'}`);
  }

  const poolItems = detail.pool?.items || [];
  if (!poolItems.length) {
    throw new Error(`Demand ${demandItemId} has no current pool items. Initialize the candidate pool first.`);
  }

  const invalidItems = poolItems
    .map((item) => {
      const missingFields = requiredPoolItemFields.filter((field) => !Object.prototype.hasOwnProperty.call(item, field));
      return { poolItemId: item.poolItemId, missingFields };
    })
    .filter((item) => item.missingFields.length);

  if (invalidItems.length) {
    throw new Error(`Dual-channel fields are missing: ${JSON.stringify(invalidItems)}`);
  }

  const summary = poolItems.map((item) => ({
    poolItemId: item.poolItemId,
    candidateId: item.candidateId,
    inquiryTaskId: item.inquiryTaskId,
    plannedChannel: item.plannedChannel || null,
    activeChannel: item.activeChannel || null,
    channelFallbackReason: item.channelFallbackReason || null,
    externalInquiryId: item.externalInquiryId || null,
    externalResultStatus: item.externalResultStatus || null,
    replySource: item.replySource || null,
    replyParseStatus: item.replyParseStatus || null
  }));

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        ownerUserId,
        demandItemId,
        checkedPoolItemCount: poolItems.length,
        items: summary
      },
      null,
      2
    )
  );
}

async function resolveDemandItemId() {
  const list = await requestJson(
    `/api/procurement/requirement-confirmation/demands?ownerUserId=${encodeURIComponent(
      ownerUserId
    )}&page=1&pageSize=10`
  );
  if (!list.ready) {
    throw new Error(`Procurement list is not ready: ${list.message || 'unknown reason'}`);
  }
  const firstWithPool = (list.items || []).find((item) => item.poolId);
  if (!firstWithPool?.demandItemId) {
    throw new Error('No procurement demand with a current candidate pool was found.');
  }
  return String(firstWithPool.demandItemId);
}

async function requestJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status} ${path}: ${body.slice(0, 500)}`);
  }
  return response.json();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
