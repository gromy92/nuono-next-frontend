const baseUrl = (process.env.PROCUREMENT_BASE_URL || process.env.E2E_API_BASE_URL || 'http://127.0.0.1:18080').replace(
  /\/$/,
  ''
);

const pageUrl = process.env.PROCUREMENT_ALI_AI_CREATE_PAGE_URL || '';
const useChromeRead = Boolean(pageUrl);
const defaultSampleHtml = `
  <main>
    <h1>1688 智能询盘</h1>
    <textarea placeholder="请输入询价内容，例如最低价、MOQ、发货时间"></textarea>
    <input name="offerUrls" placeholder="粘贴1688商品链接，支持批量" />
    <input name="quantity" placeholder="采购数量" />
    <button type="button">发起询价</button>
  </main>
`;

const payload = {
  pageUrl: pageUrl || 'https://air.1688.com/kapp/1688-pc-front/ai-avatar/inquiryCreate',
  sampleHtml: useChromeRead ? undefined : process.env.PROCUREMENT_ALI_AI_CREATE_PAGE_SAMPLE_HTML || defaultSampleHtml,
  openIfMissing: process.env.PROCUREMENT_ALI_AI_OPEN_IF_MISSING === 'true'
};

const result = await requestJson('/api/procurement/auto-inquiry/ali-ai/create/page-probe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

if (!result.ready) {
  throw new Error(`Ali AI create page probe is not ready: ${result.message || 'unknown reason'}`);
}
if (!result.readable) {
  throw new Error(`Ali AI create page probe is not readable: ${result.message || result.failureCode || 'unknown reason'}`);
}
if (!result.submitCandidateCount) {
  throw new Error(`Ali AI create page probe missed submit control: ${JSON.stringify(result)}`);
}
if (!result.offerInputCandidateCount) {
  throw new Error(`Ali AI create page probe missed offer input: ${JSON.stringify(result)}`);
}
if (!result.messageInputCandidateCount) {
  throw new Error(`Ali AI create page probe missed inquiry message input: ${JSON.stringify(result)}`);
}
if (!result.createPageLikely) {
  throw new Error(`Ali AI create page probe did not classify page as likely create page: ${JSON.stringify(result)}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl,
      source: result.source,
      pageUrl: result.pageUrl,
      pageTitle: result.pageTitle,
      loginRequired: result.loginRequired,
      createPageLikely: result.createPageLikely,
      elementCount: result.elementCount,
      buttonCount: result.buttonCount,
      inputCount: result.inputCount,
      textareaCount: result.textareaCount,
      submitCandidateCount: result.submitCandidateCount,
      offerInputCandidateCount: result.offerInputCandidateCount,
      messageInputCandidateCount: result.messageInputCandidateCount,
      quantityInputCandidateCount: result.quantityInputCandidateCount,
      highRiskControls: (result.elements || [])
        .filter((item) => item.riskLevel === 'HIGH')
        .map((item) => ({
          tagName: item.tagName,
          type: item.type || null,
          text: item.text || null,
          placeholder: item.placeholder || null,
          category: item.category
        }))
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
