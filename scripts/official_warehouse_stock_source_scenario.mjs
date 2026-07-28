import {
  assert,
  forbiddenMainCopy,
  inferSourceByTotalForSmoke
} from './official_warehouse_stock_smoke_support.mjs'

export async function verifyOfficialWarehouseStockSourceScenario(page, initialBody) {
  const stockSearch = page.getByPlaceholder('SKU / PSKU / 商品')
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
}
