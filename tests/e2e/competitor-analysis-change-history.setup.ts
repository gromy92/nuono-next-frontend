import type { Page } from '@playwright/test'
import { buildListResponse, createMockDetails } from './competitor-analysis.fixtures'

export async function setupCompetitorChangeHistory(page: Page) {
  const details = createMockDetails()
  details[180001].watchProduct.title =
    'API Foldable Laundry Basket With Extra Long English Title For Wrapping Verification In Product Analysis Modal'
  details[180001].keywords.push(
    {
      id: 190006,
      watchProductId: 180001,
      keyword: 'storage basket',
      keywordNorm: 'storage basket',
      locale: 'en-SA',
      status: 'ACTIVE',
      displayOrder: 3,
      lastProviderStatus: 'SUCCEEDED',
      lastSucceededAt: '2026-06-05T08:06:00'
    },
    {
      id: 190007,
      watchProductId: 180001,
      keyword: 'cloth hamper',
      keywordNorm: 'cloth hamper',
      locale: 'en-SA',
      status: 'ACTIVE',
      displayOrder: 4,
      lastProviderStatus: 'SUCCEEDED',
      lastSucceededAt: '2026-06-05T08:07:00'
    }
  )
  const basketRelations = details[180001].keywordRelations
  basketRelations.find((relation) => relation.keywordId === 190001 && relation.competitorProductId === 200001)!.relationStatus =
    'CONFIRMED'
  basketRelations.find((relation) => relation.keywordId === 190002 && relation.competitorProductId === 200003)!.relationStatus =
    'CONFIRMED'
  details[180001].latestRankPoints.push(
    {
      keywordId: 190006,
      keyword: 'storage basket',
      trackedProductType: 'COMPETITOR',
      noonProductCode: 'Z6122BASKETSA',
      rankStatus: 'RANKED',
      rankNo: 12,
      sponsored: false,
      priceAmount: 48,
      currencyCode: 'SAR',
      factTime: '2026-06-05T08:06:00'
    },
    {
      keywordId: 190007,
      keyword: 'cloth hamper',
      trackedProductType: 'COMPETITOR',
      noonProductCode: 'Z6122BASKETSA',
      rankStatus: 'RANKED',
      rankNo: 21,
      sponsored: false,
      priceAmount: 48,
      currencyCode: 'SAR',
      factTime: '2026-06-05T08:07:00'
    },
    {
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
    },
    {
      keywordId: 190002,
      keyword: 'foldable hamper',
      trackedProductType: 'COMPETITOR',
      noonProductCode: 'N88990123A',
      rankStatus: 'RANKED',
      rankNo: 16,
      sponsored: false,
      priceAmount: 72.5,
      currencyCode: 'SAR',
      factTime: '2026-06-05T08:05:00'
    }
  )

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
              id: 'change-z6122-20260615',
              factDate: '2026-06-15',
              noonProductCode: 'Z6122BASKETSA',
              productName: 'Large Fabric Laundry Basket Organizer',
              subjectType: 'COMPETITOR',
              changes: [
                {
                  fieldKey: 'price',
                  fieldLabel: '价格',
                  changeType: 'VALUE_CHANGED',
                  oldValue: 48,
                  newValue: 45.5,
                  severity: 'INFO'
                },
                {
                  fieldKey: 'reviewCount',
                  fieldLabel: '评论数',
                  changeType: 'VALUE_CHANGED',
                  oldValue: 94,
                  newValue: 98,
                  severity: 'INFO'
                }
              ]
            },
            {
              id: 'change-z6122-20260614',
              factDate: '2026-06-14',
              noonProductCode: 'Z6122BASKETSA',
              productName: 'Large Fabric Laundry Basket Organizer',
              subjectType: 'COMPETITOR',
              changes: [
                {
                  fieldKey: 'rating',
                  fieldLabel: '评分',
                  changeType: 'VALUE_CHANGED',
                  oldValue: 4.3,
                  newValue: 4.4,
                  severity: 'INFO'
                }
              ]
            },
            {
              id: 'change-n700-20260615',
              factDate: '2026-06-15',
              noonProductCode: 'N70011234A',
              productName: 'Collapsible Laundry Hamper With Lid',
              subjectType: 'COMPETITOR',
              changes: [
                {
                  fieldKey: 'rating',
                  fieldLabel: '评分',
                  changeType: 'VALUE_CHANGED',
                  oldValue: 4.3,
                  newValue: 4.4,
                  severity: 'INFO'
                },
                {
                  fieldKey: 'mainImage',
                  fieldLabel: '主图资产',
                  changeType: 'VALUE_CHANGED',
                  oldValue: '72b0ab77-da33-4c99-b3c3-622428730e3c.jpg',
                  newValue: 'pzsku/ZD670640692D5F5E3A940Z/45/_/1773626142/72b0ab77-da33-4c99-b3c3-622428730e3c',
                  severity: 'INFO'
                }
              ]
            },
            {
              id: 'change-n889-20260614',
              factDate: '2026-06-14',
              noonProductCode: 'N88990123A',
              productName: 'Premium Woven Storage Basket',
              subjectType: 'COMPETITOR',
              changes: [
                {
                  fieldKey: 'mainImage',
                  fieldLabel: '主图资产',
                  changeType: 'VALUE_CHANGED',
                  oldValue: 'old-image.jpg',
                  newValue: 'pzsku/N88990123A/45/_/1773626142/new-image',
                  severity: 'INFO'
                }
              ]
            }
          ],
          baselineSummary: {
            monitoredCompetitorCount: 3,
            snapshotCompetitorCount: 3,
            firstSnapshotDate: '2026-06-12',
            latestSnapshotDate: '2026-06-15'
          }
        }
      })
      return
    }

    await route.fulfill({ status: 404, json: { message: `unmocked ${method} ${pathname}` } })
  })
}
