import { expect, test } from '@playwright/test';

const baseCollection = {
  id: 'source-001',
  collectionNo: 'PSC-20260514-001',
  storeId: 'STR245027-NAE',
  storeName: 'xingyao',
  storeCode: 'STR245027-NAE',
  sourceType: 'marketplace-url',
  sourcePlatform: 'Amazon',
  sourceUrl: 'https://www.amazon.com/dp/example-flower-bouquet',
  pageUrl: 'https://www.amazon.com/dp/example-flower-bouquet',
  sourceTitle:
    'DUYONE Artificial Flowers 6 Stems Poppy Silk Bouquet for Wedding Home Party Decoration Table Centerpiece Arrangement Orange Pink 6pcs',
  sourceTitleCn: '仿真花束',
  sourceTitleAr:
    'باقة زهور صناعية فاخرة للمنزل والحفلات وحفلات الزفاف وتنسيق الطاولات باللون البرتقالي والوردي',
  sourceImageUrl: 'https://images.example.com/main.jpg',
  imageUrls: ['https://images.example.com/main.jpg', 'https://images.example.com/detail.jpg'],
  priceSummary: '12.99',
  moqHint: '1 pcs min',
  shippingFrom: 'Ships from Amazon',
  brandName: '',
  unitCount: '6.0 Count',
  colorName: 'Orange Pink 6pcs',
  specHints: [
    'Brand: DUYONE',
    'Plant or Animal Product Type: Artificial Mohnblume',
    'Color: Orange Pink 6pcs',
    'Material: Silk',
    'Product Dimensions: 0.4"D x 2"W x 23"H',
    'Item Weight: 380.5 g',
    'Package Dimensions: 24 x 8 x 6 cm',
    'Package Weight: 0.45 kg',
    'Unit Count: 6.0 Count',
    'Rating: 4.4 out of 5 stars',
    'Review Count: 494'
  ],
  selectedText: '仿真花束',
  selectedTextAr: 'زهور صناعية مناسبة للزينة اليومية.',
  notes: '',
  status: 'success',
  statusText: '采集成功',
  collectedAt: '2026-05-14 10:30',
  collectionStartedAt: '2026-05-14 10:19:57',
  collectionFinishedAt: '2026-05-14 10:30:00',
  collectionDurationSeconds: 603,
  collectedBy: '系统管理员',
  ali1688Collection: {
    id: 'ali-task-001',
    taskId: 'ali-task-001',
    sourceCollectionId: 'source-001',
    sourceCollectionNo: 'PSC-20260514-001',
    sourcePlatform: 'Amazon',
    sourceTitle:
      'DUYONE Artificial Flowers 6 Stems Poppy Silk Bouquet for Wedding Home Party Decoration Table Centerpiece Arrangement Orange Pink 6pcs',
    sourceTitleCn: '仿真花束',
    sourceImageUrl: 'https://images.example.com/main.jpg',
    status: 'partial_success',
    progressPercent: 100,
    searchMode: '主图图搜',
    selectedImageCount: 1,
    scannedCount: 10,
    candidateCount: 1,
    recommendedCount: 1,
    failureCode: 'candidate_count_less_than_10',
    failureMessage: '1688 图搜候选不足 10 个，已展示可用候选。',
    startedAt: '2026-05-14 10:31',
    finishedAt: '2026-05-14 10:36',
    message: '1688 图搜候选不足 10 个，已展示可用候选。',
    canGenerateProcurementOrder: false,
    candidates: [
      {
        id: 'ali-candidate-001',
        rankNo: 1,
        selectedRankNo: 1,
        level: 'recommended',
        title: '仿真罂粟花束 6 支装 家居装饰',
        supplierName: '义乌诚信通源头工厂',
        candidateUrl: 'https://detail.1688.com/offer/745612345678.html',
        priceText: '¥12.80-18.60',
        moqText: '2 件起批',
        locationText: '浙江 义乌',
        ruleScore: 45,
        scoreStatus: 'partial',
        reasons: ['价格和起订量适合小单验证']
      }
    ]
  },
  sourceDescriptionEn: 'Artificial Poppies Flowers A set contains 6 poppy branches, each 23.6 inches long.',
  sourceDescriptionAr: 'زهور خشخاش صناعية، تحتوي المجموعة على 6 فروع بطول 23.6 بوصة.',
  sourceSellingPointsEn: ['[Home decor]- Artificial flowers for home decoration.', '[Party decor]- Suitable for parties and weddings.'],
  sourceSellingPointsAr: ['[ديكور المنزل]- زهور صناعية للديكور المنزلي.', '[ديكور الحفلات]- مناسبة للحفلات والزفاف.'],
  collectedFieldCount: 11,
  collectedFieldTotal: 15,
  specAttributeCount: 8,
  imageCount: 2
};

const storeSyncOverview = {
  mode: 'mock',
  ready: true,
  selectedOwnerId: 10003,
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

test.beforeEach(async ({ page }) => {
  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: storeSyncOverview });
  });
});

test('new manual selection collection shows feedback when start collection is blocked by form validation', async ({ page }) => {
  let createRequestCount = 0;

  await page.route('**/api/product-selection/source-collections?**', async (route) => {
    await route.fulfill({ json: [baseCollection] });
  });
  await page.route('**/api/product-selection/source-collections', async (route) => {
    createRequestCount += 1;
    await route.fulfill({ json: baseCollection });
  });

  await page.goto('/product/manual-selection?devSession=1&devRole=boss&grantManualSelection=1&grantPurchase=1');
  await page.getByTestId('manual-selection-new-button').click();
  const newDialog = page.getByRole('dialog', { name: '新建采集' });
  await expect(newDialog.getByPlaceholder('请输入三方链接')).toBeVisible();

  await newDialog.getByRole('button', { name: '开始采集' }).click();
  await expect(newDialog.getByTestId('manual-selection-new-feedback')).toContainText('请输入三方链接');

  await newDialog.getByPlaceholder('请输入三方链接').fill('https://us.shein.com/Artificial-Poppy-Flowers-p-55110364.html?mallCode=1');
  await newDialog.getByRole('button', { name: '开始采集' }).click();
  await expect(newDialog.getByTestId('manual-selection-new-feedback')).toContainText('SHEIN 完整采集暂缓，当前仅验收 Amazon / Noon。');
  expect(createRequestCount).toBe(0);
});

test('manual selection polling updates collecting rows without table-wide loading', async ({ page }) => {
  let listRequestCount = 0;
  let releaseSecondListRequest: (() => void) | undefined;
  const runningCollection = {
    ...baseCollection,
    status: 'running',
    statusText: '采集中',
    collectedAt: '2026-05-14 10:30',
    sourceTitleCn: '轮询中的商品'
  };
  const completedCollection = {
    ...runningCollection,
    status: 'success',
    statusText: '采集成功',
    collectedAt: '2026-05-14 10:31'
  };

  await page.route('**/api/product-selection/source-collections?**', async (route) => {
    listRequestCount += 1;
    if (listRequestCount === 1) {
      await route.fulfill({ json: { items: [runningCollection], total: 1, page: 1, pageSize: 50 } });
      return;
    }
    await new Promise<void>((resolve) => {
      releaseSecondListRequest = resolve;
    });
    await route.fulfill({ json: { items: [completedCollection], total: 1, page: 1, pageSize: 50 } });
  });

  await page.goto('/product/manual-selection?devSession=1&devRole=boss&grantManualSelection=1&grantPurchase=1');
  await expect(page.getByText('轮询中的商品')).toBeVisible();
  await expect(page.getByText('采集中')).toBeVisible();
  await expect(page.locator('[data-testid="manual-selection-table"] .ant-spin-spinning')).toHaveCount(0);

  await expect.poll(() => listRequestCount, { timeout: 7000 }).toBeGreaterThan(1);
  await page.waitForTimeout(100);
  await expect(page.locator('[data-testid="manual-selection-table"] .ant-spin-spinning')).toHaveCount(0);
  await expect(page.getByTestId('manual-selection-refresh-button').locator('.anticon-loading')).toHaveCount(0);

  releaseSecondListRequest?.();
  await expect(page.getByText('采集成功')).toBeVisible();
  await expect(page.locator('[data-testid="manual-selection-table"] .ant-spin-spinning')).toHaveCount(0);
});

test('manual selection 1688 panel shows production gateway blocked status', async ({ page }) => {
  const blockedCollection = {
    ...baseCollection,
    ali1688Collection: {
      ...baseCollection.ali1688Collection,
      status: 'queued',
      progressPercent: 5,
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
          id: 'ali-candidate-blocked',
          rankNo: 1,
          selectedRankNo: 1,
          level: 'recommended',
          title: '受限状态下保留的 1688 候选',
          supplierName: '供应商线索已保留',
          candidateUrl: 'https://detail.1688.com/offer/619232628706.html',
          scoreStatus: 'partial'
        }
      ]
    }
  };

  await page.route('**/api/product-selection/source-collections?**', async (route) => {
    await route.fulfill({ json: [blockedCollection] });
  });
  await page.route('**/api/product-selection/ali1688-collections/ali-task-001/plugin-assignment', async (route) => {
    await route.fulfill({
      json: {
        assignmentId: '90041',
        assignmentCode: 'ALI1688-PLUGIN-90041-MANUAL',
        taskId: 'ali-task-001',
        sourceCollectionId: 'source-001',
        taskNo: 'ALI1688-20260522-041',
        status: 'created',
        expiresAt: '2026-05-22 16:00:00',
        current: true,
        message: '插件采集任务已创建。'
      }
    });
  });

  await page.goto('/product/manual-selection?devSession=1&devRole=boss&grantManualSelection=1&grantPurchase=1');
  await page.getByTestId('manual-selection-detail-button').first().click();
  const detailDialog = page.getByRole('dialog', { name: '采集详情' });

  await expect(detailDialog.getByTestId('manual-selection-ali1688-panel')).toContainText('1688 访问受限');
  await expect(detailDialog.getByTestId('manual-selection-ali1688-panel')).toContainText('系统已暂停自动采集');
  await expect(detailDialog.getByTestId('manual-selection-ali1688-panel')).toContainText('受限状态下保留的 1688 候选');
  await expect(detailDialog.getByTestId('manual-selection-ali1688-panel')).toContainText('待补充');
  await expect(detailDialog.getByRole('button', { name: '用浏览器插件采集' })).toBeVisible();
  await detailDialog.getByRole('button', { name: '用浏览器插件采集' }).click();
  await expect(detailDialog.getByTestId('manual-selection-ali1688-panel')).toContainText('插件任务码');
  await expect(detailDialog.getByTestId('manual-selection-ali1688-panel')).toContainText('ALI1688-PLUGIN-90041-MANUAL');
  await expect(detailDialog.getByTestId('manual-selection-ali1688-panel')).toContainText('请先登录插件');
  await expect(detailDialog.getByTestId('manual-selection-ali1688-panel')).not.toContainText('Bearer');
});

test('manual selection list uses server pagination, total, and search filters', async ({ page }) => {
  const firstPageCollections = Array.from({ length: 50 }, (_, index) => ({
    ...baseCollection,
    id: `source-page-1-${index + 1}`,
    collectionNo: `PSC-P1-${index + 1}`,
    sourceTitle: `Amazon sample ${index + 1}`,
    sourceTitleCn: `亚马逊样例 ${index + 1}`
  }));
  const secondPageCollection = {
    ...baseCollection,
    id: 'source-page-2-1',
    collectionNo: 'PSC-P2-1',
    sourceTitle: 'Noon historical robe on page two',
    sourceTitleCn: '第二页历史浴袍',
    sourcePlatform: 'Noon'
  };
  const matchedCollection = {
    ...baseCollection,
    id: 'source-search-1',
    collectionNo: 'PSC-SEARCH-1',
    sourceTitle: 'Premium Sherpa search result',
    sourceTitleCn: '搜索命中的睡袍',
    sourcePlatform: 'Noon'
  };
  const requestedUrls: URL[] = [];

  await page.route('**/api/product-selection/source-collections?**', async (route) => {
    const requestUrl = new URL(route.request().url());
    requestedUrls.push(requestUrl);
    const pageNo = requestUrl.searchParams.get('page');
    const title = requestUrl.searchParams.get('sourceTitle');
    if (title === 'Sherpa') {
      await route.fulfill({
        json: {
          items: [matchedCollection],
          total: 1,
          page: 1,
          pageSize: 50
        }
      });
      return;
    }
    if (pageNo === '2') {
      await route.fulfill({
        json: {
          items: [secondPageCollection],
          total: 75,
          page: 2,
          pageSize: 50
        }
      });
      return;
    }
    await route.fulfill({
      json: {
        items: firstPageCollections,
        total: 75,
        page: 1,
        pageSize: 50
      }
    });
  });

  await page.goto('/product/manual-selection?devSession=1&devRole=boss&grantManualSelection=1&grantPurchase=1');

  await expect(page.getByTestId('manual-selection-table')).toBeVisible();
  expect(requestedUrls[0].searchParams.get('page')).toBe('1');
  expect(requestedUrls[0].searchParams.get('pageSize')).toBe('50');
  await expect(page.getByText('共 75 条')).toBeVisible();

  await page.locator('.ant-pagination-item-2').click();
  await expect(page.getByText('Noon historical robe on page two')).toBeVisible();
  expect(requestedUrls.at(-1)?.searchParams.get('page')).toBe('2');

  await page.getByPlaceholder('英文名').fill('Sherpa');
  await page.getByRole('button', { name: '搜索' }).click();
  await expect(page.getByText('Premium Sherpa search result')).toBeVisible();
  await expect(page.getByText('共 1 条')).toBeVisible();
  const searchUrl = requestedUrls.at(-1);
  expect(searchUrl?.searchParams.get('page')).toBe('1');
  expect(searchUrl?.searchParams.get('sourceTitle')).toBe('Sherpa');
});

test('manual selection collection page closes the first phase workflow', async ({ page }) => {
  const collections = [baseCollection];
  let createRequestCount = 0;

  await page.route('**/api/product-selection/source-collections?**', async (route) => {
    await route.fulfill({ json: collections });
  });

  await page.route('**/api/product-selection/source-collections', async (route) => {
    createRequestCount += 1;
    const payload = route.request().postDataJSON() as {
      sourcePlatform?: string;
      pageUrl?: string;
      selectedText?: string;
      sourceTitleCn?: string;
    };
    const created = {
      ...baseCollection,
      id: 'source-new',
      collectionNo: 'PSC-20260514-NEW',
      sourcePlatform: payload.sourcePlatform || 'Noon',
      sourceUrl: payload.pageUrl,
      pageUrl: payload.pageUrl,
      sourceTitle: '采集中...',
      sourceTitleCn: payload.sourceTitleCn || payload.selectedText || '',
      sourceTitleAr: '',
      sourceImageUrl: '',
      imageUrls: [],
      selectedText: payload.selectedText || '',
      selectedTextAr: '',
      notes: '',
      status: 'running',
      statusText: '采集中',
      collectedAt: '2026-05-14 10:35',
      imageCount: 0,
      ali1688Collection: {
        sourceCollectionId: 'source-new',
        status: 'not_started',
        progressPercent: 0,
        candidateCount: 0,
        recommendedCount: 0,
        candidates: [],
        message: '暂无真实1688候选采集任务。'
      }
    };
    collections.unshift(created);
    await route.fulfill({ json: created });
  });

  await page.route('**/api/product-selection/source-collections/source-001/recollect', async (route) => {
    const recollected = {
      ...baseCollection,
      status: 'running',
      statusText: '采集中',
      collectedAt: '2026-05-14 10:36'
    };
    collections[collections.findIndex((item) => item.id === 'source-001')] = recollected;
    await route.fulfill({ json: recollected });
  });

  await page.goto('/product/manual-selection?devSession=1&devRole=boss&grantManualSelection=1&grantPurchase=1');

  await expect(page.getByTestId('manual-selection-table')).toBeVisible();
  await expect(page.locator('.ant-table-cell-fix-right')).not.toHaveCount(0);
  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '人工选品' })).toBeVisible();
  await expect(page.locator('.ant-table-thead th').filter({ hasText: '名称' })).toBeVisible();
  await expect(page.locator('.ant-table-thead th').filter({ hasText: '三方渠道' })).toHaveCount(0);
  await expect(page.locator('.ant-table-thead th').filter({ hasText: '英文名' })).toHaveCount(0);
  await expect(page.locator('.ant-table-thead th').filter({ hasText: '中文名' })).toHaveCount(0);
  await expect(page.locator('.ant-table-thead th').filter({ hasText: '采集状态' })).toBeVisible();
  await expect(page.locator('.ant-table-thead th').filter({ hasText: '采集完整度' })).toHaveCount(0);
  await expect(page.locator('.ant-table-thead th').filter({ hasText: '源头采集' })).toHaveCount(0);
  await expect(page.getByTestId('manual-selection-table').getByText('英文名', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('manual-selection-table').getByText('中文名', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('manual-selection-source-platform-tag').first()).toHaveText('Amazon');
  await expect(page.getByTestId('manual-selection-source-image-gallery').first()).toHaveAttribute('role', 'button');
  const sourceImageBox = await page.getByTestId('manual-selection-source-image-gallery').first().boundingBox();
  expect(sourceImageBox?.height || 0).toBeGreaterThanOrEqual(88);
  const sourcePlatformTagBox = await page.getByTestId('manual-selection-source-platform-tag').first().boundingBox();
  expect(sourcePlatformTagBox?.y || 0).toBeGreaterThanOrEqual((sourceImageBox?.y || 0) + 104);
  await expect(page.getByText('DUYONE Artificial')).toBeVisible();
  await expect(page.getByText('仿真花束')).toBeVisible();
  const sourceNameBox = await page.getByTestId('manual-selection-source-name-en').first().boundingBox();
  const sourceNameCopyBox = await page.getByTestId('manual-selection-source-name-en-copy').first().boundingBox();
  expect(Math.abs((sourceNameBox?.y || 0) - (sourceNameCopyBox?.y || 0))).toBeLessThanOrEqual(4);
  await page.getByTestId('manual-selection-source-name-en').first().hover();
  await expect(page.getByRole('tooltip')).toContainText('DUYONE Artificial Flowers');
  await page.mouse.move(20, 20);
  await expect(page.getByRole('cell', { name: '1' }).first()).toBeVisible();
  await expect(page.getByTestId('manual-selection-collection-status').first().getByText('采集成功')).toBeVisible();
  await expect(page.getByTestId('manual-selection-collection-status').first()).not.toContainText('用时10分3s');
  await expect(page.getByTestId('manual-selection-collected-at').first()).toContainText('2026-05-14 10:30:00');
  await expect(page.getByTestId('manual-selection-collected-at').first()).toContainText('用时10分3s');
  await expect(page.getByTestId('manual-selection-collection-status').first().getByText('基础信息：11/15')).toBeVisible();
  await expect(page.getByTestId('manual-selection-collection-status').first().getByText('其他 8条')).toBeVisible();
  const basicCompletenessBox = await page.getByTestId('manual-selection-basic-completeness').first().boundingBox();
  const specCompletenessBox = await page.getByTestId('manual-selection-spec-completeness').first().boundingBox();
  expect(Math.abs((basicCompletenessBox?.y || 0) - (specCompletenessBox?.y || 0))).toBeLessThanOrEqual(4);
  await page.getByTestId('manual-selection-basic-completeness').first().hover();
  await expect(page.locator('.ant-popover-inner').filter({ hasText: '未采集到' })).toContainText('ASIN');
  await page.getByTestId('manual-selection-spec-completeness').first().hover();
  await expect(page.locator('.ant-popover-inner').filter({ hasText: '已采集到的其他内容' })).toContainText('Plant or Animal Product Type');
  await expect(page.getByText('1688查询')).toBeVisible();
  await expect(page.getByText('候选').first()).toBeVisible();
  await expect(page.getByText('推荐').first()).toBeVisible();
  const skuHeaderIndex = await page.locator('.ant-table-thead th').filter({ hasText: 'sku数量' }).evaluate((node) => (node as HTMLTableCellElement).cellIndex);
  const statusHeaderIndex = await page
    .locator('.ant-table-thead th')
    .filter({ hasText: '采集状态' })
    .evaluate((node) => (node as HTMLTableCellElement).cellIndex);
  expect(statusHeaderIndex).toBeLessThan(skuHeaderIndex);

  await page.getByTestId('manual-selection-detail-button').first().click();
  const detailDialog = page.getByRole('dialog', { name: '采集详情' });
  await expect(detailDialog).toBeVisible();
  await expect(detailDialog).toHaveCSS('width', '1080px');
  const detailBody = detailDialog.getByTestId('manual-selection-detail-modal');
  await expect(detailDialog.locator('.manual-selection-detail-main-image')).toHaveCount(0);
  const heroBox = await detailBody.locator('.manual-selection-detail-hero').boundingBox();
  expect(heroBox?.height || 999).toBeLessThanOrEqual(180);
  const progressBox = await detailDialog.locator('.manual-selection-detail-progress').boundingBox();
  expect(progressBox?.width || 999).toBeLessThanOrEqual(260);
  const horizontalOverflow = await detailBody.evaluate((node) => node.scrollWidth - node.clientWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(1);
  await expect(detailDialog.getByText('采集信息进度')).toBeVisible();
  await expect(detailDialog.getByText('11/15')).toBeVisible();
  await expect(detailDialog.getByText('中文名').first()).toBeVisible();
  await expect(detailDialog.getByText('仿真花束').first()).toBeVisible();
  await expect(detailDialog.getByText('英文标题').first()).toBeVisible();
  await expect(detailDialog.locator('a[href*="example-flower-bouquet"]').filter({ hasText: 'DUYONE Artificial' }).first()).toBeVisible();
  await expect(detailDialog.getByText('阿语标题').first()).toBeVisible();
  await expect(detailDialog.getByText('باقة زهور صناعية').first()).toBeVisible();
  await expect(detailDialog.getByText('商品图片')).toBeVisible();
  await expect(detailDialog.getByText('1688查询展示')).toBeVisible();
  await expect(detailDialog.getByTestId('manual-selection-ali1688-panel')).toBeVisible();
  await expect(detailDialog.getByText('候选数量')).toBeVisible();
  await expect(detailDialog.getByText('仿真罂粟花束 6 支装 家居装饰')).toBeVisible();
  await expect(detailDialog.getByText('义乌诚信通源头工厂')).toBeVisible();
  await expect(detailDialog.getByText('生成采购单')).not.toBeVisible();
  await expect(detailDialog.getByText('卖点信息')).toBeVisible();
  const imagesTitleBox = await detailDialog.getByText('商品图片').boundingBox();
  const sellingTitleBox = await detailDialog.getByText('卖点信息').boundingBox();
  expect(imagesTitleBox?.y || 0).toBeLessThan(sellingTitleBox?.y || 0);
  await expect(detailDialog.getByText('阿语卖点')).toBeVisible();
  await expect(detailDialog.getByTestId('manual-selection-detail-summary-item')).toHaveCount(4);
  await expect(detailDialog.getByText('Artificial Poppies Flowers A set contains 6 poppy branches')).toBeVisible();
  await expect(detailDialog.getByText('物流评估')).toBeVisible();
  const logisticsAssessment = detailDialog.getByTestId('manual-selection-logistics-assessment');
  await expect(logisticsAssessment).toBeVisible();
  await expect(detailDialog.getByText('物流信息完整度')).toBeVisible();
  await expect(detailDialog.getByText('8/8')).toBeVisible();
  await expect(detailDialog.getByText('低风险')).toBeVisible();
  await expect(detailDialog.locator('.manual-selection-logistics-tags').getByText('空运可发', { exact: true })).toBeVisible();
  await expect(logisticsAssessment.getByText('24 x 8 x 6 cm')).toBeVisible();
  await expect(logisticsAssessment.getByText('0.45 kg', { exact: true })).toBeVisible();
  await expect(detailDialog.getByText('来源与缺失')).toBeVisible();
  await expect(detailDialog.getByText('基础规格')).toBeVisible();
  await expect(detailDialog.getByText('包装信息')).toBeVisible();
  await expect(detailDialog.getByText('市场信号')).toBeVisible();
  await expect(detailDialog.getByText('Plant or Animal Product Type')).toBeVisible();
  await expect(detailDialog.getByText('Artificial Mohnblume')).toBeVisible();
  await expect(detailDialog.getByText('Unit Count')).toBeVisible();
  await expect(detailDialog.getByText('4.4 out of 5 stars')).toBeVisible();
  await expect(detailDialog.getByText('Amazon')).toHaveCount(0);
  await expect(detailDialog.getByText('采集成功')).toHaveCount(0);
  await expect(detailDialog.getByText('2026-05-14 10:30')).toHaveCount(0);
  await expect(detailDialog.getByText('SKU 1')).toHaveCount(0);
  await expect(detailDialog.getByText('USD 12.99')).toBeVisible();
  await expect(detailDialog.getByText('品牌未采集到')).toBeVisible();
  await expect(detailDialog.getByText('SKU 数量')).toHaveCount(0);
  await expect(detailDialog.getByText('采集完整度')).toHaveCount(0);
  await expect(detailDialog.getByText('三方链接')).toHaveCount(0);
  await expect(detailDialog.getByText('MOQ')).toHaveCount(0);
  await expect(detailDialog.getByText('发货地')).toHaveCount(0);
  await detailDialog.getByRole('button', { name: 'Close' }).first().click();
  await expect(detailDialog).toBeHidden();

  await page.getByTestId('manual-selection-new-button').click();
  const newDialog = page.getByRole('dialog', { name: '新建采集' });
  const siteLinkLabelBox = await newDialog.getByText('三方链接').first().boundingBox();
  const titleCnLabelBox = await newDialog.getByText('中文标题').first().boundingBox();
  expect(siteLinkLabelBox?.y || 999).toBeLessThan(titleCnLabelBox?.y || 0);
  await newDialog.getByPlaceholder('请输入三方链接').fill('https://www.noon.com/saudi-en/test/p/');
  await newDialog.getByPlaceholder('请输入中文标题').fill('测试中文商品');
  await newDialog.getByRole('button', { name: '开始采集' }).click();
  await expect(page.getByText('测试中文商品')).toBeVisible();
  await expect(page.getByTestId('manual-selection-ali-button')).toHaveCount(0);
  await expect(page.getByText('共 2 条')).toBeVisible();
  expect(createRequestCount).toBe(1);

  await page.getByTestId('manual-selection-new-button').click();
  const sheinDialog = page.getByRole('dialog', { name: '新建采集' });
  await expect(sheinDialog.getByText('SHEIN 完整采集暂缓')).toBeVisible();
  await sheinDialog.getByPlaceholder('请输入三方链接').fill('https://us.shein.com/Artificial-Poppy-Flowers-p-55110364.html?mallCode=1');
  await sheinDialog.getByRole('button', { name: '开始采集' }).click();
  await expect(sheinDialog.getByTestId('manual-selection-new-feedback')).toContainText('SHEIN 完整采集暂缓，当前仅验收 Amazon / Noon。');
  expect(createRequestCount).toBe(1);
  await sheinDialog.getByRole('button', { name: 'Close' }).click();

  await page.getByTestId('manual-selection-recollect-button').last().click();
  await expect(page.getByText('采集中').first()).toBeVisible();

  await page.locator('.nuono-shell-sidebar-rail-item[title="采购"]').hover();
  await page.getByTestId('sidebar-menu').getByText('采购单').click();
  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '人工选品' })).toBeVisible();
  await page.mouse.move(900, 120);
  await page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '人工选品' }).click();
  await expect(page.getByTestId('manual-selection-table')).toBeVisible();
});

test('system admin session does not show manual selection menu', async ({ page }) => {
  await page.goto('/?devSession=1&grantManualSelection=1');

  await expect(page.getByTestId('sidebar-menu')).toBeVisible();
  await expect(page.getByTestId('sidebar-menu').getByText('人工选品')).toHaveCount(0);
});
