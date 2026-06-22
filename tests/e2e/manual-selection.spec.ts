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
  sourceTitle: 'DUYONE Artificial Flowers 6 Stems Poppy Silk Bouquet',
  sourceTitleCn: '仿真花束',
  sourceTitleAr: 'باقة زهور صناعية',
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
  collectedBy: '系统管理员',
  ali1688Collection: {
    id: 'ali-task-001',
    taskId: 'ali-task-001',
    sourceCollectionId: 'source-001',
    sourceCollectionNo: 'PSC-20260514-001',
    sourcePlatform: 'Amazon',
    sourceTitle: 'DUYONE Artificial Flowers 6 Stems Poppy Silk Bouquet',
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

test('manual selection row opens product listing editor with source prefill', async ({ page }) => {
  const listingCollection = {
    ...baseCollection,
    id: '86001',
    collectionNo: 'PSC-20260514-LISTING',
    brandName: 'DUYONE'
  };

  await page.route('**/api/product-selection/source-collections?**', async (route) => {
    await route.fulfill({ json: [listingCollection] });
  });

  await page.goto('/product/manual-selection?devSession=1&devRole=boss&grantManualSelection=1&grantPurchase=1');

  await page.getByTestId('manual-selection-listing-button').first().click();

  await expect(page).toHaveURL(/\/purchase\/listing/);
  await expect(page.getByText('来源：人工采集')).toBeVisible();
  await expect(page.getByText('PSC-20260514-LISTING')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Offer' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Content' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Sizes' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Product Insights' })).toBeVisible();
  await expect(page.getByText('商品详情编辑', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('新增 PSKU')).toBeVisible();
  await expect(page.getByText('Not Live')).toBeVisible();
  await expect(page.getByText('Base Price')).toBeVisible();
  await expect.poll(async () => {
    return page.locator('input').evaluateAll((inputs) =>
      inputs.some((input) => (input as HTMLInputElement).value === '12.99')
    );
  }).toBe(true);
  await expect(page.getByRole('button', { name: '保存草稿' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: '提交 dry-run' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: '发布当前修改' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '从 Noon 同步' })).toHaveCount(0);
});

test('manual selection collection page closes the first phase workflow', async ({ page }) => {
  const collections = [baseCollection];

  await page.route('**/api/product-selection/source-collections?**', async (route) => {
    await route.fulfill({ json: collections });
  });

  await page.route('**/api/product-selection/source-collections', async (route) => {
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
  await expect(page.getByTestId('workspace-tabs-bar').getByRole('tab', { name: '人工选品' })).toBeVisible();
  await expect(page.getByText('DUYONE Artificial Flowers 6 Stems Poppy Silk Bouquet')).toBeVisible();
  await expect(page.getByText('仿真花束')).toBeVisible();
  await expect(page.getByRole('cell', { name: '1' }).first()).toBeVisible();
  await expect(page.getByText('基础信息：11/15').first()).toBeVisible();
  await expect(page.getByText('其他 8条').first()).toBeVisible();
  await expect(page.getByText('1688查询')).toBeVisible();
  await expect(page.getByText('候选').first()).toBeVisible();
  await expect(page.getByText('推荐').first()).toBeVisible();
  const skuHeaderIndex = await page.locator('.ant-table-thead th').filter({ hasText: 'sku数量' }).evaluate((node) => (node as HTMLTableCellElement).cellIndex);
  const completenessHeaderIndex = await page
    .locator('.ant-table-thead th')
    .filter({ hasText: '采集完整度' })
    .evaluate((node) => (node as HTMLTableCellElement).cellIndex);
  expect(completenessHeaderIndex).toBeLessThan(skuHeaderIndex);

  await page.getByTestId('manual-selection-detail-button').first().click();
  const detailDialog = page.getByRole('dialog', { name: '采集详情' });
  await expect(detailDialog).toBeVisible();
  await expect(detailDialog).toHaveCSS('width', '1080px');
  await expect(detailDialog.getByText('采集信息进度')).toBeVisible();
  await expect(detailDialog.getByText('11/15')).toBeVisible();
  await expect(detailDialog.getByText('中文名').first()).toBeVisible();
  await expect(detailDialog.getByText('仿真花束').first()).toBeVisible();
  await expect(detailDialog.getByText('英文标题').first()).toBeVisible();
  await expect(detailDialog.getByRole('link', { name: 'DUYONE Artificial Flowers 6 Stems Poppy Silk Bouquet' })).toHaveAttribute(
    'href',
    /example-flower-bouquet/
  );
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
  await newDialog.getByPlaceholder('请输入中文标题').fill('测试中文商品');
  await newDialog.getByPlaceholder('请输入三方链接').fill('https://www.noon.com/saudi-en/test/p/');
  await newDialog.getByRole('button', { name: '开始采集' }).click();
  await expect(page.getByText('测试中文商品')).toBeVisible();
  await expect(page.getByTestId('manual-selection-ali-button')).toHaveCount(0);
  await expect(page.getByText('共 2 条')).toBeVisible();

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
