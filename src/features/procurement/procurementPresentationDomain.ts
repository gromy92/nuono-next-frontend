import type {
  ProcurementBackfillCandidateInput,
  ProcurementCandidate,
  ProcurementCandidatePoolPayload,
  ProcurementDemandItem
} from './types';

export const procurementDemandTitleOverrides: Record<number, string> = {
  41001: '可充电古兰经音箱电熏香炉',
  41002: '便携式充电头发衣物熏香炉',
  41003: '阿拉伯风迷你香炉摆件',
  41004: '家用陶瓷电熏香炉',
  41005: '便携式可充电陶瓷仓电熏香炉'
};

export const procurementCandidateTitleOverrides: Record<number, string> = {
  43001: '可充电古兰经音箱礼盒电熏香炉',
  43002: '家用电子遥控熏香炉',
  43003: '基础款电子熏香炉',
  43004: '充电发香器 头发衣物熏香款',
  43005: '便携式充电电熏香炉 轻奢礼品款',
  43006: '头发衣物熏香机 简化款',
  43007: '12 厘米阿拉伯风迷你香炉摆件',
  43008: '阿拉伯风桌面小香座摆件',
  43009: '家居落地大香炉摆件',
  43010: '陶瓷家用插电式电熏香炉'
};

export function sanitizeProcurementCopy(rawValue?: string) {
  if (!rawValue) {
    return '';
  }

  return rawValue
    .replace(/Quran speaker/gi, '古兰经音箱')
    .replace(/Remote Control/gi, '遥控')
    .replace(/\bUSB\b/gi, '充电')
    .replace(/\bMOQ\b/gi, '起订量')
    .replace(/\bcm\b/gi, '厘米')
    .replace(/Rechargeable/gi, '可充电')
    .replace(/Portable/gi, '便携式')
    .replace(/Electric/gi, '电动')
    .replace(/Luxury/gi, '轻奢')
    .replace(/Mini/gi, '迷你')
    .replace(/Arabic/gi, '阿拉伯风')
    .replace(/Home and Office/gi, '家用办公')
    .replace(/Hair/gi, '头发')
    .replace(/Incense Burner/gi, '熏香炉')
    .replace(/\s+/g, ' ')
    .trim();
}

export function procurementDisplayText(rawValue?: string) {
  return sanitizeProcurementCopy(rawValue) || '-';
}

export function procurementDisplayArray(rawValues?: string[]) {
  return (rawValues ?? []).map((item) => sanitizeProcurementCopy(item)).filter(Boolean);
}

export function procurementDemandDisplayTitle(item?: ProcurementCandidatePoolPayload['demandItems'][number]) {
  if (!item) {
    return '未命名需求';
  }
  return procurementDemandTitleOverrides[item.id] || sanitizeProcurementCopy(item.sourceTitle) || '未命名需求';
}

export function procurement1688SearchKeyword(item?: ProcurementCandidatePoolPayload['demandItems'][number]) {
  const title = procurementDemandDisplayTitle(item);
  return title
    .replace(/[()（）[\]【】/\\|,，。:：;；·•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function procurement1688SearchUrl(item?: ProcurementCandidatePoolPayload['demandItems'][number]) {
  const keyword = procurement1688SearchKeyword(item);
  if (!keyword || keyword === '未命名需求') {
    return undefined;
  }
  return `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(keyword)}`;
}

export function buildProcurementBackfillDraftCandidate(): ProcurementBackfillCandidateInput {
  return {
    candidateUrl: '',
    title: '',
    supplierName: '',
    priceText: '',
    moqText: '',
    locationText: '',
    resultCardText: '',
    detailHighlightText: '',
    attributeSnapshotText: '',
    shippingSnapshotText: '',
    packageSnapshotText: '',
    mainImageUrl: ''
  };
}

export function procurementCandidateDisplayTitle(candidate?: ProcurementCandidatePoolPayload['demandItems'][number]['candidates'][number]) {
  if (!candidate) {
    return '未命名候选商品';
  }
  return procurementCandidateTitleOverrides[candidate.id] || sanitizeProcurementCopy(candidate.title) || '未命名候选商品';
}

export function procurementRequirementText(rawValue?: string) {
  return sanitizeProcurementCopy(rawValue) || '当前没有采购要求，后续可继续补充。';
}

export function procurementCandidatePriceText(candidate?: ProcurementCandidatePoolPayload['demandItems'][number]['candidates'][number]) {
  return procurementDisplayText(candidate?.standardizedPriceText || candidate?.priceText);
}

export function procurementCandidateMoqText(candidate?: ProcurementCandidatePoolPayload['demandItems'][number]['candidates'][number]) {
  return procurementDisplayText(candidate?.standardizedMoqText || candidate?.moqText);
}

export function procurementCandidateMaterialText(candidate?: ProcurementCandidatePoolPayload['demandItems'][number]['candidates'][number]) {
  return procurementDisplayText(candidate?.standardizedMaterialText || candidate?.materialText);
}

export function procurementCandidatePowerModeText(candidate?: ProcurementCandidatePoolPayload['demandItems'][number]['candidates'][number]) {
  return procurementDisplayText(candidate?.standardizedPowerModeText || candidate?.powerModeText);
}

export function procurementCandidateSizeText(candidate?: ProcurementCandidatePoolPayload['demandItems'][number]['candidates'][number]) {
  return procurementDisplayText(candidate?.standardizedSizeText || candidate?.sizeText);
}

export function procurementCandidatePackageText(candidate?: ProcurementCandidatePoolPayload['demandItems'][number]['candidates'][number]) {
  return procurementDisplayText(candidate?.standardizedPackageText || candidate?.packageText);
}

export function procurementCandidateDeliveryText(candidate?: ProcurementCandidatePoolPayload['demandItems'][number]['candidates'][number]) {
  return procurementDisplayText(candidate?.standardizedDeliveryText || candidate?.deliveryTimelineText);
}

export function procurementCandidatePendingQuestions(candidate?: ProcurementCandidatePoolPayload['demandItems'][number]['candidates'][number]) {
  const questions = procurementDisplayArray(candidate?.pendingQuestions);
  return questions.length ? questions : ['当前基础信息已齐，可直接围绕价格明细、样品和交期进入询价。'];
}

export function procurementCandidateGroupTypeMeta(groupType?: string) {
  if (groupType === 'SAME_OFFER') {
    return { label: '同链接/同款', color: 'success' as const };
  }
  if (groupType === 'SAME_VISUAL') {
    return { label: '同图候选', color: 'processing' as const };
  }
  if (groupType === 'SUPPLIER_SERIES') {
    return { label: '同供应商系列', color: 'warning' as const };
  }
  if (groupType === 'SIMILAR_SPEC') {
    return { label: '相似规格', color: 'default' as const };
  }
  return { label: '独立候选', color: 'default' as const };
}

export function procurementImageModeMeta(mode?: 'real' | 'generated') {
  if (mode === 'real') {
    return { label: '真实图片', color: 'success' as const, note: '已接入真实商品图' };
  }
  return { label: '示意图', color: 'default' as const, note: '真实商品图待接入' };
}

export function procurementCandidateInquiryQuestions(candidate?: ProcurementCandidate) {
  const items = procurementDisplayArray(candidate?.inquiryQuestions);
  return items.length ? items : procurementCandidatePendingQuestions(candidate);
}

export function procurementCandidateQuoteChecklist(candidate?: ProcurementCandidate) {
  const items = procurementDisplayArray(candidate?.quoteChecklist);
  return items.length
    ? items
    : ['请确认阶梯报价、包装口径、样品费用和大货交期。'];
}

export function procurementCandidateSampleChecklist(candidate?: ProcurementCandidate) {
  const items = procurementDisplayArray(candidate?.sampleChecklist);
  return items.length
    ? items
    : ['先核验外观、材质、做工和包装完整度。'];
}

export function buildProcurementInquiryCopyText(demandItem?: ProcurementDemandItem, candidate?: ProcurementCandidate) {
  if (!demandItem || !candidate) {
    return '';
  }

  const lines = [
    demandItem.sourceTitle ? `询价商品：${procurementDemandDisplayTitle(demandItem)}` : '',
    candidate.title ? `候选商品：${procurementCandidateDisplayTitle(candidate)}` : '',
    candidate.supplierName ? `供应商：${sanitizeProcurementCopy(candidate.supplierName)}` : '',
    candidate.candidateUrl ? `候选链接：${candidate.candidateUrl}` : '',
    candidate.inquiryOpeningLine ? `开场话术：${sanitizeProcurementCopy(candidate.inquiryOpeningLine)}` : '',
    candidate.inquirySummaryLine ? `当前口径：${sanitizeProcurementCopy(candidate.inquirySummaryLine)}` : '',
    '',
    '本轮必须确认：',
    ...procurementCandidateInquiryQuestions(candidate).map((item, index) => `${index + 1}. ${item}`),
    '',
    '报价要求：',
    ...procurementCandidateQuoteChecklist(candidate).map((item, index) => `${index + 1}. ${item}`),
    '',
    '样品核验：',
    ...procurementCandidateSampleChecklist(candidate).map((item, index) => `${index + 1}. ${item}`)
  ].filter(Boolean);

  return lines.join('\n');
}

export async function copyProcurementText(text: string) {
  if (!text) {
    return false;
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
}
