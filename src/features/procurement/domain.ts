import type {
  ProcurementBackfillCandidateInput,
  ProcurementCandidate,
  ProcurementCandidatePoolPayload,
  ProcurementCheckResult,
  ProcurementDemandItem
} from './types';

export function procurementOrderStatusMeta(status?: string) {
  if (status === 'DECIDED') {
    return { label: '全部已决策', color: 'success' as const };
  }
  if (status === 'PARTIAL_DECIDED') {
    return { label: '部分已决策', color: 'processing' as const };
  }
  if (status === 'SCREENING') {
    return { label: '筛选中', color: 'warning' as const };
  }
  return { label: status || '待处理', color: 'default' as const };
}

export function procurementTaskStatusMeta(status?: string) {
  if (status === 'SUCCESS') {
    return { label: '已完成', color: 'success' as const };
  }
  if (status === 'PARTIAL_SUCCESS') {
    return { label: '部分完成', color: 'warning' as const };
  }
  if (status === 'RUNNING') {
    return { label: '执行中', color: 'processing' as const };
  }
  if (status === 'FAILED') {
    return { label: '失败', color: 'error' as const };
  }
  if (status === 'QUEUED') {
    return { label: '排队中', color: 'default' as const };
  }
  return { label: status || '未开始', color: 'default' as const };
}

export function procurementCandidateLevelMeta(level?: string) {
  if (level === 'recommended') {
    return { label: '高推荐', color: 'success' as const };
  }
  if (level === 'review') {
    return { label: '待复核', color: 'warning' as const };
  }
  if (level === 'reject') {
    return { label: '淘汰', color: 'default' as const };
  }
  return { label: level || '待判定', color: 'default' as const };
}

export function procurementPlatformLabel(platform?: string) {
  if (platform === 'amazon') {
    return '亚马逊';
  }
  if (platform === 'noon') {
    return 'Noon';
  }
  if (platform === '1688') {
    return '1688';
  }
  return platform || '未知平台';
}

export function procurementSourceTypeLabel(sourceType?: string) {
  if (sourceType === 'LINK_LIST') {
    return '商品链接清单';
  }
  return sourceType || '-';
}

export function procurementPriorityLabel(priority?: string) {
  if (priority === 'HIGH') {
    return '高优先级';
  }
  if (priority === 'NORMAL') {
    return '常规';
  }
  if (priority === 'LOW') {
    return '低优先级';
  }
  return priority || '-';
}

export function procurementSearchModeLabel(searchMode?: string) {
  if (searchMode === 'IMAGE_MULTI') {
    return '多图图搜';
  }
  if (searchMode === 'IMAGE_SINGLE') {
    return '单图图搜';
  }
  if (searchMode === 'SEARCH_PAGE_HTML') {
    return '搜索页导入';
  }
  return searchMode || '待确认';
}

export function procurementItemStatusMeta(status?: string) {
  if (status === 'DECIDED') {
    return { label: '已选意向采购', color: 'success' as const };
  }
  if (status === 'REVIEWING') {
    return { label: '人工复核中', color: 'processing' as const };
  }
  if (status === 'SCREENING') {
    return { label: '自动筛选中', color: 'warning' as const };
  }
  return { label: status || '待处理', color: 'default' as const };
}

export function procurementNextActionMeta(nextAction?: string) {
  if (nextAction === 'INTENT') {
    return { label: '下一步：倾向采购', color: 'default' as const };
  }
  if (nextAction === 'PREPARE_INQUIRY') {
    return { label: '下一步：准备询价', color: 'processing' as const };
  }
  if (nextAction === 'HOLD') {
    return { label: '下一步：暂缓处理', color: 'warning' as const };
  }
  if (nextAction === 'CONTINUE_COMPARE') {
    return { label: '下一步：继续比对', color: 'default' as const };
  }
  return null;
}

export function procurementSourcePlatformColor(platform?: string) {
  if (platform === 'amazon') {
    return 'gold';
  }
  if (platform === 'noon') {
    return 'cyan';
  }
  if (platform === '1688') {
    return 'orange';
  }
  return 'default';
}

export function procurementItemStatusColor(status?: string) {
  if (status === 'DECIDED') {
    return 'success';
  }
  if (status === 'REVIEWING') {
    return 'processing';
  }
  if (status === 'SCREENING') {
    return 'warning';
  }
  return 'default';
}

export function procurementAutoSelectionLabel(
  demandItem?: ProcurementCandidatePoolPayload['demandItems'][number]
) {
  if (!demandItem) {
    return '自动选品';
  }
  if (demandItem.task?.status === 'RUNNING') {
    return '自动选品中';
  }
  return demandItem.candidates.length ? '重新自动选品' : '开始自动选品';
}

export function formatProcurementPriceRange(min?: number, max?: number) {
  if (typeof min === 'number' && typeof max === 'number') {
    return `${min.toFixed(2)} - ${max.toFixed(2)}`;
  }
  if (typeof min === 'number') {
    return `${min.toFixed(2)} 起`;
  }
  if (typeof max === 'number') {
    return `${max.toFixed(2)} 内`;
  }
  return '-';
}

export function parseProcurementNumberRange(rawValue?: string) {
  if (!rawValue) {
    return { min: null as number | null, max: null as number | null };
  }

  const matchedNumbers = rawValue.match(/\d+(?:\.\d+)?/g);
  if (!matchedNumbers?.length) {
    return { min: null, max: null };
  }

  const numbers = matchedNumbers
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));

  if (!numbers.length) {
    return { min: null, max: null };
  }

  return {
    min: numbers[0] ?? null,
    max: numbers.length > 1 ? numbers[1] ?? numbers[0] : numbers[0]
  };
}

export function parseProcurementLeadingInteger(rawValue?: string) {
  if (!rawValue) {
    return null;
  }

  const matched = rawValue.match(/\d+/);
  if (!matched) {
    return null;
  }

  const parsed = Number(matched[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeProcurementFieldText(rawValue?: string) {
  return sanitizeProcurementCopy(rawValue).toLowerCase().replace(/\s+/g, '');
}

export function procurementFieldTokens(rawValue?: string) {
  const normalized = sanitizeProcurementCopy(rawValue).toLowerCase();
  if (!normalized) {
    return [];
  }

  const direct = normalized.replace(/\s+/g, '');
  return Array.from(
    new Set(
      [direct, ...normalized.split(/[，,、/+\-|()（）\s]+/)]
        .map((item) => item.trim())
        .filter((item) => item.length >= 2)
    )
  );
}

export function procurementPowerMode(rawValue?: string) {
  const normalized = normalizeProcurementFieldText(rawValue);
  if (!normalized) {
    return '';
  }
  if (
    normalized.includes('充电') ||
    normalized.includes('usb') ||
    normalized.includes('电池') ||
    normalized.includes('rechargeable')
  ) {
    return '充电款';
  }
  if (normalized.includes('插电') || normalized.includes('插头') || normalized.includes('plug')) {
    return '插电款';
  }
  if (normalized.includes('无电') || normalized.includes('非电')) {
    return '无电';
  }
  if (normalized.includes('蜡烛') || normalized.includes('木炭') || normalized.includes('炭')) {
    return '蜡烛/炭';
  }
  return sanitizeProcurementCopy(rawValue);
}

export function procurementMaxDays(rawValue?: string) {
  const normalized = sanitizeProcurementCopy(rawValue);
  if (!normalized) {
    return null;
  }

  const matchedNumbers = normalized.match(/\d+/g);
  if (!matchedNumbers?.length) {
    if (normalized.includes('现货')) {
      return 3;
    }
    return null;
  }

  const numbers = matchedNumbers
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
  if (!numbers.length) {
    return null;
  }
  return Math.max(...numbers);
}

export function procurementSizeMatch(expected?: string, actual?: string) {
  const expectedText = sanitizeProcurementCopy(expected);
  const actualText = sanitizeProcurementCopy(actual);
  if (!expectedText && !actualText) {
    return {
      status: 'pending' as const,
      judgement: '尺寸信息待补充'
    };
  }
  if (!expectedText || !actualText) {
    return {
      status: 'pending' as const,
      judgement: '尺寸还不够完整'
    };
  }

  const expectedNumbers = expectedText.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const actualNumbers = actualText.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (expectedNumbers.length && actualNumbers.length) {
    const expectedValue = expectedNumbers[0] ?? 0;
    const actualValue = actualNumbers[0] ?? 0;
    const delta = Math.abs(expectedValue - actualValue);
    if (delta <= Math.max(1, expectedValue * 0.15)) {
      return {
        status: 'match' as const,
        judgement: '尺寸区间基本一致'
      };
    }
    if (delta <= Math.max(2, expectedValue * 0.3)) {
      return {
        status: 'warning' as const,
        judgement: '尺寸接近，但建议再复核'
      };
    }
    return {
      status: 'mismatch' as const,
      judgement: '尺寸明显偏离'
    };
  }

  const expectedNormalized = normalizeProcurementFieldText(expectedText);
  const actualNormalized = normalizeProcurementFieldText(actualText);
  if (expectedNormalized && actualNormalized && (actualNormalized.includes(expectedNormalized) || expectedNormalized.includes(actualNormalized))) {
    return {
      status: 'match' as const,
      judgement: '尺寸描述基本一致'
    };
  }

  const overlap = procurementFieldTokens(expectedText).some((token) => actualNormalized.includes(token));
  if (overlap) {
    return {
      status: 'warning' as const,
      judgement: '尺寸线索大体接近'
    };
  }

  return {
    status: 'mismatch' as const,
    judgement: '尺寸描述不一致'
  };
}

export function procurementTextFieldMatch(expected?: string, actual?: string, matchedLabel = '要求命中', mismatchLabel = '要求偏离') {
  const expectedText = sanitizeProcurementCopy(expected);
  const actualText = sanitizeProcurementCopy(actual);
  if (!expectedText && !actualText) {
    return {
      status: 'pending' as const,
      judgement: '信息待补充'
    };
  }
  if (!expectedText || !actualText) {
    return {
      status: 'pending' as const,
      judgement: '信息还不够完整'
    };
  }

  const actualNormalized = normalizeProcurementFieldText(actualText);
  const overlap = procurementFieldTokens(expectedText).some((token) => actualNormalized.includes(token));
  if (overlap) {
    return {
      status: 'match' as const,
      judgement: matchedLabel
    };
  }

  return {
    status: 'mismatch' as const,
    judgement: mismatchLabel
  };
}

export function procurementPowerModeMatch(expected?: string, actual?: string) {
  const expectedMode = procurementPowerMode(expected);
  const actualMode = procurementPowerMode(actual);
  if (!expectedMode && !actualMode) {
    return {
      status: 'pending' as const,
      judgement: '供电方式待补充'
    };
  }
  if (!expectedMode || !actualMode) {
    return {
      status: 'pending' as const,
      judgement: '供电方式还不够完整'
    };
  }
  if (expectedMode === actualMode) {
    return {
      status: 'match' as const,
      judgement: '供电方式一致'
    };
  }
  if (
    (expectedMode === '无电' && actualMode === '蜡烛/炭') ||
    (expectedMode === '蜡烛/炭' && actualMode === '无电')
  ) {
    return {
      status: 'warning' as const,
      judgement: '都属于非插电方向，但点火方式不同'
    };
  }
  return {
    status: 'mismatch' as const,
    judgement: '供电方式不一致'
  };
}

export function procurementDeliveryMatch(expected?: string, actual?: string) {
  const expectedDays = procurementMaxDays(expected);
  const actualDays = procurementMaxDays(actual);
  if (!expected && !actual) {
    return {
      status: 'pending' as const,
      judgement: '交期要求待补充'
    };
  }
  if (expectedDays === null || actualDays === null) {
    return {
      status: 'pending' as const,
      judgement: '交期信息还不够完整'
    };
  }
  if (actualDays <= expectedDays) {
    return {
      status: 'match' as const,
      judgement: '交期可以满足当前要求'
    };
  }
  if (actualDays <= expectedDays + 2) {
    return {
      status: 'warning' as const,
      judgement: '交期略慢，建议询价时重点确认'
    };
  }
  return {
    status: 'mismatch' as const,
    judgement: '交期偏慢，可能影响推进'
  };
}

export function procurementCheckStatusMeta(status: ProcurementCheckResult['status']) {
  if (status === 'match') {
    return { label: '命中', color: 'success' as const, background: '#f0fdf4', border: '#bbf7d0' };
  }
  if (status === 'warning') {
    return { label: '待确认', color: 'warning' as const, background: '#fffbeb', border: '#fde68a' };
  }
  if (status === 'mismatch') {
    return { label: '偏离', color: 'error' as const, background: '#fef2f2', border: '#fecaca' };
  }
  return { label: '待补', color: 'default' as const, background: '#f8fafc', border: '#e2e8f0' };
}

export function procurementStructuredFieldSourceMeta(source?: string) {
  if (source === 'AUTO_PARSED') {
    return { label: '自动解析', color: 'processing' as const };
  }
  if (source === 'MANUAL') {
    return { label: '人工维护', color: 'success' as const };
  }
  if (source === 'MIXED') {
    return { label: '混合补齐', color: 'warning' as const };
  }
  return { label: '待补字段', color: 'default' as const };
}

export function procurementEvidenceSourceMeta(sourceType?: string) {
  if (sourceType === 'MANUAL') {
    return { label: '人工维护', color: 'success' as const };
  }
  if (sourceType === 'AUTO_PARSED') {
    return { label: '自动抽取', color: 'processing' as const };
  }
  return { label: '来源待定', color: 'default' as const };
}

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
