import { expect, test } from '@playwright/test'
import { buildListResponse, createMockDetails } from './competitor-analysis.fixtures'
import { transparentPixel } from './competitor-analysis.types'

test('report keyword count and change history use untruncated rank semantics', async ({ page }) => {
  const details = createMockDetails()
  const detail = details[180001]
  detail.candidates = Array.from({ length: 10 }, (_, index) => {
    const ordinal = String(index + 1).padStart(2, '0')
    return {
      id: 201000 + index,
      watchProductId: 180001,
      noonProductCode: `ZBASKET${ordinal}SA`,
      codeType: 'Z_CODE',
      canonicalUrl: `https://www.noon.com/saudi-en/p/ZBASKET${ordinal}SA/p/`,
      titleSnapshot: `Ranked Basket Competitor ${ordinal}`,
      brandSnapshot: 'RankBrand',
      imageUrlSnapshot: transparentPixel,
      sourceType: 'SEARCH_DISCOVERY',
      reviewStatus: 'CONFIRMED',
      lastSeenAt: '2026-06-05T08:04:00'
    }
  })
  detail.keywordRelations = detail.candidates.map((candidate, index) => ({
    id: 211000 + index,
    keywordId: 190001,
    competitorProductId: candidate.id,
    relationStatus: 'CONFIRMED',
    lastSeenRunId: 3000,
    lastSeenRankNo: index + 1,
    lastSeenSponsored: false,
    lastSeenAt: '2026-06-05T08:04:00'
  }))
  detail.latestRankPoints = [
    {
      keywordId: 190001,
      keyword: 'laundry basket',
      trackedProductType: 'SELF',
      noonProductCode: 'N51004211A',
      rankStatus: 'NOT_IN_SCAN_DEPTH',
      scanDepth: 20,
      sponsored: false,
      factTime: '2026-06-05T08:04:00'
    },
    ...detail.candidates.map((candidate, index) => ({
      keywordId: 190001,
      keyword: 'laundry basket',
      trackedProductType: 'COMPETITOR',
      noonProductCode: candidate.noonProductCode,
      rankStatus: 'RANKED',
      rankNo: index + 1,
      sponsored: false,
      priceAmount: 40 + index,
      currencyCode: 'SAR',
      factTime: '2026-06-05T08:04:00'
    }))
  ]

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

    const productChangesMatch = pathname.match(/^\/api\/competitor-analysis\/watch-products\/(\d+)\/product-changes$/)
    if (method === 'GET' && productChangesMatch) {
      await route.fulfill({
        json: {
          items: [
            {
              id: 'change-future-rank-guard',
              factDate: '2026-06-04',
              noonProductCode: 'ZNEWFUTURESA',
              productName: 'Future Ranked Competitor',
              subjectType: 'COMPETITOR',
              changes: [
                {
                  fieldKey: 'reviewCount',
                  fieldLabel: '评论数',
                  changeType: 'VALUE_CHANGED',
                  oldValue: 0,
                  newValue: 1,
                  severity: 'INFO'
                }
              ]
            }
          ],
          baselineSummary: {
            monitoredCompetitorCount: 10,
            snapshotCompetitorCount: 1,
            firstSnapshotDate: '2026-06-04',
            latestSnapshotDate: '2026-06-05'
          }
        }
      })
      return
    }

    await route.fulfill({ status: 404, json: { message: `unmocked ${method} ${pathname}` } })
  })

  await page.goto('/operations/competitor-analysis?devSession=1&devRole=boss&grantCompetitorAnalysis=1')
  await expect(page.getByTestId('competitor-analysis-workbench')).toBeVisible()
  await page.getByPlaceholder('搜索我方SKU、商品标题、Noon码').fill('API-BASKET-SA-001')
  await expect(page.getByText('API Foldable Laundry Basket')).toBeVisible()

  await page.getByLabel('报表').first().click()
  const reportDialog = page.getByRole('dialog').filter({ has: page.getByTestId('competitor-self-rank-report') })
  await expect(reportDialog).toBeVisible()
  await expect(reportDialog.getByRole('button', { name: /laundry basket 10 in 10/ })).toBeVisible()
  await expect(reportDialog.getByText('本品自然 未进前100')).toBeVisible()

  await reportDialog.getByRole('tab', { name: /变化历史/ }).click()
  const futureRankCard = reportDialog.locator('.competitor-analysis-product-change-competitor-card').filter({ hasText: 'ZNEWFUTURESA' })
  await expect(futureRankCard.locator('.competitor-analysis-product-change-rank-section')).toBeVisible()
  await expect(futureRankCard.locator('.competitor-analysis-product-change-section-label').filter({ hasText: '排名' })).toBeVisible()
  await expect(futureRankCard.getByText('暂无排名')).toBeVisible()
})

test('shows fetch results when keyword relations omit run ids', async ({ page }) => {
  const details = createMockDetails()
  details[180001].keywordRelations.forEach((relation) => {
    delete relation.lastSeenRunId
  })

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

    await route.fulfill({ status: 404, json: { message: `unmocked ${method} ${pathname}` } })
  })

  await page.goto('/operations/competitor-analysis?devSession=1&devRole=boss&grantCompetitorAnalysis=1')
  await page.getByRole('button', { name: '查看详情' }).first().click()

  await expect(page.getByText('待选池 (1)')).toBeVisible()
  await expect(page.getByText('已选竞品 (1)')).toBeVisible()
  await expect(page.locator('.competitor-analysis-candidate-card').filter({ hasText: 'N70011234A' })).toBeVisible()
  await expect(page.getByRole('link', { name: /打开 Noon 商品 Z6122BASKETSA/ })).toBeVisible()
})

test('removing a selected competitor hides it even when stale rank facts remain', async ({ page }) => {
  const details = createMockDetails()

  await page.route('**/api/competitor-analysis/**', async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()
    const pathname = url.pathname

    if (method === 'GET' && pathname === '/api/competitor-analysis/watch-products') {
      await route.fulfill({ json: buildListResponse(Object.values(details), url.searchParams) })
      return
    }

    if (method === 'GET' && pathname === '/api/competitor-analysis/product-baselines') {
      await route.fulfill({ json: buildListResponse(Object.values(details), url.searchParams) })
      return
    }

    const watchProductDetailMatch = pathname.match(/^\/api\/competitor-analysis\/watch-products\/(\d+)$/)
    if (method === 'GET' && watchProductDetailMatch) {
      await route.fulfill({ json: details[Number(watchProductDetailMatch[1])] })
      return
    }

    const removeMatch = pathname.match(/^\/api\/competitor-analysis\/keywords\/(\d+)\/candidates\/(\d+)\/remove$/)
    if (method === 'POST' && removeMatch) {
      const keywordId = Number(removeMatch[1])
      const competitorProductId = Number(removeMatch[2])
      const detail = Object.values(details).find((item) =>
        item.candidates.some((candidate) => candidate.id === competitorProductId)
      )
      if (detail) {
        detail.keywordRelations = detail.keywordRelations.filter(
          (relation) => !(relation.keywordId === keywordId && relation.competitorProductId === competitorProductId)
        )
      }
      await route.fulfill({ json: detail })
      return
    }

    await route.fulfill({ status: 404, json: { message: `unmocked ${method} ${pathname}` } })
  })

  await page.goto('/operations/competitor-analysis?devSession=1&devRole=boss&grantCompetitorAnalysis=1')
  await expect(page.getByTestId('competitor-analysis-workbench')).toBeVisible()

  await page.getByPlaceholder('搜索我方SKU、商品标题、Noon码').fill('API-ORG-AE-207')
  await expect(page.getByText('API Acrylic Cosmetic Organizer')).toBeVisible()
  await page.getByRole('button', { name: '查看详情' }).first().click()

  const selectedCard = page.locator('.competitor-analysis-candidate-card').filter({
    has: page.getByLabel('移除竞品'),
    hasText: 'N60004567A'
  })
  await expect(page.getByText('已选竞品 (1)')).toBeVisible()
  await expect(selectedCard).toBeVisible()

  await selectedCard.getByLabel('移除竞品').click()

  await expect(page.getByText('竞品已移除')).toBeVisible()
  await expect(page.getByText('已选竞品 (0)')).toBeVisible()
  await expect(selectedCard).toBeHidden()
})

