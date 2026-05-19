import type {
  ProcurementCandidateRecord,
  ProcurementRequirementRecord,
  ProcurementFeedbackEntry,
  ProcurementMockRole,
  PreviewScenario
} from './types';

function buildMockImage(label: string, tone: string, accent: string) {
  const safeLabel = encodeURIComponent(label);
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
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${svg}`;
}

function buildCandidate(overrides: Partial<ProcurementCandidateRecord> & Pick<ProcurementCandidateRecord, 'id' | 'offerId' | 'rankNo' | 'title'>) {
  const rank = overrides.rankNo;
  const baseScore = 88 - rank * 2;
  const locationText = rank % 2 === 0 ? '义乌' : '深圳';
  const deliveryText = rank <= 3 ? '72 小时内发货' : '5-7 天发货';
  const materialText = rank >= 8 ? '金属外壳，内胆材质未写明' : '金属外壳 / 陶瓷发热仓';
  const powerModeText = rank % 2 === 0 ? 'USB 充电 / 可充电' : '可充电锂电池';
  const sizeText = rank <= 5 ? '约 10 x 10 x 14 cm' : '约 9 x 9 x 12 cm';
  const packageText = rank <= 4 ? '彩盒 / 礼盒包装' : '普通彩盒';
  const specScore = rank <= 4 ? (rank % 2 === 0 ? 16 : 14) : Math.max(6, 16 - rank);
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
  } satisfies ProcurementCandidateRecord;
}

function createEditingCandidates() {
  return [
    buildCandidate({
      id: 'cand-01',
      offerId: '798448779771',
      rankNo: 1,
      title: '便携电香炉礼盒款',
      tags: ['默认入池', '图搜最接近'],
      warnings: [],
      inquiryStatus: 'IN_POOL_WAITING_REPLY',
      replySummary: '首条询价已发出，等待供应商回复。',
      nextFollowUpAt: '15 分钟后若无回复，自动补发“在吗亲”。'
    }),
    buildCandidate({
      id: 'cand-02',
      offerId: '798448779772',
      rankNo: 2,
      title: '阿拉伯风熏香炉礼品套装',
      tags: ['礼盒完整', '价格可谈'],
      inquiryStatus: 'FOLLOW_UP_1_SENT',
      replySummary: '15 分钟未回复，已发送第一次催发“在吗亲”。',
      nextFollowUpAt: '30 分钟后'
    }),
    buildCandidate({
      id: 'cand-03',
      offerId: '798448779773',
      rankNo: 3,
      title: 'USB 电热熏香炉香薰套装',
      moqText: '30 件',
      tags: ['MOQ 友好', '可直接询价'],
      inquiryStatus: 'REPLIED',
      replySummary: '已回复：单价 21.3 RMB，MOQ 30 件，可支持礼盒贴牌。',
      latestReplyAt: '2026-04-28 16:12',
      quotePrice: '21.3 RMB',
      quoteMoq: '30 件',
      quoteDelivery: '3 天发货'
    }),
    buildCandidate({
      id: 'cand-04',
      offerId: '798448779774',
      rankNo: 4,
      title: '高脚金属香炉礼盒版',
      deliveryText: '48 小时内发货',
      tags: ['发货快', '包装完整'],
      inquiryStatus: 'IN_POOL_WAITING_REPLY',
      replySummary: '首条询价已发出，等待供应商回复。',
      nextFollowUpAt: '15 分钟后若无回复，自动补发“在吗亲”。'
    }),
    buildCandidate({
      id: 'cand-05',
      offerId: '798448779775',
      rankNo: 5,
      title: '中东礼品电香炉香薰炉',
      warnings: ['详情页参数图不完整'],
      inquiryStatus: 'IN_POOL_WAITING_SEND',
      replySummary: '已进入待选池，等待发送首条询价。',
      nextFollowUpAt: '待系统首发'
    }),
    buildCandidate({
      id: 'cand-06',
      offerId: '798448779776',
      rankNo: 6,
      title: '桌面香薰炉电热款',
      inPool: false,
      poolRankNo: null
    }),
    buildCandidate({
      id: 'cand-07',
      offerId: '798448779777',
      rankNo: 7,
      title: '可充电便携熏香炉',
      inPool: false,
      poolRankNo: null
    }),
    buildCandidate({
      id: 'cand-08',
      offerId: '798448779778',
      rankNo: 8,
      title: '香炉礼盒电镀金款',
      inPool: false,
      poolRankNo: null,
      warnings: ['价格略高', '外箱信息不完整']
    }),
    buildCandidate({
      id: 'cand-09',
      offerId: '798448779779',
      rankNo: 9,
      title: '豪华礼盒香炉 1688 样品款',
      inPool: false,
      poolRankNo: null,
      priceText: '32 - 35 RMB'
    }),
    buildCandidate({
      id: 'cand-10',
      offerId: '798448779780',
      rankNo: 10,
      title: '入门款小型电香炉',
      inPool: false,
      poolRankNo: null,
      moqText: '200 件',
      warnings: ['MOQ 偏高']
    })
  ];
}

function createRunningCandidates() {
  return [
    buildCandidate({
      id: 'cand-11',
      offerId: '798448779811',
      rankNo: 1,
      title: '礼盒便携电香炉升级款',
      inquiryStatus: 'IN_POOL_WAITING_REPLY',
      replySummary: '首条询价已发出，等待供应商回复。',
      nextFollowUpAt: '2026-04-28 16:55',
      finalPick: null
    }),
    buildCandidate({
      id: 'cand-12',
      offerId: '798448779812',
      rankNo: 2,
      title: '中东礼品香炉便携套装',
      inquiryStatus: 'FOLLOW_UP_1_SENT',
      replySummary: '15 分钟未回复，已发送第一次催发“在吗亲”。',
      nextFollowUpAt: '2026-04-28 17:25'
    }),
    buildCandidate({
      id: 'cand-13',
      offerId: '798448779813',
      rankNo: 3,
      title: '电热香炉大礼盒款',
      inquiryStatus: 'REPLIED',
      replySummary: '已回复：可做礼盒定制，单价 21.5 RMB，MOQ 60 件。',
      latestReplyAt: '2026-04-28 16:08',
      quotePrice: '21.5 RMB',
      quoteMoq: '60 件',
      quoteDelivery: '3 天发货'
    }),
    buildCandidate({
      id: 'cand-14',
      offerId: '798448779814',
      rankNo: 4,
      title: '铝合金桌面香炉礼品版',
      inquiryStatus: 'PARTIAL_REPLY',
      replySummary: '已回复，但仅给出 MOQ 和材质，未明确报价。',
      latestReplyAt: '2026-04-28 15:42',
      quoteMoq: '80 件'
    }),
    buildCandidate({
      id: 'cand-15',
      offerId: '798448779815',
      rankNo: 5,
      title: '跨境电香炉礼盒样品',
      inquiryStatus: 'FOLLOW_UP_2_SENT',
      replySummary: '30 分钟后第二次催发已发出，仍待回复。',
      nextFollowUpAt: '2026-04-28 20:30'
    }),
    ...createEditingCandidates()
      .slice(5)
      .map((item, index) => ({
        ...item,
        id: `cand-run-${index + 6}`,
        rankNo: index + 6,
        inPool: false,
        poolRankNo: null
      }))
  ];
}

function createSummaryReadyCandidates() {
  const selectedPool = [
    buildCandidate({
      id: 'cand-21',
      offerId: '798448779821',
      rankNo: 1,
      title: '礼盒电香炉现货款',
      inquiryStatus: 'CLOSED',
      replySummary: '已回复：报价 20.8 RMB，MOQ 50 件，72 小时发货。',
      latestReplyAt: '2026-04-27 18:12',
      quotePrice: '20.8 RMB',
      quoteMoq: '50 件',
      quoteDelivery: '72 小时',
      finalPick: 'PRIMARY'
    }),
    buildCandidate({
      id: 'cand-22',
      offerId: '798448779822',
      rankNo: 2,
      title: '中东礼盒香炉金边款',
      inquiryStatus: 'CLOSED',
      replySummary: '已回复：报价 21.4 RMB，MOQ 60 件，可支持礼盒贴牌。',
      latestReplyAt: '2026-04-27 18:55',
      quotePrice: '21.4 RMB',
      quoteMoq: '60 件',
      quoteDelivery: '4 天',
      finalPick: 'BACKUP'
    }),
    buildCandidate({
      id: 'cand-23',
      offerId: '798448779823',
      rankNo: 3,
      title: '便携熏香炉礼品款',
      inquiryStatus: 'CLOSED',
      replySummary: '已回复：单价合理，但包装工艺一般。',
      latestReplyAt: '2026-04-27 17:32',
      quotePrice: '19.9 RMB',
      quoteMoq: '100 件',
      quoteDelivery: '3 天'
    }),
    buildCandidate({
      id: 'cand-24',
      offerId: '798448779824',
      rankNo: 4,
      title: '香薰炉家居礼盒版',
      inquiryStatus: 'NO_REPLY_HANDOFF',
      replySummary: '24 小时无回复，已要求人工介入。'
    }),
    buildCandidate({
      id: 'cand-25',
      offerId: '798448779825',
      rankNo: 5,
      title: '桌面电热香炉礼盒升级款',
      inquiryStatus: 'REPLY_PARSE_FAILED',
      replySummary: '供应商回复有图片和语音，结构化报价解析失败。'
    })
  ];

  return [
    ...selectedPool,
    ...createEditingCandidates()
      .slice(5)
      .map((item, index) => ({
        ...item,
        id: `cand-sum-${index + 6}`,
        rankNo: index + 6,
        inPool: false,
        poolRankNo: null
      }))
  ];
}

export const procurementRequirementRoleOptions: Array<{ label: string; value: ProcurementMockRole }> = [
  { label: '采购', value: 'buyer' },
  { label: '运营', value: 'operations' },
  { label: '运营管理', value: 'ops-manager' }
];

export const procurementRequirementScenarioOptions: Array<{ label: string; value: PreviewScenario }> = [
  { label: '正常', value: 'normal' },
  { label: '加载', value: 'loading' },
  { label: '空状态', value: 'empty' },
  { label: '报错', value: 'error' },
  { label: '权限不足', value: 'forbidden' }
];

export function createMockDemandBatches(): ProcurementRequirementRecord[] {
  return [
    {
      id: 'dem-01',
      poolId: 'pool-01',
      hasPool: true,
      demandNo: 'PC-20260428-01',
      orderNo: 'PO-20260428-0916',
      poolVersion: 1,
      demandTitle: '阿拉伯风便携电香炉礼盒采购',
      searchKeyword: '电香炉 礼盒 阿拉伯 便携',
      sourcePlatform: 'Noon',
      sourceUrl: 'https://www.noon.com/uae-en/sample-burner-gift-set',
      sourceTitle: '阿拉伯风便携电香炉礼盒采购',
      sourceImageUrl: buildMockImage('Noon 主图', '#1d4ed8', '#0f766e'),
      sourceCollectionStatus: 'SUCCESS',
      sourceCollectedAt: '2026-04-28 09:20',
      sourceCollectionMessage: '源头商品标题、图片和详情已采集。',
      referenceImageUrl: buildMockImage('参考图', '#2563eb', '#1d4ed8'),
      packageImageUrl: buildMockImage('包装图', '#0f766e', '#164e63'),
      candidateCollectionStatus: 'SUCCESS',
      candidateCount: 10,
      recommendedCandidateCount: 5,
      candidateCollectionMethod: '1688 图搜 / 候选采集',
      candidateCollectedAt: '2026-04-28 09:38',
      candidateCollectionMessage: '已读取 1688 候选采集结果。',
      targetPriceMin: 18.5,
      targetPriceMax: 24.0,
      targetQuantity: 120,
      expectedDelivery: '首批 7 天内发往义乌集货仓',
      targetSite: 'AE / SA',
      specialRequirement: '礼盒感必须到位，外观接近 Noon 爆款，优先低 MOQ 可试单工厂。',
      targetMaterial: '金属外壳 / 陶瓷发热仓',
      targetPowerMode: 'USB 充电 / 可充电',
      targetSizeText: '便携桌面款，约 10 x 10 x 14 cm',
      targetPackageType: '彩盒 / 礼盒包装',
      ownerName: '张敏 / 运营',
      status: 'POOL_INQUIRY_RUNNING',
      top10Count: 10,
      createdAt: '2026-04-28 09:16',
      updatedAt: '2026-04-28 16:18',
      pendingConfirmations: [],
      resultNotice: '系统已自动把前 5 条加入待选池并发起询价；待选池最多 5 个，补入备选前请先移出一个待选候选。',
      candidates: createEditingCandidates()
    },
    {
      id: 'dem-02',
      poolId: 'pool-02',
      hasPool: true,
      demandNo: 'PC-20260428-02',
      orderNo: 'PO-20260428-1028',
      poolVersion: 2,
      demandTitle: '礼盒香炉补询价需求',
      searchKeyword: '便携 香炉 礼盒 义乌 工厂',
      sourcePlatform: 'Noon',
      sourceUrl: 'https://www.noon.com/uae-en/sample-burner-gift-set-v2',
      sourceTitle: '礼盒香炉补询价需求',
      sourceImageUrl: buildMockImage('Noon 次图', '#b45309', '#92400e'),
      sourceCollectionStatus: 'SUCCESS',
      sourceCollectedAt: '2026-04-28 10:35',
      sourceCollectionMessage: '源头商品标题、图片和详情已采集。',
      referenceImageUrl: buildMockImage('参考图 2', '#f59e0b', '#b45309'),
      packageImageUrl: buildMockImage('包装图 2', '#7c2d12', '#431407'),
      candidateCollectionStatus: 'SUCCESS',
      candidateCount: 10,
      recommendedCandidateCount: 5,
      candidateCollectionMethod: '1688 图搜 / 候选采集',
      candidateCollectedAt: '2026-04-28 10:58',
      candidateCollectionMessage: '已读取 1688 候选采集结果。',
      targetPriceMin: 19.0,
      targetPriceMax: 23.5,
      targetQuantity: 150,
      expectedDelivery: '先拿报价，确认工期后再走样品',
      targetSite: 'AE',
      specialRequirement: '重点看供应商回复效率和礼盒贴牌能力。',
      targetMaterial: '金属外壳 / 陶瓷发热仓',
      targetPowerMode: 'USB 充电 / 可充电',
      targetSizeText: '便携桌面款',
      targetPackageType: '礼盒包装',
      ownerName: '张敏 / 运营',
      status: 'POOL_INQUIRY_RUNNING',
      top10Count: 10,
      poolStartedAt: '2026-04-28 16:20',
      poolStartedBy: '王晶',
      createdAt: '2026-04-28 10:28',
      updatedAt: '2026-04-28 16:40',
      pendingConfirmations: [],
      resultNotice: '待选池自动询价正在执行，请关注回复、催发和异常状态。',
      candidates: createRunningCandidates()
    },
    {
      id: 'dem-03',
      poolId: 'pool-03',
      hasPool: true,
      demandNo: 'PC-20260427-03',
      orderNo: 'PO-20260427-1542',
      poolVersion: 3,
      demandTitle: '礼盒香炉询价结果总结',
      searchKeyword: '电热 香炉 礼盒 现货',
      sourcePlatform: 'Noon',
      sourceUrl: 'https://www.noon.com/uae-en/sample-burner-gift-set-summary',
      sourceTitle: '礼盒香炉询价结果总结',
      sourceImageUrl: buildMockImage('Noon 历史图', '#0f766e', '#0f172a'),
      sourceCollectionStatus: 'SUCCESS',
      sourceCollectedAt: '2026-04-27 15:50',
      sourceCollectionMessage: '源头商品标题、图片和详情已采集。',
      referenceImageUrl: buildMockImage('历史参考', '#134e4a', '#14532d'),
      packageImageUrl: buildMockImage('历史包装', '#166534', '#14532d'),
      candidateCollectionStatus: 'SUCCESS',
      candidateCount: 10,
      recommendedCandidateCount: 5,
      candidateCollectionMethod: '1688 图搜 / 候选采集',
      candidateCollectedAt: '2026-04-27 16:12',
      candidateCollectionMessage: '已读取 1688 候选采集结果。',
      targetPriceMin: 19.5,
      targetPriceMax: 22.5,
      targetQuantity: 200,
      expectedDelivery: '按 4 月 30 日前确认首单供应商为目标',
      targetSite: 'AE / SA / KW',
      specialRequirement: '优先稳定供货和礼盒贴牌能力，再考虑小幅差价。',
      targetMaterial: '金属外壳 / 陶瓷发热仓',
      targetPowerMode: 'USB 充电 / 可充电',
      targetSizeText: '便携桌面款',
      targetPackageType: '礼盒包装',
      ownerName: '张敏 / 运营',
      status: 'SUMMARY_READY',
      top10Count: 10,
      poolStartedAt: '2026-04-27 14:30',
      poolStartedBy: '王晶',
      createdAt: '2026-04-27 15:42',
      updatedAt: '2026-04-28 09:12',
      pendingConfirmations: [],
      resultNotice: '待选池自动询价已收口，可查看最终候选和 AI 总结。',
      finalDecisionNote: '当前按最终 2 个正式候选推进，候选 1 优先跟进，候选 2 作为补充。',
      aiSummary:
        'AI 总结：待选池首位供应商报价最低且礼盒支持贴牌，适合作为首选；第二候选回复速度快、MOQ 友好，可作为备选。其余候选要么 24 小时无回复，要么报价信息不足，不建议进入首单。',
      candidates: createSummaryReadyCandidates()
    }
  ];
}

export function createMockFeedbackEntries(): ProcurementFeedbackEntry[] {
  return [
    {
      id: 'feedback-01',
      tone: 'info',
      title: '采购需求已进入确认',
      description: '当前需求已生成默认待选池，并自动开始询价。',
      createdAt: '2026-04-28 16:20'
    },
    {
      id: 'feedback-02',
      tone: 'warning',
      title: '最终候选待确认',
      description: '当前仍需确认最终 2 个候选是否区分主选与备选。',
      createdAt: '2026-04-28 16:24'
    }
  ];
}
