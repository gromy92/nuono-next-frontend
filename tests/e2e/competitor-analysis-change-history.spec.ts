import { expect, test } from '@playwright/test'
import { setupCompetitorChangeHistory } from './competitor-analysis-change-history.setup'

test('report change history uses competitor cards with rank and change details', async ({ page }) => {
  await setupCompetitorChangeHistory(page)

  await page.goto('/operations/competitor-analysis?devSession=1&devRole=boss&grantCompetitorAnalysis=1')
  await expect(page.getByTestId('competitor-analysis-workbench')).toBeVisible()
  await page.getByPlaceholder('搜索我方SKU、商品标题、Noon码').fill('API-BASKET-SA-001')
  await expect(page.getByText('API Foldable Laundry Basket')).toBeVisible()

  await page.getByLabel('报表').first().click()
  const reportDialog = page.getByRole('dialog').filter({ has: page.getByTestId('competitor-self-rank-report') })
  await expect(reportDialog).toBeVisible()
  await expect(reportDialog.locator('.competitor-analysis-report-product-psku')).toContainText('API-BASKET-SA-001')
  await expect(reportDialog.locator('.competitor-analysis-report-product-title-en-full')).toContainText(
    'Extra Long English Title For Wrapping Verification'
  )
  const headerSummaryLine = reportDialog.locator(
    '.competitor-analysis-report-header-body > .competitor-analysis-product-change-summary-line'
  )
  await expect(headerSummaryLine).toBeVisible()
  await expect(headerSummaryLine).toContainText('监控竞品')
  await expect(headerSummaryLine).toContainText('变化字段')
  await expect(reportDialog.locator('.competitor-analysis-report-keyword-chip-list')).toBeVisible()
  await expect(reportDialog.getByRole('button', { name: /laundry basket 2 in 2/ })).toBeVisible()
  await expect(reportDialog.getByRole('button', { name: /foldable hamper 2 in 2/ })).toBeVisible()
  await expect(reportDialog.locator('.competitor-analysis-rank-insight-strip')).toBeVisible()
  await expect(reportDialog.locator('.competitor-analysis-rank-summary-grid')).toHaveCount(0)
  await expect(reportDialog.locator('.competitor-analysis-rank-race-card')).toBeVisible()

  await reportDialog.getByRole('tab', { name: /变化历史/ }).click()
  const changeCardList = reportDialog.locator('.competitor-analysis-product-change-competitor-list')
  const changeCard = reportDialog.locator('.competitor-analysis-product-change-competitor-card')
  await expect(changeCard).toHaveCount(3)
  await expect
    .poll(() =>
      changeCardList.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length)
    )
    .toBe(3)
  const z6122Card = changeCard.filter({ hasText: 'Z6122BASKETSA' })
  await expect
    .poll(() =>
      z6122Card.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length)
    )
    .toBe(2)
  await expect(z6122Card.locator('.competitor-analysis-product-change-competitor-detail')).toBeVisible()
  await expect
    .poll(() =>
      z6122Card
        .locator('.competitor-analysis-product-change-competitor-media')
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).height))
    )
    .toBeGreaterThanOrEqual(128)
  await expect(z6122Card.locator('.competitor-analysis-product-change-competitor-media img')).toBeVisible()
  await expect(z6122Card.locator('.competitor-analysis-product-change-competitor-meta')).toBeVisible()
  await expect
    .poll(() =>
      z6122Card
        .locator('.competitor-analysis-product-change-competitor-media img')
        .evaluate((element) => getComputedStyle(element).objectFit)
    )
    .toBe('contain')
  const z6122Code = z6122Card.locator('.competitor-analysis-product-change-competitor-code')
  await expect
    .poll(() => z6122Code.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontWeight) < 600))
    .toBe(true)
  await expect
    .poll(() => z6122Code.evaluate((element) => getComputedStyle(element).whiteSpace))
    .toBe('normal')
  await expect
    .poll(() => z6122Code.evaluate((element) => getComputedStyle(element).overflowWrap))
    .toBe('anywhere')
  await expect
    .poll(() => z6122Code.evaluate((element) => getComputedStyle(element).textOverflow))
    .toBe('clip')
  await expect
    .poll(() =>
      z6122Card
        .locator('.competitor-analysis-product-change-competitor-name')
        .evaluate((element) => getComputedStyle(element).webkitLineClamp)
    )
    .toBe('3')
  await expect(z6122Card.locator('.competitor-analysis-product-change-date-list')).toBeVisible()
  await expect(z6122Card.locator('.competitor-analysis-product-change-rank-section')).toHaveCount(2)
  await expect(z6122Card.locator('.competitor-analysis-product-change-field-section')).toHaveCount(2)
  const z6122DateBlocks = z6122Card.locator('.competitor-analysis-product-change-date-block')
  await expect(z6122DateBlocks).toHaveCount(2)
  await expect
    .poll(() => z6122DateBlocks.first().evaluate((element) => getComputedStyle(element).alignContent))
    .toBe('start')
  await expect
    .poll(() => z6122DateBlocks.nth(1).evaluate((element) => getComputedStyle(element).borderTopStyle))
    .toBe('solid')
  const z6122LatestDateBlock = z6122DateBlocks.first()
  await expect(z6122Card.locator('.competitor-analysis-product-change-rank-row')).toHaveCount(8)
  await expect(z6122Card.locator('.competitor-analysis-product-change-rank-more')).toHaveCount(0)
  await expect(z6122Card.locator('.competitor-analysis-product-change-field-row')).toHaveCount(3)
  await expect(z6122Card.getByText('2026-06-15')).toBeVisible()
  await expect(z6122Card.getByText('2026-06-14')).toBeVisible()
  await expect(z6122Card.locator('.competitor-analysis-product-change-section-label').filter({ hasText: '排名' })).toHaveCount(2)
  await expect(z6122Card.locator('.competitor-analysis-product-change-section-label').filter({ hasText: '变化' })).toHaveCount(2)
  await expect(
    z6122LatestDateBlock.locator('.competitor-analysis-product-change-rank-row').filter({ hasText: 'laundry basket' })
  ).toContainText('第 8 名')
  await expect(
    z6122LatestDateBlock.locator('.competitor-analysis-product-change-rank-row').filter({ hasText: 'foldable hamper' })
  ).toContainText('第 5 名')
  await expect(z6122Card.getByText('48 → 45.5')).toBeVisible()
  await expect(z6122Card.getByText('94 → 98')).toBeVisible()
  await expect(z6122Card.getByText('4.3 → 4.4')).toBeVisible()

  const n700Card = changeCard.filter({ hasText: 'N70011234A' })
  await expect(n700Card.locator('.competitor-analysis-product-change-rank-row').filter({ hasText: 'laundry basket' })).toContainText(
    '第 3 名'
  )
  await expect(n700Card.getByRole('link', { name: '主图A' })).toHaveCount(0)
  await expect(n700Card.getByRole('link', { name: '主图B' })).toHaveCount(0)

  const n889Card = changeCard.filter({ hasText: 'N88990123A' })
  await expect(n889Card.locator('.competitor-analysis-product-change-rank-row').filter({ hasText: 'foldable hamper' })).toContainText(
    '第 16 名'
  )
  await expect(n889Card.getByRole('link', { name: '主图A' })).toHaveAttribute(
    'href',
    'https://f.nooncdn.com/p/old-image.jpg'
  )
  await expect(n889Card.getByRole('link', { name: '主图B' })).toHaveAttribute(
    'href',
    'https://f.nooncdn.com/p/pzsku/N88990123A/45/_/1773626142/new-image.jpg'
  )
})
