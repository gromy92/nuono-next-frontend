import { expect, test } from '@playwright/test'
import { buildListResponse, createMockDetails } from './competitor-analysis.fixtures'

test('covers competitor analysis menu data surfaces', async ({ page }) => {
  const details = createMockDetails()
  details[180001].recent7dChangedCompetitorCount = 2
  details[180001].recent7dCompetitorChangeCount = 7
  details[180001].latestRankPoints.push({
    keywordId: 190001,
    keyword: 'laundry basket',
    trackedProductType: 'COMPETITOR',
    noonProductCode: 'N70011234A',
    rankStatus: 'RANKED',
    rankNo: 3,
    sponsored: true,
    priceAmount: 54.9,
    currencyCode: 'SAR',
    factTime: '2026-06-05T08:04:00'
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

    const historyMatch = pathname.match(/^\/api\/competitor-analysis\/watch-products\/(\d+)\/rank-history$/)
    if (method === 'GET' && historyMatch) {
      const detail = details[Number(historyMatch[1])]
      const keywordId = Number(url.searchParams.get('keywordId'))
      await route.fulfill({
        json: {
          items: detail.latestRankPoints.filter((point) => point.keywordId === keywordId)
        }
      })
      return
    }

    const productChangesMatch = pathname.match(/^\/api\/competitor-analysis\/watch-products\/(\d+)\/product-changes$/)
    if (method === 'GET' && productChangesMatch) {
      await route.fulfill({
        json: {
          items: [
            {
              id: 'coverage-change-z6122-20260615',
              factDate: '2026-06-15',
              noonProductCode: 'Z6122BASKETSA',
              productName: 'Large Fabric Laundry Basket Organizer',
              subjectType: 'COMPETITOR',
              changes: [
                {
                  fieldKey: 'mainImage',
                  fieldLabel: '主图资产',
                  changeType: 'VALUE_CHANGED',
                  oldValue: 'old-z6122-image.jpg',
                  newValue: 'pzsku/Z6122BASKETSA/45/_/1773626142/new-z6122-image',
                  severity: 'INFO'
                },
                {
                  fieldKey: 'price',
                  fieldLabel: '价格',
                  changeType: 'VALUE_CHANGED',
                  oldValue: 48,
                  newValue: 45.5,
                  severity: 'INFO'
                }
              ]
            },
            {
              id: 'coverage-change-z6122-20260614',
              factDate: '2026-06-14',
              noonProductCode: 'Z6122BASKETSA',
              productName: 'Large Fabric Laundry Basket Organizer',
              subjectType: 'COMPETITOR',
              changes: [
                {
                  fieldKey: 'rating',
                  fieldLabel: '评分',
                  changeType: 'VALUE_CHANGED',
                  oldValue: 4.1,
                  newValue: 4.2,
                  severity: 'INFO'
                }
              ]
            },
            {
              id: 'coverage-change-n700-20260615',
              factDate: '2026-06-15',
              noonProductCode: 'N70011234A',
              productName: 'Collapsible Laundry Hamper With Lid',
              subjectType: 'COMPETITOR',
              changes: [
                {
                  fieldKey: 'reviewCount',
                  fieldLabel: '评论数',
                  changeType: 'VALUE_CHANGED',
                  oldValue: 217,
                  newValue: 218,
                  severity: 'INFO'
                }
              ]
            }
          ],
          baselineSummary: {
            monitoredCompetitorCount: 1,
            snapshotCompetitorCount: 2,
            firstSnapshotDate: '2026-06-14',
            latestSnapshotDate: '2026-06-15'
          }
        }
      })
      return
    }

    await route.fulfill({ status: 404, json: { message: `unmocked ${method} ${pathname}` } })
  })

  await page.goto('/operations/competitor-analysis?devSession=1&devRole=boss&grantCompetitorAnalysis=1')
  await expect(page.getByTestId('competitor-analysis-workbench')).toBeVisible()

  for (const columnName of ['商品基线', '关键词', '候选/监控中', '近7日竞品变化', '排名摘要', '最近抓取', '操作']) {
    await expect(page.getByRole('columnheader', { name: columnName })).toBeVisible()
  }

  const basketRow = page.locator('.ant-table-row').filter({ hasText: 'API Foldable Laundry Basket' }).first()
  await expect(basketRow).toContainText('API-BASKET-SA-001')
  await expect(basketRow).toContainText('N51004211A')
  await expect(basketRow).toContainText('laundry basket')
  await expect(basketRow).toContainText('foldable hamper')
  await expect(basketRow).toContainText('候选')
  await expect(basketRow).toContainText('监控中')
  await expect(basketRow).toContainText('共 2 个商品')
  await expect(basketRow).toContainText('共 7 次')
  await expect(basketRow).toContainText('暂无排名')
  await expect(basketRow).toContainText('0 次未进前100')
  await expect(basketRow).toContainText('抓取成功')
  await expect(basketRow).toContainText('2026-06-05 08:04')
  await expect(basketRow.getByLabel('抓取')).toBeVisible()
  await expect(basketRow.getByLabel('添加竞品')).toBeVisible()
  await expect(basketRow.getByLabel('查看详情')).toBeVisible()
  await expect(basketRow.getByLabel('报表')).toBeVisible()

  await expect(page.getByPlaceholder('搜索我方SKU、商品标题、Noon码')).toBeVisible()
  await expect(page.getByPlaceholder('搜索关键词')).toBeVisible()
  await expect(page.getByPlaceholder('搜索竞品Z/N码、品牌、标题')).toBeVisible()
  const filterSelect = page.getByTestId('competitor-analysis-filter-select')
  await filterSelect.locator('.ant-select-selector').click()
  for (const optionName of ['监控为0', '候选为0', '候选数↓', '候选数↑', '监控数↓', '监控数↑', '7日变化次数↓', '7日变化次数↑']) {
    await expect(page.locator('.ant-select-item-option').filter({ hasText: optionName })).toBeVisible()
  }
  await page.keyboard.press('Escape')

  await basketRow.getByLabel('查看详情').click()
  const detailDrawer = page.locator('.ant-drawer').filter({ hasText: '我方商品竞品详情' })
  await expect(detailDrawer).toBeVisible()
  await expect(detailDrawer).toContainText('API Foldable Laundry Basket')
  await expect(detailDrawer).toContainText('API-BASKET-SA-001')
  await expect(detailDrawer).toContainText('SA')
  await expect(page.getByTestId('competitor-keyword-board')).toBeVisible()
  await expect(detailDrawer.getByRole('button', { name: /laundry basket/ })).toBeVisible()
  await expect(detailDrawer.getByRole('button', { name: /foldable hamper/ })).toBeVisible()
  await expect(detailDrawer.getByText('待选池 (1)')).toBeVisible()
  await expect(detailDrawer.getByText('已选竞品 (1)')).toBeVisible()

  const pendingCandidate = detailDrawer.locator('.competitor-analysis-candidate-card').filter({ hasText: 'N70011234A' })
  await expect(pendingCandidate).toContainText('Collapsible Laundry Hamper With Lid')
  await expect(pendingCandidate).toContainText('HomePlus')
  await expect(pendingCandidate).toContainText('搜索')
  await expect(pendingCandidate).toContainText('广告')
  await expect(pendingCandidate).toContainText('第 3 名')
  await expect(pendingCandidate).toContainText('54.9')
  await expect(pendingCandidate).toContainText('SAR')
  await expect(pendingCandidate).toContainText('4.4')
  await expect(pendingCandidate).toContainText('(218)')
  await expect(pendingCandidate.getByLabel('加入竞品')).toBeVisible()
  await expect(pendingCandidate.getByLabel('忽略竞品')).toBeVisible()

  const monitoredCandidate = detailDrawer.locator('.competitor-analysis-candidate-card').filter({ hasText: 'Z6122BASKETSA' })
  await expect(monitoredCandidate).toContainText('Large Fabric Laundry Basket Organizer')
  await expect(monitoredCandidate).toContainText('Casa Line')
  await expect(monitoredCandidate).toContainText('第 8 名')
  await expect(monitoredCandidate.getByLabel('移除竞品')).toBeVisible()

  await page.goto('/operations/competitor-analysis?devSession=1&devRole=boss&grantCompetitorAnalysis=1')
  await expect(page.getByTestId('competitor-analysis-workbench')).toBeVisible()
  await basketRow.getByLabel('报表').click()
  const reportDialog = page.getByRole('dialog').filter({ has: page.getByTestId('competitor-self-rank-report') })
  await expect(reportDialog).toBeVisible()
  await expect(reportDialog.locator('.competitor-analysis-report-product-psku')).toContainText('API-BASKET-SA-001')
  const summaryLine = reportDialog.locator(
    '.competitor-analysis-report-header-body > .competitor-analysis-product-change-summary-line'
  )
  await expect(summaryLine).toContainText('监控竞品')
  await expect(summaryLine).toContainText('1 个')
  await expect(summaryLine).toContainText('详情基线')
  await expect(summaryLine).toContainText('2 个')
  await expect(summaryLine).toContainText('变化日期')
  await expect(summaryLine).toContainText('2 天')
  await expect(summaryLine).toContainText('变化字段')
  await expect(summaryLine).toContainText('4 项')
  await expect(summaryLine).toContainText('价格变化')
  await expect(summaryLine).toContainText('1 次')
  await expect(summaryLine).toContainText('最新基线')
  await expect(summaryLine).toContainText('2026-06-15')
  await expect(reportDialog.getByRole('tab', { name: /排名分析/ })).toBeVisible()
  await expect(reportDialog.getByRole('tab', { name: /变化历史/ })).toBeVisible()
  await expect(reportDialog.locator('.competitor-analysis-report-keyword-chip-list')).toContainText('laundry basket')
  await expect(reportDialog.locator('.competitor-analysis-report-keyword-chip-list')).toContainText('foldable hamper')
  await expect(reportDialog.locator('.competitor-analysis-rank-insight-strip')).toBeVisible()
  await expect(reportDialog.locator('.competitor-analysis-rank-race-card')).toBeVisible()

  await reportDialog.getByRole('tab', { name: /变化历史/ }).click()
  const changeCards = reportDialog.locator('.competitor-analysis-product-change-competitor-card')
  await expect(changeCards).toHaveCount(2)
  const z6122Card = changeCards.filter({ hasText: 'Z6122BASKETSA' })
  await expect(z6122Card.getByRole('link', { name: '打开 Noon 商品 Z6122BASKETSA', exact: true })).toBeVisible()
  await expect(z6122Card).toContainText('Large Fabric Laundry Basket Organizer')
  await expect(z6122Card).toContainText('2026-06-15')
  await expect(z6122Card).toContainText('2026-06-14')
  await expect(z6122Card.locator('.competitor-analysis-product-change-section-label').filter({ hasText: '排名' })).toHaveCount(2)
  await expect(z6122Card.locator('.competitor-analysis-product-change-section-label').filter({ hasText: '变化' })).toHaveCount(2)
  await expect(
    z6122Card.locator('.competitor-analysis-product-change-rank-row').filter({ hasText: 'laundry basket' }).first()
  ).toContainText('第 8 名')
  await expect(
    z6122Card.locator('.competitor-analysis-product-change-rank-row').filter({ hasText: 'foldable hamper' }).first()
  ).toContainText('第 5 名')
  await expect(z6122Card.getByRole('link', { name: '主图A' })).toHaveAttribute(
    'href',
    'https://f.nooncdn.com/p/old-z6122-image.jpg'
  )
  await expect(z6122Card.getByRole('link', { name: '主图B' })).toHaveAttribute(
    'href',
    'https://f.nooncdn.com/p/pzsku/Z6122BASKETSA/45/_/1773626142/new-z6122-image.jpg'
  )
  await expect(z6122Card).toContainText('48 → 45.5')
  await expect(z6122Card).toContainText('4.1 → 4.2')

  const n700Card = changeCards.filter({ hasText: 'N70011234A' })
  await expect(n700Card).toContainText('Collapsible Laundry Hamper With Lid')
  await expect(n700Card).toContainText('2026-06-15')
  await expect(n700Card.locator('.competitor-analysis-product-change-rank-row').filter({ hasText: 'laundry basket' })).toContainText(
    '第 3 名'
  )
  await expect(n700Card).toContainText('217 → 218')
})
