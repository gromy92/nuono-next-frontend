const baseUrl = (process.env.PROCUREMENT_BASE_URL || process.env.E2E_API_BASE_URL || 'http://127.0.0.1:18080').replace(
  /\/$/,
  ''
);

const resultUrl = process.env.PROCUREMENT_ALI_AI_RESULT_URL || '';
const useChromeRead = Boolean(resultUrl);
const defaultSampleText =
  '1688 智能询盘结果 共 5 家供应商 已回复 2 家 未回复 3 家 报价 18.2 元 MOQ 10 件 发货时间 3 天 现货 可议价';

const payload = {
  resultUrl: resultUrl || 'https://air.1688.com/kapp/1688-pc-front/ai-avatar/inquiryResult',
  externalInquiryId: process.env.PROCUREMENT_ALI_AI_INQUIRY_ID || undefined,
  sampleText: useChromeRead ? undefined : process.env.PROCUREMENT_ALI_AI_SAMPLE_TEXT || defaultSampleText,
  openIfMissing: process.env.PROCUREMENT_ALI_AI_OPEN_IF_MISSING === 'true',
  persistResult: process.env.PROCUREMENT_ALI_AI_PERSIST_RESULT === 'true',
  taskId: process.env.PROCUREMENT_ALI_AI_TASK_ID ? Number(process.env.PROCUREMENT_ALI_AI_TASK_ID) : undefined,
  operatorUserId: process.env.PROCUREMENT_OPERATOR_USER_ID ? Number(process.env.PROCUREMENT_OPERATOR_USER_ID) : undefined
};

if (payload.persistResult && !payload.taskId) {
  throw new Error('PROCUREMENT_ALI_AI_PERSIST_RESULT=true requires PROCUREMENT_ALI_AI_TASK_ID.');
}

const result = await requestJson('/api/procurement/auto-inquiry/ali-ai/result/probe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

if (!result.ready) {
  throw new Error(`Ali AI result probe is not ready: ${result.message || 'unknown reason'}`);
}
if (!result.readable) {
  throw new Error(`Ali AI result probe is not readable: ${result.message || result.replyParseError || 'unknown reason'}`);
}
if (!result.externalResultStatus || !result.replyParseStatus) {
  throw new Error(`Ali AI result probe missed status fields: ${JSON.stringify(result)}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl,
      source: result.source,
      resultUrl: result.resultUrl,
      externalInquiryId: result.externalInquiryId || null,
      externalResultStatus: result.externalResultStatus,
      replySource: result.replySource,
      replyParseStatus: result.replyParseStatus,
      supplierCount: result.supplierCount,
      repliedCount: result.repliedCount,
      noReplyCount: result.noReplyCount,
      priceMentionCount: result.priceMentionCount,
      moqMentionCount: result.moqMentionCount,
      deliveryMentionCount: result.deliveryMentionCount,
      persistedTaskId: result.persistedTaskId || null
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
