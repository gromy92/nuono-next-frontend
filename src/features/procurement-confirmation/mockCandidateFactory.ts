import type { ProcurementCandidateRecord } from './types'

export function buildMockImage(label: string, tone: string, accent: string) {
  const safeLabel = encodeURIComponent(label)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
    <defs>
      <linearGradient id="g" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop stop-color="${tone}" offset="0%"/>
        <stop stop-color="${accent}" offset="100%"/>
      </linearGradient>
    </defs>
    <rect width="320" height="240" fill="url(#g)" rx="22"/>
    <rect x="24" y="24" width="272" height="192" rx="18" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)"/>
    <circle cx="78" cy="88" r="28" fill="rgba(255,255,255,0.75)"/>
    <rect x="118" y="62" width="124" height="16" rx="8" fill="rgba(255,255,255,0.88)"/>
    <rect x="118" y="90" width="96" height="12" rx="6" fill="rgba(255,255,255,0.5)"/>
    <rect x="48" y="150" width="224" height="24" rx="12" fill="rgba(10,20,30,0.18)"/>
    <text x="160" y="166" font-size="14" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif">${safeLabel}</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${svg}`
}

export function buildCandidate(
  overrides: Partial<ProcurementCandidateRecord>
    & Pick<ProcurementCandidateRecord, 'id' | 'offerId' | 'rankNo' | 'title'>
) {
  const rank = overrides.rankNo
  const baseScore = 88 - rank * 2
  const locationText = rank % 2 === 0 ? '义乌' : '深圳'
  const deliveryText = rank <= 3 ? '72 小时内发货' : '5-7 天发货'
  const materialText = rank >= 8 ? '金属外壳，内胆材质未写明' : '金属外壳 / 陶瓷发热仓'
  const powerModeText = rank % 2 === 0 ? 'USB 充电 / 可充电' : '可充电锂电池'
  const sizeText = rank <= 5 ? '约 10 x 10 x 14 cm' : '约 9 x 9 x 12 cm'
  const packageText = rank <= 4 ? '彩盒 / 礼盒包装' : '普通彩盒'
  const specScore = rank <= 4 ? (rank % 2 === 0 ? 16 : 14) : Math.max(6, 16 - rank)
  return {
    supplierName: `义乌样本工厂 ${rank}`,
    candidateUrl: `https://detail.1688.com/offer/${overrides.offerId}.html?offerId=${overrides.offerId}`,
    mainImageUrl: buildMockImage(`候选 ${rank}`, rank <= 3 ? '#0f766e' : '#b45309', rank <= 3 ? '#164e63' : '#7c2d12'),
    detailImageUrl: buildMockImage(`详情 ${rank}`, '#0369a1', '#0f766e'),
    deliveryImageUrl: buildMockImage(`发货 ${rank}`, '#64748b', '#334155'),
    priceText: `${18 + rank * 1.5} - ${22 + rank * 1.5} RMB`,
    moqText: `${20 * rank} 件`,
    locationText,
    deliveryText,
    resultCardText: rank <= 2 ? '图搜命中高，礼盒感接近原图。' : '规格接近，可继续进询价验证。',
    detailHighlightText: rank <= 5 ? '详情页展示便携电香炉、陶瓷仓、礼盒包装和跨境现货。' : '详情页展示电香炉基础款，包装和尺寸信息需要复核。',
    attributeSnapshotText: `材质=${materialText} | 供电方式=${powerModeText} | 尺寸=${sizeText} | 包装=${packageText}`,
    shippingSnapshotText: `${deliveryText} | 发货地=${locationText}`,
    packageSnapshotText: `${packageText} | 可贴标=${rank <= 4 ? '是' : '需询价确认'}`,
    materialText,
    powerModeText,
    sizeText,
    packageText,
    tags: rank <= 2 ? ['礼盒感强', '图搜高相似'] : ['可询价', '备选'],
    reasons: [
      rank <= 5 ? '系统图搜命中度进入前 5' : '前 10 候选，可作为人工补入来源',
      materialText.includes('陶瓷') ? '详情页识别到陶瓷发热仓' : '材质信息需要询价确认',
      packageText.includes('礼盒') ? '包装形态接近采购目标' : '包装形态需复核'
    ],
    warnings: rank >= 8 ? ['图片细节偏少'] : [],
    totalScore: baseScore,
    scores: {
      matchScore: Math.max(24, 40 - rank),
      specScore,
      priceScore: Math.max(8, 14 - Math.floor(rank / 2)),
      moqScore: specScore,
      supplierScore: Math.max(7, 14 - Math.floor(rank / 2)),
      deliveryScore: Math.max(6, 12 - Math.floor(rank / 3))
    },
    inPool: rank <= 5,
    poolRankNo: rank <= 5 ? rank : null,
    inquiryStatus: 'BACKUP_POOL',
    replySummary: '尚未进入自动询价。',
    finalPick: null,
    candidateId: overrides.id,
    ...overrides
  } satisfies ProcurementCandidateRecord
}
