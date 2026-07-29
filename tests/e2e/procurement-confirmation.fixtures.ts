export const DEMAND_ID = 70001;
export const OTHER_DEMAND_ID = 70002;
export const OWNER_USER_ID = 10002;
export const BUYER_USER_ID = 90001;
const IMAGE_DATA_URL =
  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22320%22 height%3D%22240%22 viewBox%3D%220 0 320 240%22%3E%3Crect width%3D%22320%22 height%3D%22240%22 rx%3D%2224%22 fill%3D%22%230f766e%22%2F%3E%3Ctext x%3D%22160%22 y%3D%22128%22 fill%3D%22white%22 font-size%3D%2222%22 text-anchor%3D%22middle%22%3E1688%3C%2Ftext%3E%3C%2Fsvg%3E';

export type ApiState = {
  detailMode?: 'empty' | 'running' | 'partially-replied' | 'handoff-ready' | 'finished' | 'summary';
  initializeBodies: unknown[];
  addBodies: unknown[];
  replyBodies: unknown[];
  noReplyBodies: unknown[];
  finishBodies: unknown[];
  confirmBodies: unknown[];
};

export function createApiState(detailMode: ApiState['detailMode'] = 'empty'): ApiState {
  return {
    detailMode,
    initializeBodies: [],
    addBodies: [],
    replyBodies: [],
    noReplyBodies: [],
    finishBodies: [],
    confirmBodies: []
  };
}

function candidate(candidateId: number, rankNo: number, overrides: Record<string, unknown> = {}) {
  const offerId = String(798448770000 + candidateId);
  return {
    candidateId,
    rankNo,
    totalScore: 96 - rankNo,
    offerId,
    title: `香薰炉 1688 候选 ${rankNo}`,
    supplierName: `义乌测试供应商 ${rankNo}`,
    candidateUrl: `https://detail.1688.com/offer/${offerId}.html`,
    mainImageUrl: IMAGE_DATA_URL,
    detailImageUrl: IMAGE_DATA_URL,
    deliveryImageUrl: IMAGE_DATA_URL,
    priceText: `${12 + rankNo}.80 RMB`,
    moqText: `${50 + rankNo * 10} 件`,
    locationText: '义乌',
    materialText: '金属外壳 / 陶瓷发热仓',
    powerModeText: 'USB 充电 / 可充电',
    sizeText: '便携桌面款 10 x 10 x 14 cm',
    packageText: '彩盒 / 礼盒包装',
    deliveryTimelineText: `${rankNo + 1} 天发货`,
    resultCardText: '图搜结果卡：外观、礼盒和主图角度接近采购参考图。',
    detailHighlightText: '详情页卖点：便携电香炉、陶瓷仓、礼盒包装。',
    attributeSnapshotText: '属性快照：材质 金属外壳 / 陶瓷发热仓；供电方式 USB 充电；包装 礼盒。',
    shippingSnapshotText: '物流说明：义乌现货，72 小时内发货。',
    packageSnapshotText: '包装说明：彩盒 / 礼盒包装，支持贴标。',
    badgesText: '图搜优先|高推荐',
    reasonsText: '材质符合采购要求|包装方向接近采购要求|价格带落在目标区间',
    warningsText: '尺寸仍需人工进一步确认',
    fitScore: 36,
    specScore: 16,
    priceScore: 14,
    supplierScore: 10,
    logisticsScore: 12,
    ...overrides
  };
}

function poolItem(poolItemId: number, candidateId: number, rankNo: number, status: string, overrides: Record<string, unknown> = {}) {
  return {
    ...candidate(candidateId, rankNo),
    poolItemId,
    candidateId,
    sourceRankNo: rankNo,
    poolRankNo: rankNo,
    status,
    inquiryTaskId: 45000 + rankNo,
    inquiryTaskStatus: status === 'REPLIED' || status === 'CLOSED'
      ? 'REPLIED'
      : status === 'NO_REPLY_HANDOFF' || status === 'REPLY_PARSE_FAILED'
        ? 'HANDOFF'
        : 'SENT',
    replySummary: status === 'REPLIED' || status === 'CLOSED'
      ? `供应商已回复候选 ${rankNo}，报价可接受。`
      : '首条询价已发出，等待供应商回复。',
    quotePriceText: status === 'REPLIED' || status === 'CLOSED' ? `${11 + rankNo}.60 RMB` : null,
    quoteMoqText: status === 'REPLIED' || status === 'CLOSED' ? `${40 + rankNo * 10} 件` : null,
    quoteDeliveryText: status === 'REPLIED' || status === 'CLOSED' ? `${rankNo + 1} 天发货` : null,
    ...overrides
  };
}

export function listResponse() {
  return {
    mode: 'local-db',
    ready: true,
    page: 1,
    pageSize: 50,
    total: 2,
    items: [
      {
        demandItemId: DEMAND_ID,
        orderId: 71001,
        ownerUserId: OWNER_USER_ID,
        orderNo: 'PO-E2E-001',
        orderTitle: '香薰炉采购需求',
        demandTitle: '香薰炉采购需求',
        demandStatus: 'POOL_EMPTY_REQUIRES_ACTION',
        sourcePlatform: 'amazon',
        sourceUrl: 'https://www.amazon.sa/-/en/Rechargeable-Bakhoor-Incense-Speaker-Control/dp/B0DVH1NFP3/',
        sourceTitle: '可充电古兰经音箱焚香炉遥控礼盒款',
        targetPriceMin: 10,
        targetPriceMax: 18,
        targetQuantity: 300,
        targetSite: 'AE',
        specialRequirement: '需要金属外壳，包装图和主图保持一致。',
        targetMaterial: '金属外壳 / 陶瓷发热仓',
        targetPowerMode: 'USB 充电 / 可充电',
        targetSizeText: '便携桌面款',
        targetPackageType: '礼盒包装',
        deliveryExpectation: '5 天内发货',
        assignedBuyerName: '共享采购队列',
        poolId: null,
        poolStatus: null,
        poolCount: 0,
        maxPoolSize: 5,
        finalCandidateCount: 0,
        candidateCount: 10,
        previewCandidate: candidate(43101, 1),
        updatedAt: '2026-04-29 10:30'
      },
      {
        demandItemId: OTHER_DEMAND_ID,
        orderId: 71002,
        ownerUserId: OWNER_USER_ID,
        orderNo: 'PO-E2E-002',
        orderTitle: '办公收纳采购需求',
        demandTitle: '办公收纳采购需求',
        demandStatus: 'POOL_INQUIRY_RUNNING',
        sourcePlatform: 'noon',
        sourceUrl: 'https://www.noon.com/saudi-en/sample-source/p/',
        sourceTitle: '办公收纳来源商品',
        targetPriceMin: 8,
        targetPriceMax: 12,
        targetQuantity: 200,
        targetSite: 'SA',
        specialRequirement: '轻小件优先。',
        targetMaterial: 'https://www.noon.com/saudi-en/sample-source/p/',
        targetPowerMode: '无电',
        targetSizeText: '桌面款',
        targetPackageType: '彩盒装',
        deliveryExpectation: '7 天内发货',
        assignedBuyerName: '共享采购队列',
        poolId: 90002,
        poolStatus: 'POOL_INQUIRY_RUNNING',
        poolCount: 2,
        maxPoolSize: 5,
        finalCandidateCount: 0,
        candidateCount: 10,
        previewCandidate: candidate(43201, 1, { title: '收纳盒 1688 候选' }),
        updatedAt: '2026-04-29 11:00'
      }
    ]
  };
}

function demandDto(status = 'POOL_EMPTY_REQUIRES_ACTION') {
  return {
    demandItemId: DEMAND_ID,
    orderId: 71001,
    ownerUserId: OWNER_USER_ID,
    orderNo: 'PO-E2E-001',
    orderTitle: '香薰炉采购需求',
    lineNo: 1,
    sourcePlatform: 'Noon',
    sourceUrl: 'https://www.noon.com/test-e2e',
    sourceTitle: '香薰炉采购需求',
    sourceImageUrl: IMAGE_DATA_URL,
    sourcePackageImageUrl: IMAGE_DATA_URL,
    targetPriceMin: 10,
    targetPriceMax: 18,
    targetQuantity: 300,
    targetSite: 'AE',
    specialRequirement: '需要金属外壳，包装图和主图保持一致。',
    targetMaterial: '金属外壳 / 陶瓷发热仓',
    targetPowerMode: 'USB 充电 / 可充电',
    targetSizeText: '便携桌面款',
    targetPackageType: '礼盒包装',
    deliveryExpectation: '5 天内发货',
    status,
    assignedBuyerName: '共享采购队列',
    currentPoolId: status === 'POOL_EMPTY_REQUIRES_ACTION' ? null : 90001,
    createdAt: '2026-04-29 10:00',
    updatedAt: '2026-04-29 10:30'
  };
}

export function detailResponse(mode: NonNullable<ApiState['detailMode']>) {
  if (mode === 'empty') {
    return {
      mode: 'local-db',
      ready: true,
      demand: demandDto('POOL_EMPTY_REQUIRES_ACTION'),
      pool: null,
      backupCandidates: [candidate(43101, 1), candidate(43102, 2), candidate(43103, 3)],
      finalCandidates: [],
      summary: { summaryText: null, snapshotId: null }
    };
  }

  const poolStatus = mode === 'finished'
    ? 'POOL_INQUIRY_FINISHED'
    : mode === 'summary'
      ? 'SUMMARY_READY'
      : mode === 'handoff-ready'
        ? 'POOL_PARTIAL_HANDOFF'
        : 'POOL_INQUIRY_RUNNING';
  const repliedItem = poolItem(91001, 43101, 1, 'REPLIED', {
    replySummary: '供应商已回复候选 1，报价 11.60 RMB，MOQ 50 件。',
    quotePriceText: '11.60 RMB',
    quoteMoqText: '50 件',
    quoteDeliveryText: '2 天发货'
  });
  const waitingItem = poolItem(91002, 43102, 2, 'IN_POOL_WAITING_REPLY');
  const handoffItem = poolItem(91002, 43102, 2, 'NO_REPLY_HANDOFF', {
    replySummary: '24 小时无回复，已要求人工接手。',
    riskNote: '供应商 24 小时内未回复，需人工判断是否继续补追。'
  });
  const items = mode === 'running'
    ? [poolItem(91001, 43101, 1, 'IN_POOL_WAITING_REPLY'), waitingItem]
    : mode === 'partially-replied'
      ? [repliedItem, waitingItem]
      : [repliedItem, handoffItem];
  return {
    mode: 'local-db',
    ready: true,
    message: mode === 'running' ? '待选池已初始化。' : undefined,
    demand: demandDto(poolStatus),
    pool: {
      poolId: 90001,
      poolNo: 'POOL-E2E-001',
      status: poolStatus,
      poolCount: items.length,
      maxPoolSize: 5,
      candidateSourceLimit: 10,
      autoCreatedAt: '2026-04-29 10:35',
      inquiryStartedAt: '2026-04-29 10:36',
      inquiryFinishedAt: mode === 'running' ? null : '2026-04-29 13:00',
      finalConfirmedAt: mode === 'summary' ? '2026-04-29 13:10' : null,
      summaryReadyAt: mode === 'summary' ? '2026-04-29 13:11' : null,
      summaryText: mode === 'summary' ? 'AI 总结：候选 1 报价更低，候选 2 作为备选更稳。' : null,
      items
    },
    backupCandidates: [candidate(43103, 3)],
    finalCandidates: mode === 'summary'
      ? [
          { poolItemId: 91001, candidateId: 43101, finalPickType: 'PRIMARY', decisionNote: 'E2E 确认', candidate: candidate(43101, 1) },
          { poolItemId: 91002, candidateId: 43102, finalPickType: 'BACKUP', decisionNote: 'E2E 确认', candidate: candidate(43102, 2) }
        ]
      : [],
    summary: {
      summaryText: mode === 'summary' ? 'AI 总结：候选 1 报价更低，候选 2 作为备选更稳。' : null,
      snapshotId: mode === 'summary' ? 92001 : null
    }
  };
}
