const baseUrl = (process.env.PROCUREMENT_BASE_URL || process.env.E2E_API_BASE_URL || 'http://127.0.0.1:18080').replace(
  /\/$/,
  ''
);

const offerUrls = (process.env.PROCUREMENT_ALI_AI_OFFER_URLS ||
  'https://detail.1688.com/offer/798448779771.html,https://detail.1688.com/offer/737571290648.html')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const payload = {
  taskId: process.env.PROCUREMENT_ALI_AI_TASK_ID ? Number(process.env.PROCUREMENT_ALI_AI_TASK_ID) : undefined,
  operatorUserId: process.env.PROCUREMENT_OPERATOR_USER_ID ? Number(process.env.PROCUREMENT_OPERATOR_USER_ID) : undefined,
  offerUrls,
  quantity: Number(process.env.PROCUREMENT_ALI_AI_QUANTITY || '10'),
  inquiryMessage:
    process.env.PROCUREMENT_ALI_AI_CREATE_MESSAGE ||
    '你好,这个产品我需要10个, 您能给到的最低价是多少, 发货时间是多少?',
  dryRun: process.env.PROCUREMENT_ALI_AI_CREATE_DRY_RUN !== 'false',
  confirmCreate: process.env.PROCUREMENT_ALI_AI_CONFIRM_CREATE === 'true',
  persistPlan: process.env.PROCUREMENT_ALI_AI_PERSIST_PLAN === 'true'
};

if (payload.persistPlan && !payload.taskId) {
  throw new Error('PROCUREMENT_ALI_AI_PERSIST_PLAN=true requires PROCUREMENT_ALI_AI_TASK_ID.');
}

const result = await requestJson('/api/procurement/auto-inquiry/ali-ai/create/probe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

if (!result.ready) {
  throw new Error(`Ali AI create probe is not ready: ${result.message || 'unknown reason'}`);
}
if (!result.createPayloadDigest || !result.offerCount) {
  throw new Error(`Ali AI create probe did not build a valid plan: ${JSON.stringify(result)}`);
}
if (!result.dryRun && result.creationAllowed) {
  throw new Error('Real Ali AI creation unexpectedly became allowed in smoke.');
}
if (payload.dryRun && result.failureCode !== 'ALI_AI_CREATE_DRY_RUN') {
  throw new Error(`Expected dry-run guard, got ${result.failureCode || 'none'}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl,
      dryRun: result.dryRun,
      createEnabled: result.createEnabled,
      confirmCreate: result.confirmCreate,
      creationAllowed: result.creationAllowed,
      failureCode: result.failureCode || null,
      blockedReason: result.blockedReason || null,
      offerCount: result.offerCount,
      quantity: result.quantity,
      plannedChannel: result.plannedChannel,
      activeChannel: result.activeChannel,
      createPayloadDigest: result.createPayloadDigest,
      persisted: result.persisted
    },
    null,
    2
  )
);

async function requestJson(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status} ${path}: ${body.slice(0, 500)}`);
  }
  return response.json();
}
