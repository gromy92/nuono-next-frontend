import { expect, test } from '@playwright/test'
import { buildListResponse, createMockDetails } from './competitor-analysis.fixtures'
import { transparentPixel } from './competitor-analysis.types'
test('opens operations competitor analysis and reviews candidate workflow', async ({ page }) => {
  const details = createMockDetails()
  details[180001].recent7dChangedCompetitorCount = 2
  details[180001].recent7dCompetitorChangeCount = 7
  details[180002].recent7dChangedCompetitorCount = 3
  details[180002].recent7dCompetitorChangeCount = 12
  let nextKeywordId = 190100
  let nextCandidateId = 200100
  let refreshPollCount = 0
  await page.route('**/api/competitor-analysis/**', async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()
    const pathname = url.pathname
    if (
      method === 'GET' &&
      (pathname === '/api/competitor-analysis/watch-products' ||
        pathname === '/api/competitor-analysis/product-baselines')
    ) {
      await route.fulfill({ json: buildListResponse(Object.values(details), url.searchParams) })
      return
    }
    const watchProductDetailMatch = pathname.match(/^\/api\/competitor-analysis\/watch-products\/(\d+)$/)
    if (method === 'GET' && watchProductDetailMatch) {
      await route.fulfill({ json: details[Number(watchProductDetailMatch[1])] })
      return
    }
    const addKeywordMatch = pathname.match(/^\/api\/competitor-analysis\/watch-products\/(\d+)\/keywords$/)
    if (method === 'POST' && addKeywordMatch) {
      const detail = details[Number(addKeywordMatch[1])]
      const payload = route.request().postDataJSON() as { keyword: string; locale?: string }
      detail.keywords.push({
        id: nextKeywordId++,
        watchProductId: detail.watchProduct.id,
        keyword: payload.keyword,
        keywordNorm: payload.keyword.toLowerCase(),
        locale: payload.locale || `en-${detail.watchProduct.siteCode}`,
        status: 'ACTIVE',
        displayOrder: detail.keywords.length + 1,
        lastProviderStatus: 'SUCCEEDED',
        lastSucceededAt: '2026-06-05T08:04:00'
      })
      await route.fulfill({ json: detail })
      return
    }
    const manualMatch = pathname.match(/^\/api\/competitor-analysis\/watch-products\/(\d+)\/manual-competitors$/)
    if (method === 'POST' && manualMatch) {
      const detail = details[Number(manualMatch[1])]
      const payload = route.request().postDataJSON() as { input: string; keywordId?: number }
      if (!payload.keywordId) {
        await route.fulfill({ status: 400, json: { message: 'COMPETITOR_KEYWORD_REQUIRED' } })
        return
      }
      const noonProductCode = payload.input.match(/[ZN][A-Z0-9]{7,30}/i)?.[0].toUpperCase() || payload.input.toUpperCase()
      const candidateId = nextCandidateId++
      detail.candidates.push({
        id: candidateId,
        watchProductId: detail.watchProduct.id,
        noonProductCode,
        codeType: noonProductCode.startsWith('Z') ? 'Z_CODE' : 'N_CODE',
        canonicalUrl: `https://www.noon.com/saudi-en/p/${noonProductCode}/p/`,
        titleSnapshot: `手工添加竞品 ${noonProductCode}`,
        brandSnapshot: '待补充',
        imageUrlSnapshot: transparentPixel,
        sourceType: 'MANUAL_ADD',
        reviewStatus: 'CONFIRMED',
        lastSeenAt: '2026-06-05T08:20:00'
      })
      detail.keywordRelations.push({
        id: 210100,
        keywordId: payload.keywordId,
        competitorProductId: candidateId,
        relationStatus: 'CONFIRMED',
        lastSeenAt: '2026-06-05T08:20:00'
      })
      await route.fulfill({ json: detail })
      return
    }
    const confirmMatch = pathname.match(
      /^\/api\/competitor-analysis\/keywords\/(\d+)\/candidates\/(\d+)\/confirm$/
    )
    if (method === 'POST' && confirmMatch) {
      const competitorProductId = Number(confirmMatch[2])
      const detail = Object.values(details).find((item) =>
        item.candidates.some((candidate) => candidate.id === competitorProductId)
      )
      if (detail) {
        detail.candidates = detail.candidates.map((candidate) =>
          candidate.id === competitorProductId ? { ...candidate, reviewStatus: 'CONFIRMED' } : candidate
        )
        detail.keywords
          .filter((keyword) => keyword.status === 'ACTIVE')
          .forEach((keyword, index) => {
            const existing = detail.keywordRelations.find(
              (relation) => relation.keywordId === keyword.id && relation.competitorProductId === competitorProductId
            )
            if (existing) {
              existing.relationStatus = 'CONFIRMED'
            } else {
              detail.keywordRelations.push({
                id: 210200 + index,
                keywordId: keyword.id,
                competitorProductId,
                relationStatus: 'CONFIRMED',
                lastSeenAt: '2026-06-05T08:22:00'
              })
            }
          })
      }
      await route.fulfill({ json: detail })
      return
    }
    const ignoreMatch = pathname.match(/^\/api\/competitor-analysis\/keywords\/(\d+)\/candidates\/(\d+)\/ignore$/)
    if (method === 'POST' && ignoreMatch) {
      const keywordId = Number(ignoreMatch[1])
      const competitorProductId = Number(ignoreMatch[2])
      const detail = Object.values(details).find((item) =>
        item.candidates.some((candidate) => candidate.id === competitorProductId)
      )
      const relation = detail?.keywordRelations.find(
        (item) => item.keywordId === keywordId && item.competitorProductId === competitorProductId
      )
      if (relation) {
        relation.relationStatus = 'IGNORED'
      }
      await route.fulfill({ json: detail })
      return
    }
    const refreshMatch = pathname.match(/^\/api\/competitor-analysis\/watch-products\/(\d+)\/refresh$/)
    if (method === 'POST' && refreshMatch) {
      refreshPollCount = 0
      await route.fulfill({
        status: 202,
        json: {
          taskId: 9001,
          runId: 3001,
          watchProductId: Number(refreshMatch[1]),
          taskStatus: 'RUNNING',
          runStatus: 'RUNNING',
          progressPercent: 10,
          message: '竞品刷新已提交。',
          keywordTotal: 2,
          keywordSuccess: 0,
          keywordFailed: 0
        }
      })
      return
    }
    if (method === 'GET' && pathname === '/api/competitor-analysis/refresh-runs/3001') {
      refreshPollCount += 1
      await route.fulfill({
        json: {
          taskId: 9001,
          runId: 3001,
          watchProductId: 180001,
          taskStatus: refreshPollCount > 1 ? 'SUCCEEDED' : 'RUNNING',
          runStatus: refreshPollCount > 1 ? 'SUCCEEDED' : 'RUNNING',
          progressPercent: refreshPollCount > 1 ? 100 : 45,
          message: refreshPollCount > 1 ? '竞品刷新完成。' : '竞品刷新执行中。',
          keywordTotal: 2,
          keywordSuccess: refreshPollCount > 1 ? 2 : 1,
          keywordFailed: 0
        }
      })
      return
    }
    const historyMatch = pathname.match(/^\/api\/competitor-analysis\/watch-products\/(\d+)\/rank-history$/)
    if (method === 'GET' && historyMatch) {
      await route.fulfill({
        json: {
          items: [
            {
              id: 4001,
              keywordId: Number(url.searchParams.get('keywordId')),
              keyword: 'foldable hamper',
              trackedProductType: 'SELF',
              noonProductCode: 'N51004211A',
              rankStatus: 'RANKED',
              rankNo: 18,
              sponsored: true,
              priceAmount: 59.9,
              currencyCode: 'SAR',
              factTime: '2026-06-05T08:05:00'
            }
          ]
        }
      })
      return
    }
    await route.fulfill({ status: 404, json: { message: `unmocked ${method} ${pathname}` } })
  })
  await page.goto('/operations/competitor-analysis?devSession=1&devRole=boss&grantCompetitorAnalysis=1')
  await expect(page.getByTestId('competitor-analysis-workbench')).toBeVisible()
  await expect(page.getByText('API Foldable Laundry Basket')).toBeVisible()
  await expect(page.getByText(/已筛选 .* 个商品基线/)).toHaveCount(0)
  await expect(page.getByRole('columnheader', { name: '近7日竞品变化' })).toBeVisible()
  await expect(
    page.locator('.ant-table-row').filter({ hasText: 'API Foldable Laundry Basket' })
  ).toContainText('共 2 个商品')
  await expect(
    page.locator('.ant-table-row').filter({ hasText: 'API Foldable Laundry Basket' })
  ).toContainText('共 7 次')
  const filterSelect = page.getByTestId('competitor-analysis-filter-select')
  await expect(filterSelect).toBeVisible()
  await expect(page.locator('.competitor-analysis-search-card').filter({ has: filterSelect })).toBeVisible()
  await expect(page.getByTestId('competitor-analysis-sort-select')).toHaveCount(0)
  await filterSelect.locator('.ant-select-selector').click()
  await expect(page.locator('.ant-select-item-option').filter({ hasText: '候选数↓' })).toBeVisible()
  await expect(page.locator('.ant-select-item-option').filter({ hasText: '候选数↑' })).toBeVisible()
  await expect(page.locator('.ant-select-item-option').filter({ hasText: '监控数↓' })).toBeVisible()
  await expect(page.locator('.ant-select-item-option').filter({ hasText: '监控数↑' })).toBeVisible()
  await page.locator('.ant-select-item-option').filter({ hasText: '7日变化次数↓' }).click()
  await expect(page.locator('.ant-table-row').first()).toContainText('API Acrylic Cosmetic Organizer')
  await filterSelect.locator('.ant-select-selector').click()
  await page.locator('.ant-select-item-option').filter({ hasText: '7日变化次数↑' }).click()
  await expect(page.locator('.ant-table-row').first()).toContainText('API Product Without Keywords')
  await expect(page.getByPlaceholder('搜索我方SKU、商品标题、Noon码')).toBeVisible()
  await expect(page.getByPlaceholder('搜索关键词')).toBeVisible()
  await expect(page.getByPlaceholder('搜索竞品Z/N码、品牌、标题')).toBeVisible()
  await expect
    .poll(async () =>
      page
        .locator('.competitor-analysis-row-actions')
        .first()
        .evaluate((element) => getComputedStyle(element).flexDirection)
    )
    .toBe('row')
  await page.getByPlaceholder('搜索关键词').fill('makeup organizer')
  await expect(page.getByText('API-ORG-AE-207')).toBeVisible()
  await expect(page.getByText('API-BASKET-SA-001')).toBeHidden()
  await page.getByRole('button', { name: /重\s*置/ }).click()
  await expect(page.getByText('API-BASKET-SA-001')).toBeVisible()
  await page.getByRole('button', { name: '关键词' }).first().click()
  const keywordPanel = page.getByTestId('competitor-keyword-panel')
  await expect(keywordPanel).toBeVisible()
  await page.getByPlaceholder('输入关键词').fill('round storage basket')
  await page.getByRole('button', { name: '新增关键词' }).click()
  await expect(keywordPanel.getByText('round storage basket', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(keywordPanel).toBeHidden()
  await page.getByRole('button', { name: '添加竞品' }).first().click()
  await expect(page.getByTestId('competitor-manual-panel')).toBeVisible()
  await expect(page.getByText('添加到关键词')).toBeVisible()
  await expect(page.getByText('laundry basket').last()).toBeVisible()
  await page.getByPlaceholder('粘贴 Noon 链接、Z 码或 N 码').fill('https://www.noon.com/saudi-en/p/N70123456A/p/')
  await page.getByRole('button', { name: '手工添加' }).click()
  await expect(page.getByText('N70123456A', { exact: true }).first()).toBeVisible()
  await page.getByPlaceholder('粘贴 Noon 链接、Z 码或 N 码').fill('N70123456A')
  await page.getByRole('button', { name: '手工添加' }).click()
  await expect(page.getByText('竞品已存在')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '查看详情' }).first().click()
  const detailDrawer = page.locator('.ant-drawer').filter({ hasText: '我方商品竞品详情' })
  await expect(detailDrawer.getByRole('button', { name: '抓取' })).toBeVisible()
  await expect(page.getByTestId('competitor-keyword-board')).toBeVisible()
  await expect(page.getByRole('button', { name: /laundry basket/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /foldable hamper/ })).toBeVisible()
  await expect(page.getByText(/关键词看板：/)).toBeHidden()
  await expect(page.getByText('待选池 (1)')).toBeVisible()
  await expect(page.getByText('已选竞品 (2)')).toBeVisible()
  await expect(page.getByRole('link', { name: /打开 Noon 商品 Z6122BASKETSA/ })).toBeVisible()
  await expect(page.locator('.competitor-analysis-candidate-card').filter({ hasText: 'N70011234A' }).getByText('广告')).toBeVisible()
  await expect(page.locator('.competitor-analysis-candidate-card').first()).toBeVisible()
  await expect(page.getByText('Noon链接')).toBeHidden()
  await expect(page.getByRole('link', { name: /打开 Noon 商品 N70011234A/ })).toBeVisible()
  await expect(page.getByTestId('competitor-keyword-panel')).toBeHidden()
  await expect
    .poll(async () =>
      page.locator('.competitor-analysis-candidate-grid').first().evaluate((element) =>
        getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
      )
    )
    .toBe(7)
  await expect(page.getByText('Premium Woven Storage Basket')).toBeHidden()
  await page.getByRole('button', { name: /foldable hamper/ }).click()
  await expect(page.getByText('待选池 (2)')).toBeVisible()
  await expect(page.getByText('已选竞品 (1)')).toBeVisible()
  await expect(page.getByText('Premium Woven Storage Basket')).toBeVisible()
  await expect(page.getByText('排名历史：foldable hamper')).toBeHidden()
  await page.getByRole('button', { name: /排名历史/ }).click()
  const historyDialog = page.getByRole('dialog', { name: '排名历史：foldable hamper' })
  await expect(historyDialog).toBeVisible()
  await expect(historyDialog.getByText('2026-06-05')).toBeVisible()
  await historyDialog.getByLabel('Close', { exact: true }).click()
  await expect(historyDialog).toBeHidden()
  await page.locator('.competitor-analysis-candidate-card').filter({ hasText: 'N70011234A' }).getByLabel('加入竞品').click()
  await expect(page.getByText('已选竞品 (2)')).toBeVisible()
  await page.getByRole('button', { name: /laundry basket/ }).click()
  await expect(page.getByText('0 待选')).toBeVisible()
  await expect(page.getByText('已选竞品 (3)')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('competitor-keyword-board')).toBeHidden()
  await page.getByRole('button', { name: '抓取' }).first().click()
  await expect(page.getByText(/抓取任务已提交|抓取完成/)).toBeVisible()
})
