export const PROFIT_PENDING_SCENARIOS = [
  {
    key: 'missing-specs',
    candidateId: 43004,
    title: '充电发香器 头发衣物熏香款',
    expectedCardText: '待补：长度 / 宽度 / 高度',
    expectedAlertText: '待补字段：长度 / 宽度 / 高度',
    expectedRetainedText: '已保留字段： 目标站点 / 目标售价 / 采购单价 / 重量',
    expectedFormValues: {
      salePrice: '16.00', purchasePrice: '14.20', lengthCm: '', widthCm: '', heightCm: '', weightGrams: '280.00'
    }
  },
  {
    key: 'missing-weight',
    candidateId: 43005,
    title: '便携式充电电熏香炉 轻奢礼品款',
    expectedCardText: '待补：重量',
    expectedAlertText: '待补字段：重量',
    expectedRetainedText: '已保留字段： 目标站点 / 目标售价 / 采购单价 / 长度 / 宽度 / 高度',
    expectedFormValues: {
      salePrice: '16.00', purchasePrice: '14.85', lengthCm: '18.00', widthCm: '8.00', heightCm: '8.00', weightGrams: ''
    }
  }
];

export function normalizeProfitPendingText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function parseNumberRange(rawValue) {
  const numbers = (rawValue?.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter(Number.isFinite);
  return { min: numbers[0] ?? null, max: numbers.length > 1 ? numbers[1] ?? numbers[0] : numbers[0] ?? null };
}

function midpointPrice(min, max) {
  if (typeof min === 'number' && typeof max === 'number') return Number(((min + max) / 2).toFixed(2));
  if (typeof min === 'number') return Number(min.toFixed(2));
  if (typeof max === 'number') return Number(max.toFixed(2));
  return undefined;
}

function collectCandidateTexts(candidate) {
  return [
    candidate?.title,
    candidate?.standardizedPriceText,
    candidate?.priceText,
    candidate?.resultCardText,
    candidate?.detailHighlightText,
    candidate?.attributeSnapshotText,
    candidate?.shippingSnapshotText,
    candidate?.packageSnapshotText,
    candidate?.standardizedSizeText,
    candidate?.sizeText,
    candidate?.standardizedPackageText,
    candidate?.packageText,
    candidate?.standardizedDeliveryText,
    candidate?.deliveryTimelineText,
    candidate?.materialText,
    candidate?.powerModeText,
    ...(candidate?.reasons || []),
    ...(candidate?.warnings || []),
    ...(candidate?.badges || []),
    ...((candidate?.extractionEvidences || []).flatMap((item) => [item?.fieldValue, item?.evidenceText]))
  ].filter((item) => typeof item === 'string' && item.trim());
}

function parseDimensions(texts) {
  for (const text of texts) {
    const matched = text.replace(/[×X*]/g, 'x').match(
      /(\d+(?:\.\d+)?)\s*(?:cm|厘米)?\s*x\s*(\d+(?:\.\d+)?)\s*(?:cm|厘米)?\s*x\s*(\d+(?:\.\d+)?)\s*(?:cm|厘米)?/i
    );
    if (matched) {
      return {
        lengthCm: Number(matched[1]),
        widthCm: Number(matched[2]),
        heightCm: Number(matched[3]),
        sourceText: text
      };
    }
  }
  return null;
}

function parseWeightGrams(texts) {
  for (const text of texts) {
    const matched = text.match(/(\d+(?:\.\d+)?)\s*(kg|公斤|千克|g|克)\b/i);
    const numericValue = Number(matched?.[1]);
    if (!matched || !Number.isFinite(numericValue)) continue;
    const unit = matched[2].toLowerCase();
    return unit === 'kg' || unit === '公斤' || unit === '千克'
      ? Number((numericValue * 1000).toFixed(2))
      : Number(numericValue.toFixed(2));
  }
  return undefined;
}

export function findProfitPendingScenarioCandidates(candidatePool) {
  const demandItem = (candidatePool.demandItems || []).find((item) => item.id === 41002);
  if (!demandItem) throw new Error('candidate-pool missing demand item 41002');
  return PROFIT_PENDING_SCENARIOS.map((scenario) => {
    const candidate = (demandItem.candidates || []).find((item) => item.id === scenario.candidateId);
    if (!candidate) throw new Error(`candidate-pool missing candidate ${scenario.candidateId}`);
    const candidatePriceRange = parseNumberRange(candidate.standardizedPriceText || candidate.priceText);
    const texts = collectCandidateTexts(candidate);
    return {
      scenario,
      demandItem,
      candidate,
      salePrice: midpointPrice(demandItem.targetPriceMin, demandItem.targetPriceMax),
      purchasePrice: midpointPrice(candidatePriceRange.min, candidatePriceRange.max),
      dimensions: parseDimensions(texts),
      weightGrams: parseWeightGrams(texts),
      collectedTexts: texts
    };
  });
}

export function expectedProfitPendingMissingFields(snapshot) {
  const missing = [];
  if (!snapshot.dimensions) missing.push('lengthCm', 'widthCm', 'heightCm');
  if (typeof snapshot.weightGrams !== 'number') missing.push('weightGrams');
  return missing;
}
