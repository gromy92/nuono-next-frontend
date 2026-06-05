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
      pricePreviewStatus: 'price_probe_pending',
      candidateGateStatus: 'price_probe_pending',
      autoInquiryEligible: false,
      procurementInquiryStatus: 'BACKUP_POOL'
    }
  ]
};

const confirmedPriceAliTask = {
  ...scoredAliTask,
  id: '87005',
  taskId: '87005',
  sourceCollectionNo: 'PSC-20260518-PRICE',
  candidates: [
    {
      ...scoredAliTask.candidates[0],
      id: '88005',
      priceText: '¥6.93 运费4元起 4400+件 50件起批',
      scoreStatus: 'final',
      totalScore: 88,
      scoreBreakdown: {
        matchScore: 31,
        specScore: 17,
        priceScore: 12,
        moqScore: 8,
        supplierScore: 12,
        deliveryScore: 8
      },
      aiAssessmentStatus: 'success',
      pricePreviewStatus: 'price_confirmed',
      confirmedRealPriceText: '¥38.40',
      pricePreviewSafetyMode: 'preview_only',
      candidateGateStatus: 'inquiry_eligible',
      autoInquiryEligible: true,
      procurementInquiryStatus: 'IN_POOL_WAITING_SEND'
    }
  ]
};

const failedPriceAliTask = {
  ...scoredAliTask,
  id: '87006',
  taskId: '87006',
  sourceCollectionNo: 'PSC-20260518-PRICE-FAIL',
  candidates: [
    {
      ...scoredAliTask.candidates[0],
      id: '88006',
      pricePreviewStatus: 'price_probe_failed',
      pricePreviewFailureCode: 'shipping_unavailable',
      pricePreviewFailureMessage: '当前地区无法计算运费。',
      candidateGateStatus: 'price_probe_failed',
      autoInquiryEligible: false,
      procurementInquiryStatus: 'BACKUP_POOL'
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
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('待取价');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('列表价 ¥12.80-18.60');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('真实价 待取价');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('待自动询盘');
  await expect(page.locator('.ali1688-candidate-card')).toHaveCount(1);
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('生成采购单');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('加入候选');
});

test('standalone 1688 page separates list price hint from confirmed real price', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [confirmedPriceAliTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-detail')).toContainText('列表价 ¥6.93 运费4元起 4400+件 50件起批');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('真实价 ¥38.40');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('真实价已确认');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('可询盘');
});

test('standalone 1688 page exposes typed real price failure reason', async ({ page }) => {
  await page.route('**/api/product-selection/ali1688-collections?**', async (route) => {
    await route.fulfill({ json: [failedPriceAliTask] });
  });

  await page.goto('/purchase/1688-collection?devSession=1&devRole=boss&grantPurchase=1&grantManualSelection=1');

  await expect(page.getByTestId('ali1688-task-detail')).toContainText('取价失败');
  await expect(page.getByTestId('ali1688-task-detail')).toContainText('取价失败：当前地区无法计算运费。');
  await expect(page.getByTestId('ali1688-task-detail')).not.toContainText('待自动询盘');
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
