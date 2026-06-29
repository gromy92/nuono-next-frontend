import { chromium } from '@playwright/test'

const pageUrl =
  process.env.OFFICIAL_WAREHOUSE_STOCK_URL ||
  'http://127.0.0.1:9648/warehouse/official-warehouse-stock?devSession=1&grantWarehouse=1&devStore=STR108065-NSA&devSite=SA'
const appointmentPageUrl =
  process.env.OFFICIAL_WAREHOUSE_APPOINTMENT_URL ||
  'http://127.0.0.1:9648/warehouse/official-warehouse?devSession=1&grantWarehouse=1&devStore=STR108065-NSA&devSite=SA'
const testImageBody = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64')

const forbiddenMainCopy = ['数据链路状态', '异常复核', '行级入仓报表已接入', '预约到货准确率报表已接入']

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function assertProductTableDoesNotScrollHorizontally(page) {
  const productTableOverflow = await page
    .locator('.official-warehouse-product-stock-table .ant-table-content')
    .first()
    .evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth
    }))
  assert(
    productTableOverflow.scrollWidth <= productTableOverflow.clientWidth + 2,
    'product stock table should fit the visible page without horizontal scrolling'
  )
}

const inboundNoonStatuses = new Set(['grn_completed', 'receiving', 'putaway_completed'])

function isInboundAsn(row) {
  return inboundNoonStatuses.has(String(row.noonAsnStatus || '').toLowerCase())
}

function inferSourceByTotalForSmoke(currentStock, rows) {
  let remaining = Math.max(Number(currentStock || 0), 0)
  const result = []
  const deduped = Array.from((rows || []).reduce((map, row) => {
    const key = [
      row.noonAsnNr || '',
      row.partnerSku || '',
      row.pskuCode || '',
      row.noonSku || '',
      row.pbarcodeCanonical || '',
      Number(row.qtyExpected || 0),
      Number(row.receivedQty || 0),
      Number(row.qcFailedQty || 0),
      Number(row.unidentifiedQty || 0),
      row.asnScheduleDate || '',
      row.asnCompletedAt || ''
    ].join('|')
    const existing = map.get(key)
    const importedAt = Date.parse(String(row.importedAt || '').replace(' ', 'T')) || 0
    const existingImportedAt = Date.parse(String(existing?.importedAt || '').replace(' ', 'T')) || 0
    if (!existing || importedAt >= existingImportedAt) {
      map.set(key, row)
    }
    return map
  }, new Map()).values())
  for (const row of deduped.sort((left, right) => {
    const leftTime = Date.parse(String(left.asnCompletedAt || left.asnScheduleDate || left.importedAt || '').replace(' ', 'T')) || 0
    const rightTime = Date.parse(String(right.asnCompletedAt || right.asnScheduleDate || right.importedAt || '').replace(' ', 'T')) || 0
    return rightTime - leftTime
  })) {
    const allocatable = Math.max(Number(row.receivedQty || 0) - Number(row.qcFailedQty || 0), 0)
    if (!allocatable || remaining <= 0) continue
    const estimated = Math.min(remaining, allocatable)
    remaining -= estimated
    const noonAsnNr = row.noonAsnNr || '未关联 ASN'
    const existing = result.find((item) => item.noonAsnNr === noonAsnNr)
    if (existing) {
      existing.estimated += estimated
    } else {
      result.push({ noonAsnNr, estimated })
    }
  }
  return {
    rows: result,
    matched: result.reduce((total, row) => total + row.estimated, 0),
    unmatched: remaining
  }
}

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 2048, height: 900 }, deviceScaleFactor: 1 })
  await page.route('https://f.nooncdn.com/**', (route) => {
    const url = route.request().url()
    if (/https:\/\/f\.nooncdn\.com\/p\/pzsku\/.+\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i.test(url)) {
      void route.fulfill({ status: 200, contentType: 'image/gif', body: testImageBody })
      return
    }
    void route.abort()
  })
  await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('text=商品详情', { timeout: 15000 })

  const stockWorkbenchTab = page.getByRole('tab', { name: '库存核对' })
  const appointmentWorkbenchTab = page.getByRole('tab', { name: 'Noon官方仓' })
  await stockWorkbenchTab.waitFor({ state: 'visible', timeout: 5000 })
  await appointmentWorkbenchTab.waitFor({ state: 'visible', timeout: 5000 })

  assert(
    (await page.getByRole('tab', { name: '入仓单视角' }).count()) === 0,
    'stock verification tab should not show inbound-order perspective directly'
  )

  const initialBody = await page.locator('body').innerText()
  assert(!initialBody.includes('官方仓库存核对'), 'stock page should not show official warehouse stock verification title copy')
  assert(!initialBody.includes('按 C 口径优先看有效在仓'), 'stock page should not show the C-caliber explanatory subtitle')
  assert(!initialBody.includes('库存分类'), 'stock page should not show stock category helper copy')
  const stockMetricButtons = page
    .locator('.official-warehouse-statistics-summary-group')
    .first()
    .locator('button.official-warehouse-metric')
  assert((await stockMetricButtons.count()) >= 5, 'top stock metric cards should be clickable filter buttons')
  const firstMetricBox = await stockMetricButtons.first().boundingBox()
  assert(firstMetricBox && firstMetricBox.height <= 42, 'top stock metric cards should be compact')
  const returnedStockResponse = page.waitForResponse((response) =>
    response.url().includes('/api/warehouse/official-warehouse/stock-statistics') &&
    response.url().includes('stockBucket=RETURNED') &&
    response.ok()
  )
  await stockMetricButtons.filter({ hasText: '退货' }).click()
  await returnedStockResponse
  const allStockResponse = page.waitForResponse((response) =>
    response.url().includes('/api/warehouse/official-warehouse/stock-statistics') &&
    !response.url().includes('stockBucket=') &&
    response.ok()
  )
  await stockMetricButtons.filter({ hasText: '当前库存' }).click()
  await allStockResponse
  assert(initialBody.includes('商品详情'), 'product tab should show merged product detail column')
  assert(!initialBody.includes('中文名'), 'product tab should not split Chinese name into a standalone column')
  assert(!initialBody.includes('英文名'), 'product tab should not split English name into a standalone column')
  assert(initialBody.includes('当前库存'), 'product tab should show current stock column')
  assert(initialBody.includes('库存来源'), 'product tab should show stock source progress column')
  assert(initialBody.includes('详情'), 'product tab should provide product detail entry')
  assert(
    (await page.getByRole('columnheader', { name: '有效在仓' }).count()) === 0,
    'product tab should not show effective stock as a standalone column'
  )
  assert(
    (await page.getByRole('columnheader', { name: '退货', exact: true }).count()) === 0,
    'product tab should not show returned stock as a standalone column'
  )
  assert(
    (await page.getByRole('columnheader', { name: '失败/异常', exact: true }).count()) === 0,
    'product tab should not show failed/exception stock as a standalone column'
  )
  assert(
    (await page.getByRole('columnheader', { name: '待确认', exact: true }).count()) === 0,
    'product tab should not show pending confirmation stock as a standalone column'
  )
  const productHeaderBox = await page.getByRole('columnheader', { name: '商品详情' }).first().boundingBox()
  assert(productHeaderBox && productHeaderBox.width <= 360, 'product detail column should stay compact on wide screens')
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.waitForTimeout(150)
  await assertProductTableDoesNotScrollHorizontally(page)
  await page.setViewportSize({ width: 2048, height: 900 })
  await page.waitForTimeout(150)
  const productTableBox = await page.locator('.official-warehouse-product-stock-table .ant-table').first().boundingBox()
  const productLastHeaderBox = await page.getByRole('columnheader', { name: '查看' }).first().boundingBox()
  assert(
    productTableBox &&
      productLastHeaderBox &&
      productLastHeaderBox.x + productLastHeaderBox.width >= productTableBox.x + productTableBox.width - 30,
    'product stock detail action should stay aligned to the right edge while product detail stays compact'
  )
  const productThumbBox = await page.locator('.official-warehouse-product-thumb, .official-warehouse-product-thumb-placeholder').first().boundingBox()
  assert(productThumbBox && Math.round(productThumbBox.width) === 80, 'product image should be 80px wide')
  assert(productThumbBox && Math.round(productThumbBox.height) === 80, 'product image should be 80px tall')
  const brokenProductImageCount = await page.locator('.official-warehouse-product-thumb').evaluateAll((images) =>
    images.filter((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth === 0).length
  )
  assert(brokenProductImageCount === 0, 'failed product images should fall back instead of showing browser broken-image UI')
  if ((await page.locator('.official-warehouse-product-thumb-placeholder').count()) > 0) {
    const placeholderBox = await page.locator('.official-warehouse-product-thumb-placeholder').first().boundingBox()
    assert(placeholderBox && Math.round(placeholderBox.width) === 80, 'product image fallback should be 80px wide')
    assert(placeholderBox && Math.round(placeholderBox.height) === 80, 'product image fallback should be 80px tall')
  }
  assert(
    (await page.locator('.official-warehouse-product-title-cn', { hasText: /^-$/ }).count()) === 0,
    'product detail should not render an extra dash line when Chinese title is missing'
  )
  const firstPsku = (await page.locator('.official-warehouse-product-psku').first().innerText()).trim()
  const stockApiResponse = await page.request.get(
    'http://127.0.0.1:18084/api/warehouse/official-warehouse/stock-statistics?storeCode=STR108065-NSA&siteCode=SA',
    { headers: { 'X-Nuono-Dev-Session-User-Id': '307' } }
  )
  const stockApiBody = await stockApiResponse.json()
  const firstApiRow = stockApiBody.rows?.[0]
  assert(firstApiRow?.partnerSku, 'stock API should provide partnerSku for product PSKU display')
  assert(firstPsku === firstApiRow.partnerSku, 'product detail should display partnerSku PSKU instead of Z code')
  await page.locator('.official-warehouse-product-title-en').first().hover()
  const titleTooltipText = await page.locator('.ant-tooltip').last().innerText({ timeout: 5000 })
  assert(titleTooltipText.includes(firstApiRow.titleEn), 'hovering English title should show the full English title')
  await page.locator('.official-warehouse-product-psku').first().hover()
  const pskuTooltip = page.locator('.ant-tooltip', { hasText: firstPsku }).last()
  await pskuTooltip.waitFor({ state: 'visible', timeout: 5000 })
  const pskuTooltipText = await pskuTooltip.innerText()
  assert(firstPsku && pskuTooltipText.includes(firstPsku), 'hovering product PSKU should show product PSKU')
  const stockSearch = page.getByPlaceholder('SKU / PSKU / 商品')
  const supermallSample = stockApiBody.rows?.find((row) =>
    row.warehouseStocks?.some((stock) =>
      Number(stock.currentStock || 0) > 0 &&
      stock.warehouseCode &&
      stock.warehouseCode.toUpperCase() !== 'RUH01S'
    )
  )
  assert(supermallSample?.partnerSku, 'stock API should provide a Supermall warehouse sample row')
  const supermallSearchResponse = page.waitForResponse((response) =>
    response.url().includes('/api/warehouse/official-warehouse/stock-statistics') &&
    response.url().includes(`keyword=${encodeURIComponent(supermallSample.partnerSku)}`) &&
    response.ok()
  )
  await stockSearch.fill(supermallSample.partnerSku)
  await stockSearch.press('Enter')
  await supermallSearchResponse
  const supermallSampleRow = page.locator('.official-warehouse-product-psku', { hasText: supermallSample.partnerSku })
    .locator('xpath=ancestor::tr[1]')
  await supermallSampleRow.waitFor({ state: 'visible', timeout: 5000 })
  const stockBreakdownText = await supermallSampleRow.locator('.official-warehouse-current-stock-detail').innerText()
  assert(stockBreakdownText.includes('总计'), 'current stock column should show total stock')
  assert(
    stockBreakdownText.includes('仓') || stockBreakdownText.includes('Supermall'),
    'current stock column should show warehouse-level stock'
  )
  const supermallWarehouseLine = supermallSampleRow.locator('.official-warehouse-current-stock-warehouse-line-supermall').first()
  const supermallWarehouseText = (await supermallWarehouseLine.innerText()).trim()
  assert(supermallWarehouseText.includes('Supermall'), 'non-RUH01S warehouse stock should be labeled as Supermall')
  const supermallWarehouseColor = await supermallWarehouseLine
    .locator('.official-warehouse-current-stock-warehouse-name')
    .evaluate((element) => getComputedStyle(element).color)
  assert(supermallWarehouseColor === 'rgb(37, 99, 235)', 'Supermall warehouse label should be blue')
  const zeroBucketSample = stockApiBody.rows?.find((row) =>
    /f\.nooncdn\.com\/(?:p\/)?pzsku\//i.test(String(row.imageUrl || '')) &&
    row.warehouseStocks?.some((stock) =>
      stock.warehouseCode?.toUpperCase() === 'RUH01S' &&
      stock.warehouseCode &&
      stock.effectiveStock > 0 &&
      stock.returnStock === 0 &&
      stock.failedOrExceptionStock === 0 &&
      stock.pendingConfirmationStock === 0
    )
  )
  assert(zeroBucketSample?.partnerSku, 'stock API should provide a visible zero-bucket sample row')
  const zeroBucketWarehouse = zeroBucketSample.warehouseStocks.find((stock) =>
    stock.warehouseCode &&
    stock.effectiveStock > 0 &&
    stock.returnStock === 0 &&
    stock.failedOrExceptionStock === 0 &&
    stock.pendingConfirmationStock === 0
  )
  const zeroBucketSearchResponse = page.waitForResponse((response) =>
    response.url().includes('/api/warehouse/official-warehouse/stock-statistics') &&
    response.url().includes(`keyword=${encodeURIComponent(zeroBucketSample.partnerSku)}`) &&
    response.ok()
  )
  await stockSearch.fill(zeroBucketSample.partnerSku)
  await stockSearch.press('Enter')
  await zeroBucketSearchResponse
  const zeroBucketSampleRow = page.locator('.official-warehouse-product-psku', { hasText: zeroBucketSample.partnerSku })
    .locator('xpath=ancestor::tr[1]')
  await zeroBucketSampleRow.waitFor({ state: 'visible', timeout: 5000 })
  const zeroBucketProductImage = zeroBucketSampleRow.locator('.official-warehouse-product-thumb').first()
  await zeroBucketProductImage.waitFor({ state: 'visible', timeout: 5000 })
  const zeroBucketProductImageHandle = await zeroBucketProductImage.elementHandle()
  assert(Boolean(zeroBucketProductImageHandle), 'product image element should be available')
  await page.waitForFunction(
    (image) => image instanceof HTMLImageElement && image.complete,
    zeroBucketProductImageHandle,
    { timeout: 5000 }
  )
  const zeroBucketProductImageSrc = await zeroBucketProductImage.getAttribute('src')
  assert(
    Boolean(zeroBucketProductImageSrc?.includes('/p/pzsku/') && /\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(zeroBucketProductImageSrc)),
    'product image should use normalized Noon CDN image URL'
  )
  const zeroBucketProductImageLoaded = await zeroBucketProductImage.evaluate((image) =>
    image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0
  )
  assert(zeroBucketProductImageLoaded, 'product image should render when API provides a Noon image URL')
  const zeroBucketWarehouseLine = zeroBucketSampleRow.locator('.official-warehouse-current-stock-warehouse-line', {
    hasText: zeroBucketWarehouse.warehouseCode
  }).first()
  const zeroBucketWarehouseText = (await zeroBucketWarehouseLine.innerText()).trim()
  assert(
    zeroBucketWarehouseText.includes(`有效 ${Number(zeroBucketWarehouse.effectiveStock).toLocaleString()}`),
    'warehouse stock line should show non-zero effective stock'
  )
  assert(!zeroBucketWarehouseText.includes('\n'), 'warehouse stock should stay on one line')
  assert(!zeroBucketWarehouseText.includes('退货 0'), 'zero returned stock should not be shown')
  assert(!zeroBucketWarehouseText.includes('异常 0'), 'zero exception stock should not be shown')
  assert(!zeroBucketWarehouseText.includes('待确认 0'), 'zero pending stock should not be shown')
  const fbnWarehouseLine = page.locator('.official-warehouse-current-stock-warehouse-line-fbn').first()
  const fbnWarehouseLabelColor = await fbnWarehouseLine
    .locator('.official-warehouse-current-stock-warehouse-name')
    .evaluate((element) => getComputedStyle(element).color)
  assert(fbnWarehouseLabelColor === 'rgb(21, 128, 61)', 'RUH01S warehouse label should be green')
  const effectiveColor = await zeroBucketWarehouseLine
    .locator('.official-warehouse-current-stock-bucket-effective')
    .evaluate((element) => getComputedStyle(element).color)
  assert(effectiveColor === 'rgb(100, 116, 139)', 'effective stock should be gray')
  assert(
    (await zeroBucketWarehouseLine.locator('.official-warehouse-current-stock-bucket-separator').count()) === 0,
    'separators should not be shown when only one non-zero bucket is visible'
  )
  assert(
    (await zeroBucketWarehouseLine.locator('.official-warehouse-current-stock-bucket-returned').count()) === 0,
    'zero returned stock bucket should be hidden'
  )
  assert(
    (await zeroBucketWarehouseLine.locator('.official-warehouse-current-stock-bucket-exception').count()) === 0,
    'zero exception stock bucket should be hidden'
  )
  assert(
    (await zeroBucketWarehouseLine.locator('.official-warehouse-current-stock-bucket-pending').count()) === 0,
    'zero pending stock bucket should be hidden'
  )
  const sourceStockResponse = await page.request.get(
    'http://127.0.0.1:18084/api/warehouse/official-warehouse/stock-statistics?storeCode=STR108065-NSA&siteCode=SA&keyword=PAPERSAYSB328',
    { headers: { 'X-Nuono-Dev-Session-User-Id': '307' } }
  )
  const sourceStockBody = await sourceStockResponse.json()
  const sourceStockRow = sourceStockBody.rows?.find((row) => row.partnerSku === 'PAPERSAYSB328')
  assert(sourceStockRow?.productSiteOfferId, 'stock API should provide PAPERSAYSB328 for source inference checks')
  const sourceHistoryResponse = await page.request.get(
    `http://127.0.0.1:18084/api/warehouse/official-warehouse/products/${encodeURIComponent(sourceStockRow.productSiteOfferId)}/inbound-history?storeCode=STR108065-NSA&siteCode=SA`,
    { headers: { 'X-Nuono-Dev-Session-User-Id': '307' } }
  )
  const sourceHistoryBody = await sourceHistoryResponse.json()
  const expectedSourceInference = inferSourceByTotalForSmoke(sourceStockRow.currentStock, sourceHistoryBody.rows)
  const sourceSearchResponse = page.waitForResponse((response) =>
    response.url().includes('/api/warehouse/official-warehouse/stock-statistics') &&
    response.url().includes('keyword=PAPERSAYSB328') &&
    response.ok()
  )
  await stockSearch.fill('PAPERSAYSB328')
  await stockSearch.press('Enter')
  await sourceSearchResponse
  const sourceSampleRow = page.locator('.official-warehouse-product-psku', { hasText: 'PAPERSAYSB328' })
    .locator('xpath=ancestor::tr[1]')
  await sourceSampleRow.waitFor({ state: 'visible', timeout: 5000 })
  const sourcePreview = sourceSampleRow.locator('.official-warehouse-source-preview')
  await sourcePreview.waitFor({ state: 'visible', timeout: 15000 })
  const sourcePreviewBox = await sourcePreview.boundingBox()
  assert(
    sourcePreviewBox && sourcePreviewBox.width >= 520 && sourcePreviewBox.width <= 680,
    'product list source preview should use available wide-screen space without becoming excessive'
  )
  const sourcePreviewText = await sourcePreview.innerText()
  assert(sourcePreviewText.includes('ASN'), 'product list should show ASN source progress preview')
  assert(sourcePreviewText.includes('物流'), 'product list should show logistics source progress preview')
  assert(sourcePreviewText.includes('采购单'), 'product list should show purchase order source progress preview')
  assert(
    (await sourceSampleRow.locator('.official-warehouse-source-preview-bar-segment').count()) > 0,
    'product list should render visible stock source progress bar segments'
  )
  const sourcePreviewStageBoxes = await sourceSampleRow
    .locator('.official-warehouse-source-preview-stage')
    .evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect()
        return { x: box.x, y: box.y, height: box.height }
      })
    )
  assert(sourcePreviewStageBoxes.length >= 3, 'product list should show ASN/logistics/purchase source stages')
  const sourcePreviewStageHeadHeights = await sourceSampleRow
    .locator('.official-warehouse-source-preview-stage-head')
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height))
  assert(
    sourcePreviewStageHeadHeights.every((height) => height <= 24),
    'product list source stage labels should stay on one line'
  )
  assert(
    Math.abs(sourcePreviewStageBoxes[0].x - sourcePreviewStageBoxes[1].x) <= 4 &&
      Math.abs(sourcePreviewStageBoxes[1].x - sourcePreviewStageBoxes[2].x) <= 4 &&
      sourcePreviewStageBoxes[1].y > sourcePreviewStageBoxes[0].y &&
      sourcePreviewStageBoxes[2].y > sourcePreviewStageBoxes[1].y,
    'product list source stages should be stacked in one column'
  )
  const sourcePreviewBarHeights = await sourceSampleRow
    .locator('.official-warehouse-source-preview-bar')
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height))
  assert(
    sourcePreviewBarHeights.every((height) => height <= 8),
    'product list source progress bars should stay visually thin'
  )
  await sourceSampleRow.getByRole('button', { name: '详情' }).click()
  const productDrawer = page.locator('.ant-drawer-content', { hasText: '库存来源推算' }).first()
  await productDrawer.waitFor({ state: 'visible', timeout: 5000 })
  await productDrawer.getByText('库存来源推算').waitFor({ state: 'visible', timeout: 15000 })
  const firstExpectedSource = expectedSourceInference.rows[0]
  if (firstExpectedSource) {
    await productDrawer
      .locator('.official-warehouse-source-chain-chip-label', { hasText: firstExpectedSource.noonAsnNr })
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
  }
  const sourceInferenceText = await productDrawer.innerText()
  assert(sourceInferenceText.includes('按当前库存总量'), 'product source inference should explain total-stock model')
  assert(sourceInferenceText.includes('FIFO'), 'product source inference should explain FIFO consumption model')
  assert(
    sourceInferenceText.includes(`剩余总库存：${Number(sourceStockRow.currentStock || 0).toLocaleString()} 件`),
    'product source inference should show remaining total stock'
  )
  assert(sourceInferenceText.includes('ASN'), 'product source inference should show ASN source column')
  assert(sourceInferenceText.includes('物流'), 'product source inference should show logistics source column')
  assert(sourceInferenceText.includes('采购单'), 'product source inference should show purchase order source column')
  assert(sourceInferenceText.includes('未建立关系'), 'logistics source column should show missing relation status')
  assert(sourceInferenceText.includes('待物流关系'), 'purchase order source column should wait for logistics relation')
  for (const row of expectedSourceInference.rows) {
    assert(
      sourceInferenceText.includes(row.noonAsnNr) && sourceInferenceText.includes(`${Number(row.estimated).toLocaleString()}件`),
      `source inference should show inferred ASN allocation for ${row.noonAsnNr}`
    )
  }
  if (expectedSourceInference.unmatched > 0) {
    assert(
      sourceInferenceText.includes('未匹配来源') && sourceInferenceText.includes(`${expectedSourceInference.unmatched.toLocaleString()}件`),
      'source inference should surface unmatched stock quantity'
    )
  }
  if (firstExpectedSource) {
    await productDrawer
      .locator(`.official-warehouse-source-chain-segment[aria-label*="${firstExpectedSource.noonAsnNr}"]`)
      .first()
      .click()
    const asnSourceDrawer = page.locator('.ant-drawer-content').last()
    await asnSourceDrawer.getByText('ASN详情').waitFor({ state: 'visible', timeout: 5000 })
    const asnSourceDetailText = await asnSourceDrawer.innerText()
    assert(asnSourceDetailText.includes('已分摊'), 'ASN source segment detail should show allocated status')
    assert(asnSourceDetailText.includes('推算剩余'), 'ASN source segment detail should show inferred remaining quantity')
    assert(asnSourceDetailText.includes(firstExpectedSource.noonAsnNr), 'ASN source segment detail should show ASN number')
    await page.keyboard.press('Escape')
    await page.getByText('ASN详情').waitFor({ state: 'hidden', timeout: 5000 })
  }
  await productDrawer
    .locator('.official-warehouse-source-chain-column', { hasText: '物流' })
    .locator('.official-warehouse-source-chain-segment')
    .first()
    .click()
  const logisticsSourceDrawer = page.locator('.ant-drawer-content').last()
  await logisticsSourceDrawer.getByText('物流详情').waitFor({ state: 'visible', timeout: 5000 })
  const logisticsSourceDetailText = await logisticsSourceDrawer.innerText()
  assert(
    logisticsSourceDetailText.includes('尚未建立 ASN 与物流批次的明确数量关系'),
    'logistics source segment detail should explain missing ASN-logistics relation'
  )
  await page.keyboard.press('Escape')
  await page.getByText('物流详情').waitFor({ state: 'hidden', timeout: 5000 })
  await productDrawer.locator('.ant-drawer-close').click()
  await productDrawer.waitFor({ state: 'hidden', timeout: 5000 })
  for (const copy of forbiddenMainCopy) {
    assert(!initialBody.includes(copy), `main page should not show data pipeline copy: ${copy}`)
  }

  await appointmentWorkbenchTab.click()
  await page.waitForSelector('text=创建 ASN', { timeout: 15000 })
  const embeddedAppointmentBody = await page.locator('body').innerText()
  assert(embeddedAppointmentBody.includes('约仓历史'), 'stock page Noon official warehouse tab should embed appointment history entry')
  assert(embeddedAppointmentBody.includes('同步 ASN 列表'), 'stock page Noon official warehouse tab should embed ASN sync entry')
  assert(embeddedAppointmentBody.includes('创建 ASN'), 'stock page Noon official warehouse tab should embed ASN creation entry')
  assert(!embeddedAppointmentBody.includes('失败信息'), 'appointment ASN table should not keep the old failure-only column title')
  const asnListResponse = await page.request.get(
    'http://127.0.0.1:18084/api/warehouse/official-warehouse/asns?storeCode=STR108065-NSA&siteCode=SA&page=1&perPage=3',
    { headers: { 'X-Nuono-Dev-Session-User-Id': '307' } }
  )
  const asnRows = await asnListResponse.json()
  const firstAsn = Array.isArray(asnRows) ? asnRows[0] : undefined
  assert(firstAsn?.noonAsnNr, 'ASN API should provide a first ASN for appointment table checks')
  const completedAsn = Array.isArray(asnRows)
    ? asnRows.find((row) => isInboundAsn(row))
    : undefined
  assert(completedAsn?.noonAsnNr, 'ASN API should provide an inbound ASN for inbound-only action checks')
  const scheduledPendingInboundAsn = Array.isArray(asnRows)
    ? asnRows.find((row) => row.appointment?.status === 'SCHEDULED' && !isInboundAsn(row))
    : undefined
  const expiredAsn = Array.isArray(asnRows)
    ? asnRows.find((row) => String(row.noonAsnStatus || '').toLowerCase() === 'expired')
    : undefined
  if (expiredAsn?.noonAsnNr) {
    assert(
      (await page.locator('.official-warehouse-page .ant-table-tbody .ant-table-row', { hasText: expiredAsn.noonAsnNr }).count()) === 0,
      'expired ASN should be hidden from the default appointment table'
    )
  }
  assert(
    (await page.getByRole('columnheader', { name: '状态' }).count()) > 0,
    'appointment ASN table should rename appointment column to status'
  )
  assert(
    (await page.getByRole('columnheader', { name: '约仓', exact: true }).count()) === 0,
    'appointment ASN table should not keep appointment wording as the status column title'
  )
  assert(
    (await page.getByRole('columnheader', { name: '货量 / 路由仓' }).count()) > 0,
    'appointment ASN table should merge quantity and routing warehouse into one column'
  )
  assert(
    (await page.getByRole('columnheader', { name: '货量', exact: true }).count()) === 0,
    'appointment ASN table should not keep standalone quantity column'
  )
  assert(
    (await page.getByRole('columnheader', { name: '路由仓', exact: true }).count()) === 0,
    'appointment ASN table should not keep standalone routing warehouse column'
  )
  assert(
    (await page.getByRole('columnheader', { name: '入仓详情', exact: true }).count()) === 0,
    'appointment ASN table should not show inbound detail overview column'
  )
  const embeddedAppointmentTableBox = await page.locator('.official-warehouse-asn-table .ant-table').first().boundingBox()
  const embeddedAppointmentLastHeaderBox = await page.getByRole('columnheader', { name: '操作' }).first().boundingBox()
  assert(
    embeddedAppointmentTableBox &&
      embeddedAppointmentLastHeaderBox &&
      embeddedAppointmentLastHeaderBox.x + embeddedAppointmentLastHeaderBox.width >=
        embeddedAppointmentTableBox.x + embeddedAppointmentTableBox.width - 30,
    'embedded appointment ASN table columns should fill the table panel width'
  )
  const appointmentTableLayout = await page.locator('.official-warehouse-page').last().evaluate((root, scheduledAsnNo) => {
    const visible = (element) => {
      const box = element.getBoundingClientRect()
      return box.width > 0 && box.height > 0
    }
    const headers = Array.from(root.querySelectorAll('.ant-table-thead th')).filter(visible)
    const headerWidths = Object.fromEntries(
      headers.map((header) => [header.textContent?.trim() || '', header.getBoundingClientRect().width])
    )
    const scheduledRow = Array.from(root.querySelectorAll('.ant-table-tbody .ant-table-row'))
      .filter(visible)
      .find((row) => row.textContent?.includes(scheduledAsnNo || ''))
    const statusCell = scheduledRow
      ? Array.from(scheduledRow.querySelectorAll('td')).filter(visible)[2]
      : undefined
    const statusTag = statusCell?.querySelector('.ant-tag')
    return {
      asnWidth: headerWidths['ASN / 状态'] || 0,
      quantityWidth: headerWidths['货量 / 路由仓'] || 0,
      statusWidth: headerWidths['状态'] || 0,
      statusCellWidth: statusCell?.getBoundingClientRect().width || 0,
      statusTagWidth: statusTag?.getBoundingClientRect().width || 0
    }
  }, scheduledPendingInboundAsn?.noonAsnNr || '')
  assert(appointmentTableLayout.asnWidth <= 180, 'ASN/status column should stay compact')
  assert(appointmentTableLayout.quantityWidth <= 150, 'quantity/routing column should stay compact')
  assert(appointmentTableLayout.statusWidth <= 210, 'appointment status column should stay compact')
  assert(
    appointmentTableLayout.statusTagWidth > 0 &&
      appointmentTableLayout.statusTagWidth < appointmentTableLayout.statusCellWidth * 0.6,
    'appointment status tag should size to its text instead of stretching to the whole cell'
  )
  if (scheduledPendingInboundAsn?.noonAsnNr) {
    const scheduledPendingInboundRow = page.locator('.official-warehouse-page .ant-table-tbody .ant-table-row', {
      hasText: scheduledPendingInboundAsn.noonAsnNr
    }).first()
    await scheduledPendingInboundRow.waitFor({ state: 'visible', timeout: 5000 })
    const scheduledPendingInboundText = await scheduledPendingInboundRow.innerText()
    assert(scheduledPendingInboundText.includes('约仓成功'), 'scheduled ASN without inbound result should show scheduled status')
    assert(!scheduledPendingInboundText.includes('待约仓'), 'scheduled ASN without inbound result should not fall back to Noon sealed status')
    assert(scheduledPendingInboundText.includes('送仓时间：'), 'scheduled ASN without inbound result should label delivery time')
    const deliveryTimeColor = await scheduledPendingInboundRow.locator('.official-warehouse-delivery-time').first().evaluate((element) =>
      getComputedStyle(element).color
    )
    assert(deliveryTimeColor === 'rgb(102, 102, 102)', 'delivery time label should use #666')
  }
  const completedAsnTableRow = page.locator('.official-warehouse-page .ant-table-tbody .ant-table-row', { hasText: completedAsn.noonAsnNr }).first()
  await completedAsnTableRow.waitFor({ state: 'visible', timeout: 5000 })
  const completedAsnRowText = await completedAsnTableRow.innerText()
  assert(!completedAsnRowText.includes('查看右侧入仓概况'), 'status column should not show helper copy for inbound rows')
  assert(!completedAsnRowText.includes('0 SKU'), 'quantity/routing column should not show misleading zero SKU count')
  assert(!completedAsnRowText.includes(completedAsn.selectedWarehouseCode), 'quantity/routing column should not show internal Noon warehouse code')
  assert(
    (await completedAsnTableRow.locator('.official-warehouse-inbound-overview').count()) === 0,
    'completed ASN row should not render inbound overview behind the detail button'
  )
  const firstAsnActions = await completedAsnTableRow.locator('.official-warehouse-actions').innerText()
  assert(firstAsnActions.includes('入仓详情'), 'completed ASN should expose inbound detail action')
  assert(!firstAsnActions.includes('下载 PDF'), 'completed ASN should not show appointment PDF action')
  assert(!firstAsnActions.includes('手动约仓'), 'completed ASN should not show manual appointment action')
  assert(!firstAsnActions.includes('自动约仓'), 'completed ASN should not show auto appointment action')
  assert(
    (await page.getByRole('tab', { name: '约仓操作' }).count()) === 0,
    'stock page Noon official warehouse tab should not add an appointment operation sub-tab'
  )
  assert(
    (await page.getByRole('tab', { name: '入仓单视角' }).count()) === 0,
    'stock page Noon official warehouse tab should not expose inbound-order perspective as a sub-tab'
  )
  await completedAsnTableRow.getByRole('button', { name: '入仓详情' }).click()
  const embeddedDrawer = page.locator('.ant-drawer-content').last()
  await embeddedDrawer.waitFor({ state: 'visible', timeout: 5000 })
  await embeddedDrawer.getByText('入仓详情', { exact: true }).waitFor({ state: 'visible', timeout: 15000 })
  const embeddedDetailText = await embeddedDrawer.innerText()
  assert(embeddedDetailText.includes('入仓状态'), 'embedded appointment ASN detail should show inbound stage')
  assert(embeddedDetailText.includes('件数'), 'embedded appointment ASN detail should show inbound quantity')
  assert(embeddedDetailText.includes('Noon仓'), 'embedded appointment ASN detail should show Noon warehouse')
  assert(embeddedDetailText.includes('Noon状态'), 'embedded appointment ASN detail should show Noon ASN status')
  assert(!embeddedDetailText.includes('可选到达仓库'), 'embedded appointment ASN detail should not show optional arrival warehouses')
  assert(!embeddedDetailText.includes('到达仓库'), 'embedded appointment ASN detail summary should not show arrival warehouse')
  assert(!embeddedDetailText.includes('0 SKU'), 'embedded appointment ASN detail should not show misleading zero SKU count')
  if (completedAsn.selectedWarehouseCode) {
    assert(!embeddedDetailText.includes(completedAsn.selectedWarehouseCode), 'embedded appointment ASN detail should not show internal Noon warehouse code')
  }
  await page.keyboard.press('Escape')

  await page.goto(appointmentPageUrl, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('text=创建 ASN', { timeout: 15000 })
  const standaloneAppointmentBody = await page.locator('body').innerText()
  assert(standaloneAppointmentBody.includes('约仓历史'), 'standalone Noon official warehouse page should keep appointment history entry')
  assert(standaloneAppointmentBody.includes('同步 ASN 列表'), 'standalone Noon official warehouse page should keep ASN sync entry')
  assert(
    (await page.getByRole('tab', { name: '库存核对' }).count()) === 0,
    'standalone Noon official warehouse page should not inherit stock page outer tabs'
  )
  assert(
    (await page.getByRole('tab', { name: '入仓单视角' }).count()) === 0,
    'standalone Noon official warehouse page should not inherit embedded inbound-order perspective tab'
  )
  await page.getByRole('button', { name: '入仓详情' }).first().click()
  const standaloneDrawer = page.locator('.ant-drawer-content').last()
  await standaloneDrawer.waitFor({ state: 'visible', timeout: 5000 })
  await standaloneDrawer.getByText('入仓详情', { exact: true }).waitFor({ state: 'visible', timeout: 15000 })
  const standaloneDetailText = await standaloneDrawer.innerText()
  assert(standaloneDetailText.includes('入仓状态'), 'standalone appointment ASN detail should show inbound stage')
  assert(standaloneDetailText.includes('件数'), 'standalone appointment ASN detail should show inbound quantity')
  assert(standaloneDetailText.includes('Noon仓'), 'standalone appointment ASN detail should show Noon warehouse')
  assert(!standaloneDetailText.includes('可选到达仓库'), 'standalone appointment ASN detail should not show optional arrival warehouses')
  assert(!standaloneDetailText.includes('到达仓库'), 'standalone appointment ASN detail summary should not show arrival warehouse')
  assert(!standaloneDetailText.includes('0 SKU'), 'standalone appointment ASN detail should not show misleading zero SKU count')

  console.log(
    JSON.stringify(
      {
        ok: true,
        url: pageUrl,
        checkedTabs: ['库存核对', 'Noon官方仓'],
        checkedDrawer: 'ASN入仓详情'
      },
      null,
      2
    )
  )
} finally {
  await browser.close()
}
