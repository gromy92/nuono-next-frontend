import { expect, Page, Route, test } from '@playwright/test';
import { ProcurementConfirmationPage } from '../pages/ProcurementConfirmationPage';

const DEMAND_ID = 70001;
const OTHER_DEMAND_ID = 70002;
const OWNER_USER_ID = 10002;
const BUYER_USER_ID = 90001;
const IMAGE_DATA_URL =
  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22320%22 height%3D%22240%22 viewBox%3D%220 0 320 240%22%3E%3Crect width%3D%22320%22 height%3D%22240%22 rx%3D%2224%22 fill%3D%22%230f766e%22%2F%3E%3Ctext x%3D%22160%22 y%3D%22128%22 fill%3D%22white%22 font-size%3D%2222%22 text-anchor%3D%22middle%22%3E1688%3C%2Ftext%3E%3C%2Fsvg%3E';

type ApiState = {
  detailMode?: 'empty' | 'running' | 'partially-replied' | 'handoff-ready' | 'finished' | 'summary';
  initializeBodies: unknown[];
  addBodies: unknown[];
  replyBodies: unknown[];
  noReplyBodies: unknown[];
  finishBodies: unknown[];
  confirmBodies: unknown[];
};

function createApiState(detailMode: ApiState['detailMode'] = 'empty'): ApiState {
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

function listResponse() {
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

function detailResponse(mode: NonNullable<ApiState['detailMode']>) {
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

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body)
  });
}

async function mockProcurementApis(page: Page, state: ApiState) {
  await page.route('**/api/procurement/requirement-confirmation/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const demandPath = `/api/procurement/requirement-confirmation/demands/${DEMAND_ID}`;

    if (request.method() === 'GET' && path === '/api/procurement/requirement-confirmation/demands') {
      await fulfillJson(route, listResponse());
      return;
    }

    if (request.method() === 'GET' && path === demandPath) {
      await fulfillJson(route, detailResponse(state.detailMode ?? 'empty'));
      return;
    }

    if (request.method() === 'POST' && path === `${demandPath}/pool/initialize`) {
      state.initializeBodies.push(await request.postDataJSON());
      state.detailMode = 'running';
      await fulfillJson(route, detailResponse('running'));
      return;
    }

    if (request.method() === 'POST' && path === `${demandPath}/pool/candidates/43103/add`) {
      state.addBodies.push(await request.postDataJSON());
      state.detailMode = 'running';
      await fulfillJson(route, detailResponse('running'));
      return;
    }

    if (request.method() === 'POST' && path === `${demandPath}/pool/items/91001/reply`) {
      state.replyBodies.push(await request.postDataJSON());
      state.detailMode = 'partially-replied';
      await fulfillJson(route, detailResponse('partially-replied'));
      return;
    }

    if (request.method() === 'POST' && path === `${demandPath}/pool/items/91002/no-reply-handoff`) {
      state.noReplyBodies.push(await request.postDataJSON());
      state.detailMode = 'handoff-ready';
      await fulfillJson(route, detailResponse('handoff-ready'));
      return;
    }

    if (request.method() === 'POST' && path === `${demandPath}/pool/inquiry/finish`) {
      state.finishBodies.push(await request.postDataJSON());
      state.detailMode = 'finished';
      await fulfillJson(route, detailResponse('finished'));
      return;
    }

    if (request.method() === 'POST' && path === `${demandPath}/final-candidates/confirm`) {
      state.confirmBodies.push(await request.postDataJSON());
      state.detailMode = 'summary';
      await fulfillJson(route, detailResponse('summary'));
      return;
    }

    await fulfillJson(route, { message: `unhandled ${request.method()} ${path}` }, 404);
  });
}

async function useOperationsSession(page: Page) {
  await page.addInitScript((session) => {
    window.localStorage.setItem('nuono-next-session', JSON.stringify(session));
  }, {
    userId: 90002,
    accountNo: 'ops.demo',
    realName: '运营演示账号',
    roleId: 4,
    roleName: '运营',
    status: 1,
    bindingStatus: 'PROJECT_BOUND',
    defaultOwnerUserId: OWNER_USER_ID,
    storeCount: 1,
    authorizedStoreCount: 1,
    grantedMenus: [
      { menuId: 3001, menuName: '采购单', urlPath: '/api/purchase/order' }
    ]
  });
}

test.describe('采购需求确认', () => {
  test('列表页展示采购需求并支持搜索', async ({ page }) => {
    const state = createApiState('empty');
    await mockProcurementApis(page, state);

    const confirmation = new ProcurementConfirmationPage(page);
    await confirmation.gotoList();

    await expect(confirmation.demandCard(DEMAND_ID)).toBeVisible();
    await expect(confirmation.demandCard(OTHER_DEMAND_ID)).toBeVisible();
    await expect(confirmation.demandCard(DEMAND_ID)).toContainText('源头商品采集状态');
    await expect(confirmation.demandCard(DEMAND_ID)).toContainText('1688 候选采集状态');
    await expect(confirmation.demandCard(DEMAND_ID)).toContainText('Top5 / 自动询价 / AI 总结状态');
    await expect(confirmation.demandCard(DEMAND_ID)).not.toContainText('目标价');
    await expect(confirmation.demandCard(DEMAND_ID)).not.toContainText('原材料');

    await confirmation.search('香薰炉');
    await expect(confirmation.demandCard(DEMAND_ID)).toBeVisible();
    await expect(confirmation.demandCard(OTHER_DEMAND_ID)).not.toBeVisible();
    await expect(page.getByRole('button', { name: '打开来源商品' })).toBeVisible();

    await confirmation.search('不存在的采购需求');
    await expect(page.getByText('没有匹配的采购需求')).toBeVisible();
  });

  test('采购生成待选池和补入备选时默认表达自动询价触发意图', async ({ page }) => {
    const state = createApiState('empty');
    await mockProcurementApis(page, state);

    const confirmation = new ProcurementConfirmationPage(page);
    await confirmation.gotoDetail(DEMAND_ID);
    await confirmation.initializePool();

    await expect(page.getByTestId('procurement-action-feedback')).toContainText('待选池已生成');
    await expect(page.getByTestId('procurement-pool-candidate-91001')).toBeVisible();
    expect(state.initializeBodies).toHaveLength(1);
    expect(state.initializeBodies[0]).toMatchObject({
      ownerUserId: OWNER_USER_ID,
      operatorUserId: BUYER_USER_ID,
      operatorRole: 'PURCHASE',
      triggerInquiry: true
    });

    await confirmation.addBackupCandidate(43103);
    await expect(page.getByTestId('procurement-action-feedback')).toContainText('已加入待选池');
    expect(state.addBodies).toHaveLength(1);
    expect(state.addBodies[0]).toMatchObject({
      ownerUserId: OWNER_USER_ID,
      operatorUserId: BUYER_USER_ID,
      operatorRole: 'PURCHASE',
      triggerInquiry: true
    });
  });

  test('待选池候选可查看 1688 源数据和评分依据', async ({ page }) => {
    const state = createApiState('running');
    await mockProcurementApis(page, state);

    const confirmation = new ProcurementConfirmationPage(page);
    await confirmation.gotoDetail(DEMAND_ID);
    await page.getByTestId('procurement-view-source-91001').click();

    const drawer = page.locator('.ant-drawer-content').filter({ hasText: '1688 源数据与评分依据' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('规格匹配分');
    await expect(drawer).toContainText('材质');
    await expect(drawer).toContainText('金属外壳 / 陶瓷发热仓');
    await expect(drawer).toContainText('图搜结果卡');
    await expect(drawer).toContainText('当前可见字段推导');
  });

  test('运营角色点击写操作只给只读反馈且不发写请求', async ({ page }) => {
    const state = createApiState('empty');
    await useOperationsSession(page);
    await mockProcurementApis(page, state);

    const confirmation = new ProcurementConfirmationPage(page);
    await confirmation.gotoDetail(DEMAND_ID);
    await confirmation.initializePool();

    await expect(page.getByTestId('procurement-action-feedback')).toContainText('当前角色仅可查看');
    expect(state.initializeBodies).toHaveLength(0);
  });

  test('询价收口后可确认最终 2 个并展示 AI 总结', async ({ page }) => {
    const state = createApiState('finished');
    await mockProcurementApis(page, state);

    const confirmation = new ProcurementConfirmationPage(page);
    await confirmation.gotoDetail(DEMAND_ID);
    await confirmation.selectFinalCandidate(91001);
    await confirmation.selectFinalCandidate(91002);
    await confirmation.confirmFinalCandidates();

    await expect(page.getByTestId('procurement-action-feedback')).toContainText('最终 2 个已确认');
    await expect(page.getByText('AI 总结：候选 1 报价更低，候选 2 作为备选更稳。')).toBeVisible();
    expect(state.confirmBodies).toHaveLength(1);
    expect(state.confirmBodies[0]).toMatchObject({
      ownerUserId: OWNER_USER_ID,
      operatorUserId: BUYER_USER_ID,
      operatorRole: 'PURCHASE',
      primaryPoolItemId: '91001',
      backupPoolItemId: '91002'
    });
  });

  test('询价等待回复后支持已回复和无回复转人工，再进入 AI 总结', async ({ page }) => {
    const state = createApiState('running');
    await mockProcurementApis(page, state);

    const confirmation = new ProcurementConfirmationPage(page);
    await confirmation.gotoDetail(DEMAND_ID);

    await expect(page.getByTestId('procurement-finish-inquiry-button')).toBeDisabled();

    await confirmation.recordReply(91001);
    await expect(page.getByTestId('procurement-action-feedback')).toContainText('已记录供应商回复');
    await expect(page.getByTestId('procurement-inquiry-result-91001')).toContainText('供应商已回复候选 1');
    await expect(page.getByTestId('procurement-finish-inquiry-button')).toBeDisabled();
    expect(state.replyBodies).toHaveLength(1);
    expect(state.replyBodies[0]).toMatchObject({
      ownerUserId: OWNER_USER_ID,
      operatorUserId: BUYER_USER_ID,
      operatorRole: 'PURCHASE',
      quotePriceText: '13.80 RMB',
      quoteMoqText: '60 件',
      quoteDeliveryText: '2 天发货'
    });

    await confirmation.markNoReplyHandoff(91002);
    await expect(page.getByTestId('procurement-action-feedback')).toContainText('已转人工介入');
    await expect(page.getByTestId('procurement-inquiry-result-91002')).toContainText('24 小时无回复');
    await expect(page.getByTestId('procurement-finish-inquiry-button')).toBeEnabled();
    expect(state.noReplyBodies).toHaveLength(1);
    expect(state.noReplyBodies[0]).toMatchObject({
      ownerUserId: OWNER_USER_ID,
      operatorUserId: BUYER_USER_ID,
      operatorRole: 'PURCHASE',
      reason: '采购在详情页标记 24 小时无回复。'
    });

    await confirmation.finishInquiry();
    await expect(page.getByTestId('procurement-action-feedback')).toContainText('询价已收口');
    expect(state.finishBodies).toHaveLength(1);
    expect(state.finishBodies[0]).toMatchObject({
      ownerUserId: OWNER_USER_ID,
      operatorUserId: BUYER_USER_ID,
      operatorRole: 'PURCHASE',
      finishMode: 'MANUAL_CONFIRM',
      force: false
    });

    await confirmation.selectFinalCandidate(91001);
    await confirmation.selectFinalCandidate(91002);
    await confirmation.confirmFinalCandidates();

    await expect(page.getByTestId('procurement-action-feedback')).toContainText('最终 2 个已确认');
    await expect(page.getByText('AI 总结：候选 1 报价更低，候选 2 作为备选更稳。')).toBeVisible();
    expect(state.confirmBodies).toHaveLength(1);
    expect(state.confirmBodies[0]).toMatchObject({
      primaryPoolItemId: '91001',
      backupPoolItemId: '91002'
    });
  });
});
