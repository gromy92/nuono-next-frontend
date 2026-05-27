import { expect, test } from '@playwright/test';

const storeSyncOverview = {
  mode: 'mock',
  ready: true,
  selectedOwnerId: 307,
  summary: {
    totalStores: 1,
    connectedStores: 1,
    pendingStores: 0,
    managerLinks: 0
  },
  ownerOptions: [],
  stores: [],
  syncedRules: [],
  missingCoreTables: []
};

const storedBossSession = {
  userId: 307,
  accountNo: '毕翠红',
  realName: '毕翠红',
  roleId: 2,
  roleName: '老板',
  companyName: 'canman',
  status: 1,
  level: 1,
  storeCount: 1,
  authorizedStoreCount: 1,
  bindingStatus: 'PROJECT_BOUND',
  defaultOwnerUserId: 307,
  activeRoleView: 'boss',
  currentStore: {
    id: 301,
    orgCode: 'ORG-CANMAN',
    orgName: '毕翠红运营中心',
    projectCode: 'PRJ108065',
    projectName: 'canman',
    storeCode: 'STR108065-NAE',
    site: 'AE',
    authorized: true
  },
  userStores: [
    {
      id: 301,
      orgCode: 'ORG-CANMAN',
      orgName: '毕翠红运营中心',
      projectCode: 'PRJ108065',
      projectName: 'canman',
      storeCode: 'STR108065-NAE',
      site: 'AE',
      authorized: true
    }
  ],
  grantedMenus: [
    { menuId: 24, menuName: '采购', urlPath: '/api/purchase/order' }
  ]
};

const baseAliTask = {
  id: '87001',
  taskId: '87001',
  sourceCollectionId: '86001',
  sourceCollectionNo: 'PSC-20260518-001',
  storeId: '301',
  storeName: 'canman',
  storeCode: 'STR108065-NAE',
  sourcePlatform: 'Amazon',
  sourceUrl: 'https://www.amazon.com/dp/example-flower-bouquet',
  pageUrl: 'https://www.amazon.com/dp/example-flower-bouquet',
  sourceTitle: 'DUYONE Artificial Flowers 6 Stems Poppy Silk Bouquet',
  sourceTitleCn: '仿真花束',
  sourceImageUrl: 'https://images.example.com/main.jpg',
  searchMode: '主图图搜',
  selectedImageCount: 1,
  scannedCount: 10,
  startedAt: '2026-05-18 10:30',
  finishedAt: '2026-05-18 10:35',
  message: '1688 候选采集完成。',
  canGenerateProcurementOrder: false
};

const emptyAliTask = {
  ...baseAliTask,
  id: '87002',
  taskId: '87002',
  status: 'not_started',
  progressPercent: 0,
  candidateCount: 0,
  recommendedCount: 0,
  candidates: [],
  message: '暂无真实1688候选采集任务。'
};

const queuedAliTask = {
  ...baseAliTask,
  id: '87003',
  taskId: '87003',
  sourceCollectionNo: 'PSC-20260518-RUN',
  sourceTitleCn: '采集中的浴袍',
  sourceTitle: 'Warm bathrobe collection sample',
  status: 'queued',
  progressPercent: 5,
  scannedCount: 0,
  candidateCount: 0,
  recommendedCount: 0,
  candidates: [],
  message: '1688 候选采集已排队。'
};

const failedAliTask = {
  ...baseAliTask,
  id: '87004',
  taskId: '87004',
  sourceCollectionNo: 'PSC-20260518-FAIL',
  sourceTitleCn: '失败的香薰蜡烛',
  sourceTitle: 'Scented candle collection sample',
  status: 'failed',
  progressPercent: 100,
  scannedCount: 0,
  candidateCount: 0,
  recommendedCount: 0,
  candidates: [],
  failureCode: 'image_search_timeout',
  failureMessage: '1688 图搜超时。',
  message: '1688 图搜超时。'
};

const scoredAliTask = {
  ...baseAliTask,
  status: 'partial_success',
  progressPercent: 100,
  candidateCount: 1,
  recommendedCount: 1,
  failureCode: 'candidate_count_less_than_10',
  failureMessage: '1688 图搜候选不足 10 个，已展示可用候选。',
  candidates: [
    {
      id: '88001',
      rankNo: 1,
      selectedRankNo: 1,
      level: 'recommended',
      offerId: '745612345678',
      title: '仿真罂粟花束 6 支装 家居装饰',
      supplierName: '义乌诚信通源头工厂',
      candidateUrl: 'https://detail.1688.com/offer/745612345678.html',
      priceText: '¥12.80-18.60',
      listPriceHintText: '¥12.80-18.60',
      priceState: 'list_hint_only',
      confirmedPriceText: null,
      moqText: '2 件起批',
      locationText: '浙江 义乌',
      imageUrl: 'https://images.example.com/ali-main.jpg',
      imageUrls: ['https://images.example.com/ali-main.jpg', 'https://images.example.com/ali-detail.jpg'],
      ruleScore: 45,
      scoreStatus: 'partial',
      scoreBreakdown: {
        priceScore: 15,
        moqScore: 10,
        supplierScore: 12,
        deliveryScore: 8
      },
      aiAssessmentStatus: 'pending',
      autoInquiryEligible: false,
      procurementInquiryStatus: 'PRICE_CONFIRMATION_REQUIRED'
    }
  ]
};

const mixedPriceHintAliTask = {
  ...scoredAliTask,
  candidates: [
    {
      ...scoredAliTask.candidates[0],
      id: '88201',
      offerId: '88201',
      title: '适用于摩托罗拉 Edge70 5G 手机壳素材',
      supplierName: '佛山市南海区二丰手机配件有限公司',
      priceText: '¥ 6 .93 运费4元起 4400+件 50件起批',
      listPriceHintText: '¥ 6 .93 运费4元起 4400+件 50件起批',
      priceState: 'list_hint_only',
      confirmedPriceText: null,
      autoInquiryEligible: false,
      procurementInquiryStatus: 'PRICE_CONFIRMATION_REQUIRED',
      scoreBreakdown: {
        priceScore: 8,
        moqScore: 5,
        supplierScore: 6,
        deliveryScore: 4
      }
    }
  ]
};

const gateStateAliTask = {
  ...baseAliTask,
  id: '87041',
  taskId: '87041',
  status: 'success',
  progressPercent: 100,
  candidateCount: 6,
  recommendedCount: 2,
  inquiryEligibleCount: 1,
  inquiryBlockedCount: 5,
  candidates: [
    {
      ...scoredAliTask.candidates[0],
      id: '88401',
      title: 'AI 仍在补分的手机整机候选',
      level: 'review',
      selectedRankNo: undefined,
      gate: {
        state: 'ai_pending',
        label: '待AI评分',
        reason: 'AI 匹配/规格补分未完成。',
        allowsPriceProbe: false,
        allowsAutoInquiry: false
      },
      inquiryEligibility: {
        state: 'rejected_missing_ai',
        label: '待AI',
        reason: 'AI 匹配/规格补分未完成。',
        eligible: false
      }
    },
    {
      ...scoredAliTask.candidates[0],
      id: '88402',
      title: '明显错品手机保护膜候选',
      level: 'reject',
      selectedRankNo: undefined,
      scoreStatus: 'final',
      totalScore: 36,
      scoreBreakdown: { matchScore: 12, specScore: 15, priceScore: 8, moqScore: 5, supplierScore: 6, deliveryScore: 5 },
      gate: {
        state: 'mismatch_rejected',
        label: '匹配不通过',
        reason: 'AI 匹配分 12 未达到门禁。',
        allowsPriceProbe: false,
        allowsAutoInquiry: false
      },
      inquiryEligibility: {
        state: 'rejected_high_risk',
        label: '匹配不通过',
        reason: 'AI 匹配分 12 未达到门禁。',
        eligible: false
      }
    },
    {
      ...scoredAliTask.candidates[0],
      id: '88403',
      title: '规格信息不足的相似候选',
      level: 'review',
      selectedRankNo: undefined,
      scoreStatus: 'final',
      totalScore: 58,
      scoreBreakdown: { matchScore: 29, specScore: 8, priceScore: 8, moqScore: 5, supplierScore: 8, deliveryScore: 8 },
      gate: {
        state: 'spec_uncertain',
        label: '规格待确认',
        reason: '规格分 8 偏低，需人工确认型号/套装。',
        allowsPriceProbe: false,
        allowsAutoInquiry: false
      },
      inquiryEligibility: {
        state: 'rejected_spec_uncertain',
        label: '规格待确认',
        reason: '规格分 8 偏低，需人工确认型号/套装。',
        eligible: false
      }
    },
    {
      ...scoredAliTask.candidates[0],
      id: '88404',
      title: 'AI 通过等待真实价格候选',
      level: 'recommended',
      selectedRankNo: 1,
      scoreStatus: 'final',
      totalScore: 72,
      scoreBreakdown: { matchScore: 32, specScore: 16, priceScore: 8, moqScore: 6, supplierScore: 6, deliveryScore: 4 },
      gate: {
        state: 'price_probe_pending',
        label: '待真实价格',
        reason: 'AI 门禁通过，等待订单预览价确认。',
        allowsPriceProbe: true,
        allowsAutoInquiry: false
      },
      inquiryEligibility: {
        state: 'rejected_missing_real_price',
        label: '待真实价格',
        reason: '缺少已确认真实采购价。',
        eligible: false
      }
    },
    {
      ...scoredAliTask.candidates[0],
      id: '88405',
      title: '真实取价失败候选',
      level: 'review',
      selectedRankNo: undefined,
      scoreStatus: 'final',
      totalScore: 70,
      priceState: 'price_probe_failed',
      scoreBreakdown: { matchScore: 31, specScore: 15, priceScore: 8, moqScore: 6, supplierScore: 6, deliveryScore: 4 },
      gate: {
        state: 'price_probe_failed',
        label: '取价失败',
        reason: 'shipping_unavailable',
        allowsPriceProbe: false,
        allowsAutoInquiry: false
      },
      inquiryEligibility: {
        state: 'rejected_price_failed',
        label: '取价失败',
        reason: '真实价格探针失败：shipping_unavailable',
        eligible: false,
        priceFailureCode: 'shipping_unavailable'
      }
    },
    {
      ...scoredAliTask.candidates[0],
      id: '88406',
      title: '可进入询盘池候选',
      level: 'recommended',
      selectedRankNo: 2,
      scoreStatus: 'final',
      totalScore: 80,
      priceState: 'price_confirmed',
      confirmedPriceText: '¥18.40 含运费',
      autoInquiryEligible: true,
      scoreBreakdown: { matchScore: 33, specScore: 17, priceScore: 8, moqScore: 6, supplierScore: 8, deliveryScore: 8 },
      gate: {
        state: 'inquiry_eligible',
        label: '可询盘',
        reason: 'AI 与真实价格门禁通过。',
        allowsPriceProbe: false,
        allowsAutoInquiry: true
      },
      inquiryEligibility: {
        state: 'eligible',
        label: '可询盘',
        reason: 'AI、规格、风险和真实价格门禁已通过。',
        eligible: true
      }
    }
  ]
};

const aliCdnImageTask = {
  ...scoredAliTask,
  candidates: [
    {
      ...scoredAliTask.candidates[0],
      imageUrl: 'https://cbu01.alicdn.com/img/ibank/O1CN01va79Jn1nbycLssQCv_!!2850655109-0-cib.jpg_460x460q100.jpg_.webp',
      imageUrls: ['https://cbu01.alicdn.com/img/ibank/O1CN01va79Jn1nbycLssQCv_!!2850655109-0-cib.jpg_460x460q100.jpg_.webp']
    }
  ]
};

const detailBlockedAliTask = {
  ...baseAliTask,
  id: '87016',
  taskId: '87016',
  status: 'success',
  progressPercent: 100,
  candidateCount: 1,
  recommendedCount: 1,
  detailCompletionStatus: 'blocked_by_captcha',
  detailCompletionMessage: '1688 详情页受限，详情字段待补充。',
  fieldCompleteness: {
    candidateCount: 1,
    nonFallbackTitleCount: 1,
    supplierNameCount: 1,
    priceTextCount: 0,
    moqTextCount: 0,
    locationTextCount: 0,
    normalizedDetailUrlCount: 1
  },
  candidates: [
    {
      id: '88016',
      rankNo: 1,
      selectedRankNo: 1,
      level: 'recommended',
      offerId: '619232628704',
      title: '尼龙扎带仿真叶子树叶彩色扎带现货供应跨境扎带厂家批发价格',
      supplierName: '供应商待解析',
      candidateUrl: 'https://detail.1688.com/offer/619232628704.html',
      imageUrl: 'https://images.example.com/ali-captcha-boundary.jpg',
      imageUrls: ['https://images.example.com/ali-captcha-boundary.jpg'],
      ruleScore: 12,
      scoreStatus: 'partial',
      scoreBreakdown: {
        priceScore: 2,
        moqScore: 0,
        supplierScore: 6,
        deliveryScore: 4
      },
      aiAssessmentStatus: 'pending',
      procurementInquiryStatus: 'IN_POOL_WAITING_SEND'
    }
  ]
};

const gatewayBlockedAliTask = {
  ...baseAliTask,
  id: '87027',
  taskId: '87027',
  status: 'queued',
  progressPercent: 5,
  scannedCount: 0,
  candidateCount: 1,
  recommendedCount: 1,
  message: '1688 候选采集已排队。',
  gatewayStatus: {
    gatewayServiceKind: 'system_browser_gateway',
    sessionState: 'captcha_required',
    runtimeReady: true,
    captchaAutoSolveEnabled: false,
    userFacingStatus: 'blocked_by_captcha',
    userFacingMessage: '1688 访问受限，系统已暂停自动采集。'
  },
  pluginAssistAvailable: true,
  candidates: [
    {
      id: '88027',
      rankNo: 1,
      selectedRankNo: 1,
      level: 'recommended',
      offerId: '619232628705',
      title: '1688 访问受限边界候选',
      supplierName: '供应商线索已保留',
      candidateUrl: 'https://detail.1688.com/offer/619232628705.html',
      imageUrl: 'https://images.example.com/ali-gateway-boundary.jpg',
      imageUrls: ['https://images.example.com/ali-gateway-boundary.jpg'],
      scoreStatus: 'partial',
      scoreBreakdown: {},
      aiAssessmentStatus: 'pending',
      procurementInquiryStatus: 'IN_POOL_WAITING_SEND'
    }
  ]
};

const pluginAcceptedAliTask = {
  ...baseAliTask,
  id: '87032',
  taskId: '87032',
  status: 'partial_success',
  progressPercent: 100,
  scannedCount: 7,
  candidateCount: 1,
  recommendedCount: 1,
  failureCode: 'plugin_candidate_count_less_than_10',
  failureMessage: '插件提交候选不足 10 个，已展示可用候选。',
  pluginAssistAvailable: true,
  pluginAssignment: {
    assignmentId: '90032',
    taskId: '87032',
    sourceCollectionId: '86001',
    taskNo: 'ALI1688-20260522-032',
    status: 'accepted',
    expiresAt: '2026-05-22 15:30:00',
    finishedAt: '2026-05-22 15:12:00',
    current: false,
    message: '插件候选已接收。'
  },
  candidates: [
    {
      id: '88032',
      rankNo: 1,
      selectedRankNo: 1,
      level: 'recommended',
      offerId: '619232628707',
      title: '插件提交的 1688 候选',
      supplierName: '插件保留的供应商线索',
      candidateUrl: 'https://detail.1688.com/offer/619232628707.html',
      imageUrl: 'https://images.example.com/ali-plugin-submission.jpg',
      imageUrls: ['https://images.example.com/ali-plugin-submission.jpg'],
      ruleScore: 18,
      scoreStatus: 'partial',
      scoreBreakdown: {},
      aiAssessmentStatus: 'pending',
      procurementInquiryStatus: 'IN_POOL_WAITING_SEND'
    }
  ]
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: storeSyncOverview });
  });
});

test('dev acceptance link shows empty state when 1688 backend returns an empty list', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-queue')).toContainText('暂无1688查询记录');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('请选择查询记录');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('综合分');
});

test('formal mode does not synthesize candidates when 1688 backend has no tasks', async ({ page }) => {
  await page.addInitScript((session) => {
    window.localStorage.setItem('nuono-next-session', JSON.stringify(session));
  }, storedBossSession);
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.goto('/purchase/1688-collection');

  await expect(page.getByTestId('ali1688-task-queue')).toContainText('暂无1688查询记录');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('请选择查询记录');
  await expect(page.locator('.ali1688-candidate-card')).toHaveCount(0);
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('跨境同款现货');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('综合分');
});

test('standalone 1688 page renders real task candidates and rule score only', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [scoredAliTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-collection-page')).toBeVisible();
  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '1688查询展示' })).toBeVisible();
  await expect(page.getByTestId('ali1688-task-queue')).toContainText('仿真花束');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('仿真罂粟花束 6 支装');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('义乌诚信通源头工厂');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('规则分');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('待评分');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('待真实价格');
  await expect(page.locator('.ali1688-candidate-card')).toHaveCount(1);
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('生成采购单');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('加入候选');
});

test('standalone 1688 page labels list price as a non-decision hint', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [mixedPriceHintAliTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-detail')).toContainText('适用于摩托罗拉 Edge70 5G 手机壳素材');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('价格线索 ¥ 6 .93 运费4元起 4400+件 50件起批');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('非真实采购价');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('待真实价格');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('需真实价格确认后才可自动询盘');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('待自动询盘');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('确认采购价');
});

test('standalone 1688 page shows and filters candidate gate states', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [gateStateAliTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-detail')).toContainText('待AI评分');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('AI 匹配/规格补分未完成。');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('匹配不通过');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('规格待确认');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('待真实价格');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('取价失败');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('可询盘');
  await expect(page.getByTestId('ali1688-candidate-gate-filter')).toContainText('低匹配 1');
  await expect(page.locator('.ali1688-candidate-card')).toHaveCount(6);

  await page.getByTestId('ali1688-candidate-gate-filter').getByText('低匹配 1').click();
  await expect(page.locator('.ali1688-candidate-card')).toHaveCount(1);
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('明显错品手机保护膜候选');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('AI 通过等待真实价格候选');

  await page.getByTestId('ali1688-candidate-gate-filter').getByText('待取价 1').click();
  await expect(page.locator('.ali1688-candidate-card')).toHaveCount(1);
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('AI 通过等待真实价格候选');

  await page.getByTestId('ali1688-candidate-gate-filter').getByText('可询盘 1').click();
  await expect(page.locator('.ali1688-candidate-card')).toHaveCount(1);
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('可进入询盘池候选');
});

test('standalone 1688 page separates inquiry eligible pool from review pool', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [gateStateAliTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-detail')).toContainText('可询盘池 1 个');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('待复核 5 个');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('真实价格探针失败：shipping_unavailable');
});

test('candidate carousel skips blocked images and requests candidate images without page referrer', async ({ page }) => {
  const usableImage = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#0f766e"/></svg>'
  )}`;
  const blockedImage = 'https://images.example.com/blocked-ali-candidate.jpg';
  const taskWithBlockedImage = {
    ...scoredAliTask,
    candidates: [
      {
        ...scoredAliTask.candidates[0],
        title: '图片兜底候选',
        imageUrl: blockedImage,
        imageUrls: [blockedImage, usableImage]
      }
    ]
  };

  await page.route(blockedImage, async (route) => {
    await route.abort('failed');
  });
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [taskWithBlockedImage] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  const candidateImage = page.locator('.ali1688-candidate-carousel img').first();
  await expect(candidateImage).toHaveAttribute('referrerpolicy', 'no-referrer');
  await expect(candidateImage).toHaveAttribute('src', /^data:image\/svg\+xml/);
});

test('candidate carousel does not mix the source image into candidates that already have their own images', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [scoredAliTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.locator('.ali1688-carousel-dots')).toHaveAttribute('aria-label', '2 张图片');
});

test('candidate carousel cache-busts Alibaba CDN images to avoid stale blocked responses', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [aliCdnImageTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.locator('.ali1688-candidate-carousel img').first()).toHaveAttribute('src', /[?&]nuono_img=1/);
});

test('standalone 1688 page shows controlled detail captcha degradation', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [detailBlockedAliTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-detail')).toContainText('部分详情字段因 1688 详情页受限待补充');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('尼龙扎带仿真叶子树叶彩色扎带');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('详情页受限 / 待补充');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('规则分');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('采集失败');
});

test('standalone 1688 page shows production gateway blocked status without fake fields', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [gatewayBlockedAliTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-detail')).toContainText('1688 访问受限');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('系统已暂停自动采集');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('1688 访问受限边界候选');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('供应商线索已保留');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('待补充');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('采集失败');
});

test('standalone 1688 page creates plugin assignment without exposing tokens', async ({ page }) => {
  let createPayload: Record<string, unknown> | null = null;

  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [gatewayBlockedAliTask] });
  });
  await page.route('**/api/product-selection/ali1688-collections/87027/plugin-assignment', async (route) => {
    createPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      json: {
        assignmentId: '90027',
        assignmentCode: 'ALI1688-PLUGIN-90027-ABCDEF',
        taskId: '87027',
        sourceCollectionId: '86001',
        taskNo: 'ALI1688-20260522-027',
        status: 'created',
        expiresAt: '2026-05-22 15:30:00',
        current: true,
        message: '插件采集任务已创建。'
      }
    });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-detail')).toContainText('1688 自动采集受限');
  await page.getByRole('button', { name: '用浏览器插件采集' }).click();
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('插件任务码');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('ALI1688-PLUGIN-90027-ABCDEF');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('任务ID 90027');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('2026-05-22 15:30:00');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('请先登录插件');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('任务码只用于定位任务');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('Bearer');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('token');
  expect(createPayload).toEqual({});
});

test('standalone 1688 page shows accepted plugin candidates with missing fields pending completion', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [pluginAcceptedAliTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-detail')).toContainText('插件候选已接收');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('插件提交的 1688 候选');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('插件保留的供应商线索');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('待补充');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('规则分');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('综合分');
});

test('not started task shows real empty candidate state without pending slots', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [emptyAliTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-queue')).toContainText('仿真花束');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('暂无真实1688候选结果');
  await expect(page.locator('.ali1688-candidate-card')).toHaveCount(0);
  await expect(page.locator('.ali1688-pending-slot')).toHaveCount(0);
});

test('queued 1688 task renders pending slots only when the real task is queued', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [queuedAliTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-queue')).toContainText('采集中的浴袍');
  await expect(page.getByTestId('ali1688-task-queue')).toContainText('待选 5');
  await expect(page.locator('.ali1688-pending-slot')).toHaveCount(5);
  await expect(page.locator('.ali1688-candidate-card')).toHaveCount(0);
});

test('failed 1688 task can be retried from the standalone page', async ({ page }) => {
  let tasks: Array<Record<string, unknown>> = [failedAliTask];

  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: tasks });
  });
  await page.route('**/api/product-selection/ali1688-collections/87004/retry', async (route) => {
    tasks = [
      {
        ...failedAliTask,
        status: 'queued',
        progressPercent: 5,
        failureCode: undefined,
        failureMessage: undefined,
        message: '1688 候选采集已排队。'
      }
    ];
    await route.fulfill({ json: tasks[0] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-queue')).toContainText('失败的香薰蜡烛');
  await expect(page.getByTestId('ali1688-task-queue')).toContainText('采集失败');
  await page.getByRole('button', { name: '重试' }).click();
  await expect(page.getByTestId('ali1688-task-queue')).toContainText('排队中');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('重试');
});

test('finished 1688 task can be recollected by source collection', async ({ page }) => {
  let tasks: Array<Record<string, unknown>> = [scoredAliTask];

  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: tasks });
  });
  await page.route('**/api/product-selection/source-collections/86001/ali1688/recollect', async (route) => {
    tasks = [
      {
        ...queuedAliTask,
        id: '87009',
        taskId: '87009',
        sourceCollectionId: '86001',
        sourceCollectionNo: scoredAliTask.sourceCollectionNo,
        sourceTitle: scoredAliTask.sourceTitle,
        sourceTitleCn: scoredAliTask.sourceTitleCn
      }
    ];
    await route.fulfill({ json: tasks[0] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-detail')).toContainText('仿真罂粟花束 6 支装');
  await page.getByRole('button', { name: '重跑' }).click();
  await expect(page.getByTestId('ali1688-task-queue')).toContainText('排队中');
  await expect(page.locator('.ali1688-pending-slot')).toHaveCount(5);
});
