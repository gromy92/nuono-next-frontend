import { expect, test } from '@playwright/test'
import { buildListResponse, createMockDetails } from './competitor-analysis.fixtures'

test('manual competitor requires an active keyword', async ({ page }) => {
  const details = createMockDetails()

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
  await expect(page.getByTestId('competitor-analysis-workbench')).toBeVisible()
  await page.getByPlaceholder('搜索我方SKU、商品标题、Noon码').fill('API-NOKEY-SA-001')
  await expect(page.getByText('API Product Without Keywords')).toBeVisible()

  await page.getByRole('button', { name: '添加竞品' }).first().click()

  await expect(page.getByText('请先维护关键词')).toBeVisible()
  await expect(page.getByTestId('competitor-keyword-panel')).toBeVisible()
  await expect(page.getByTestId('competitor-manual-panel')).toBeHidden()
})

test('report uses empty states instead of synthesized ranking or change data', async ({ page }) => {
  const details = createMockDetails()
  details[180003].keywords = [
    {
      id: 190009,
      watchProductId: 180003,
      keyword: 'plain pencil case',
      keywordNorm: 'plain pencil case',
      locale: 'en-SA',
      status: 'ACTIVE',
      displayOrder: 1
    }
  ]
  details[180003].latestRankPoints = [
    {
      keywordId: 190009,
      keyword: 'plain pencil case',
      trackedProductType: 'SELF',
      noonProductCode: 'N51009999A',
      rankStatus: 'NOT_IN_SCAN_DEPTH',
      scanDepth: 20,
      sponsored: false,
      factTime: '2026-06-05T08:04:00'
    }
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
      await route.fulfill({ json: { items: [] } })
      return
    }

    await route.fulfill({ status: 404, json: { message: `unmocked ${method} ${pathname}` } })
  })

  await page.goto('/operations/competitor-analysis?devSession=1&devRole=boss&grantCompetitorAnalysis=1')
  await expect(page.getByTestId('competitor-analysis-workbench')).toBeVisible()
  await page.getByPlaceholder('搜索我方SKU、商品标题、Noon码').fill('API-NOKEY-SA-001')
  await expect(page.getByText('API Product Without Keywords')).toBeVisible()

  const reportButton = page.getByLabel('报表').first()
  await reportButton.hover()
  await expect(page.locator('.ant-tooltip').filter({ hasText: '报表' })).toBeVisible()
  await reportButton.click()
  const reportDialog = page.getByRole('dialog').filter({ has: page.getByTestId('competitor-self-rank-report') })
  await expect(reportDialog).toBeVisible()
  await expect(page.locator('.ant-tooltip').filter({ hasText: '报表' })).toBeHidden()
  await expect(reportDialog.locator('.competitor-analysis-report-keyword-chip-list')).toBeVisible()
  await expect(reportDialog.getByRole('button', { name: /plain pencil case 0 in 0/ })).toBeVisible()
  await expect(reportDialog.locator('.competitor-analysis-rank-insight-strip')).toBeVisible()
  await expect(reportDialog.getByText('本关键词暂无可绘制排名')).toBeVisible()
  await expect(reportDialog.getByText('本品未进前100，监控竞品 0 in 0')).toBeVisible()
  await expect(reportDialog.locator('.competitor-analysis-rank-race-card')).toHaveCount(0)
  await expect(reportDialog.getByTestId(/self-rank-chart-/)).toHaveCount(0)
  await reportDialog.getByRole('tab', { name: /变化历史/ }).click()
  await expect(reportDialog.getByText('暂无商品详情变化')).toBeVisible()
  await expect(reportDialog.getByText('模拟数据')).toBeHidden()
  await expect(reportDialog.getByText('mock-change')).toBeHidden()
  await expect(reportDialog.getByText('竞品 1')).toBeHidden()
  await expect(reportDialog.getByText('2026-06-07')).toBeHidden()
})
