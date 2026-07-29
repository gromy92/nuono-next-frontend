import {
  assert,
  assertProductTableDoesNotScrollHorizontally
} from './official_warehouse_stock_smoke_support.mjs'

export async function verifyOfficialWarehouseStockProductScenario(page) {
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
  return initialBody
}
