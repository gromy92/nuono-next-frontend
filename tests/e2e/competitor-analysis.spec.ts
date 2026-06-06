import { expect, test } from '@playwright/test'

const transparentPixel =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='

type MockKeyword = {
  id: number
  watchProductId: number
  keyword: string
  keywordNorm: string
  locale: string
  status: string
  displayOrder: number
  lastProviderStatus?: string
  lastSucceededAt?: string
}

type MockCandidate = {
  id: number
  watchProductId: number
  noonProductCode: string
  codeType: string
  canonicalUrl: string
  titleSnapshot: string
  brandSnapshot: string
  imageUrlSnapshot: string
  priceAmountSnapshot?: number
  currencyCodeSnapshot?: string
  ratingSnapshot?: number
  reviewCountSnapshot?: number
  sourceType: string
  reviewStatus: string
  lastSeenAt: string
}

type MockRelation = {
  id: number
  keywordId: number
  competitorProductId: number
  relationStatus: string
  lastSeenRankNo?: number
  lastSeenSponsored?: boolean
  lastSeenAt: string
}

type MockDetail = {
  watchProduct: {
    id: number
    ownerUserId: number
    storeCode: string
    siteCode: string
    productSiteOfferId: number
    skuParent: string
    partnerSku: string
    childSku: string
    selfNoonProductCode: string
    selfCodeType: string
    title: string
    brand: string
    imageUrl: string
    productFulltype: string
    status: string
    latestRunId?: number
    latestRunStatus?: string
    latestRunAt?: string
  }
  keywords: MockKeyword[]
  candidates: MockCandidate[]
  keywordRelations: MockRelation[]
  latestRankPoints: Array<{
    keywordId: number
    keyword: string
    trackedProductType: string
    noonProductCode: string
    rankStatus: string
    rankNo?: number
    sponsored: boolean
    priceAmount?: number
    currencyCode?: string
    factTime: string
  }>
}

test('opens operations competitor analysis and reviews candidate workflow', async ({ page }) => {
  const details = createMockDetails()
  let nextKeywordId = 190100
  let nextCandidateId = 200100
  let refreshPollCount = 0

  await page.route('**/api/competitor-analysis/**', async (route) => {
    const url = new URL(route.request().url())
    const method = route.request().method()
    const pathname = url.pathname

    if (method === 'GET' && pathname === '/api/competitor-analysis/watch-products') {
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
      const payload = route.request().postDataJSON() as { input: string }
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
      detail.keywords
        .filter((keyword) => keyword.status === 'ACTIVE')
        .forEach((keyword, index) => {
          detail.keywordRelations.push({
            id: 210100 + index,
            keywordId: keyword.id,
            competitorProductId: candidateId,
            relationStatus: 'CONFIRMED',
            lastSeenAt: '2026-06-05T08:20:00'
          })
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

  await page.goto('/operations/competitor-analysis?devSession=1&devRole=boss')

  await expect(page.getByTestId('competitor-analysis-workbench')).toBeVisible()
  await expect(page.getByText('API Foldable Laundry Basket')).toBeVisible()
  await expect(page.getByPlaceholder('搜索我方SKU、商品标题、Noon码')).toBeVisible()
  await expect(page.getByPlaceholder('搜索关键词')).toBeVisible()
  await expect(page.getByPlaceholder('搜索竞品Z/N码、品牌、标题')).toBeVisible()
  await expect(page.getByText('每日 08:00')).toBeVisible()

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
  await page.getByPlaceholder('粘贴 Noon 链接、Z 码或 N 码').fill('https://www.noon.com/saudi-en/p/N70123456A/p/')
  await page.getByRole('button', { name: '手工添加' }).click()
  await expect(page.getByText('N70123456A', { exact: true }).first()).toBeVisible()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '查看详情' }).first().click()
  await expect(page.getByTestId('competitor-keyword-board')).toBeVisible()
  await expect(page.getByRole('button', { name: /laundry basket/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /foldable hamper/ })).toBeVisible()
  await expect(page.getByText(/关键词看板：/)).toBeHidden()
  await expect(page.getByText('待选池 (1)')).toBeVisible()
  await expect(page.getByText('已选竞品 (2)')).toBeVisible()
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
  await expect(page.getByText('已选竞品 (2)')).toBeVisible()
  await expect(page.getByText('Premium Woven Storage Basket')).toBeVisible()
  await expect(page.getByText('排名历史：foldable hamper')).toBeHidden()
  await page.getByRole('button', { name: /排名历史/ }).click()
  const historyDialog = page.getByRole('dialog', { name: '排名历史：foldable hamper' })
  await expect(historyDialog).toBeVisible()
  await expect(historyDialog.getByText('2026-06-05')).toBeVisible()
  await historyDialog.getByLabel('Close', { exact: true }).click()
  await expect(historyDialog).toBeHidden()

  await page.getByRole('button', { name: '确认竞品' }).first().click()
  await expect(
    page.locator('.competitor-analysis-candidate-card').filter({ hasText: 'N70011234A' }).getByText('已确认')
  ).toBeVisible()
  await page.getByRole('button', { name: /laundry basket/ }).click()
  await expect(page.getByText('0 待选')).toBeVisible()
  await expect(page.getByText('待选池 (0)')).toBeHidden()
  await expect(page.getByText('已选竞品 (3)')).toBeVisible()

  await page.getByRole('dialog').getByRole('button', { name: '手动刷新' }).click()
  await expect(page.getByText(/手动刷新已提交|竞品刷新完成/)).toBeVisible()
})

function createMockDetails(): Record<number, MockDetail> {
  return {
    180001: {
      watchProduct: {
        id: 180001,
        ownerUserId: 501,
        storeCode: 'STR108065-NSA',
        siteCode: 'SA',
        productSiteOfferId: 170001,
        skuParent: 'API-BASKET-SA',
        partnerSku: 'API-BASKET-SA-001',
        childSku: 'Z8C2BASKET001-1',
        selfNoonProductCode: 'N51004211A',
        selfCodeType: 'N_CODE',
        title: 'API Foldable Laundry Basket',
        brand: 'Nuono Home',
        imageUrl: transparentPixel,
        productFulltype: 'home_storage-laundry_baskets',
        status: 'ACTIVE',
        latestRunId: 3000,
        latestRunStatus: 'SUCCEEDED',
        latestRunAt: '2026-06-05T08:04:00'
      },
      keywords: [
        {
          id: 190001,
          watchProductId: 180001,
          keyword: 'laundry basket',
          keywordNorm: 'laundry basket',
          locale: 'en-SA',
          status: 'ACTIVE',
          displayOrder: 1,
          lastProviderStatus: 'SUCCEEDED',
          lastSucceededAt: '2026-06-05T08:04:00'
        },
        {
          id: 190002,
          watchProductId: 180001,
          keyword: 'foldable hamper',
          keywordNorm: 'foldable hamper',
          locale: 'en-SA',
          status: 'ACTIVE',
          displayOrder: 2,
          lastProviderStatus: 'SUCCEEDED',
          lastSucceededAt: '2026-06-05T08:05:00'
        }
      ],
      candidates: [
        {
          id: 200001,
          watchProductId: 180001,
          noonProductCode: 'N70011234A',
          codeType: 'N_CODE',
          canonicalUrl: 'https://www.noon.com/saudi-en/p/N70011234A/p/',
          titleSnapshot: 'Collapsible Laundry Hamper With Lid',
          brandSnapshot: 'HomePlus',
          imageUrlSnapshot: transparentPixel,
          priceAmountSnapshot: 54.9,
          currencyCodeSnapshot: 'SAR',
          ratingSnapshot: 4.4,
          reviewCountSnapshot: 218,
          sourceType: 'SEARCH_DISCOVERY',
          reviewStatus: 'PENDING',
          lastSeenAt: '2026-06-05T08:05:00'
        },
        {
          id: 200002,
          watchProductId: 180001,
          noonProductCode: 'Z6122BASKETSA',
          codeType: 'Z_CODE',
          canonicalUrl: 'https://www.noon.com/saudi-en/p/Z6122BASKETSA/p/',
          titleSnapshot: 'Large Fabric Laundry Basket Organizer',
          brandSnapshot: 'Casa Line',
          imageUrlSnapshot: transparentPixel,
          priceAmountSnapshot: 48,
          currencyCodeSnapshot: 'SAR',
          ratingSnapshot: 4.1,
          reviewCountSnapshot: 94,
          sourceType: 'SEARCH_DISCOVERY',
          reviewStatus: 'CONFIRMED',
          lastSeenAt: '2026-06-05T08:04:00'
        },
        {
          id: 200003,
          watchProductId: 180001,
          noonProductCode: 'N88990123A',
          codeType: 'N_CODE',
          canonicalUrl: 'https://www.noon.com/saudi-en/p/N88990123A/p/',
          titleSnapshot: 'Premium Woven Storage Basket',
          brandSnapshot: 'OrganizeIt',
          imageUrlSnapshot: transparentPixel,
          priceAmountSnapshot: 72.5,
          currencyCodeSnapshot: 'SAR',
          ratingSnapshot: 4.7,
          reviewCountSnapshot: 311,
          sourceType: 'SEARCH_DISCOVERY',
          reviewStatus: 'PENDING',
          lastSeenAt: '2026-06-05T08:05:00'
        }
      ],
      keywordRelations: [
        {
          id: 210001,
          keywordId: 190001,
          competitorProductId: 200001,
          relationStatus: 'DISCOVERED',
          lastSeenRankNo: 3,
          lastSeenSponsored: true,
          lastSeenAt: '2026-06-05T08:04:00'
        },
        {
          id: 210002,
          keywordId: 190001,
          competitorProductId: 200002,
          relationStatus: 'CONFIRMED',
          lastSeenRankNo: 8,
          lastSeenSponsored: false,
          lastSeenAt: '2026-06-05T08:04:00'
        },
        {
          id: 210003,
          keywordId: 190002,
          competitorProductId: 200001,
          relationStatus: 'DISCOVERED',
          lastSeenRankNo: 3,
          lastSeenSponsored: true,
          lastSeenAt: '2026-06-05T08:05:00'
        },
        {
          id: 210004,
          keywordId: 190002,
          competitorProductId: 200002,
          relationStatus: 'CONFIRMED',
          lastSeenRankNo: 5,
          lastSeenSponsored: false,
          lastSeenAt: '2026-06-05T08:05:00'
        },
        {
          id: 210005,
          keywordId: 190002,
          competitorProductId: 200003,
          relationStatus: 'DISCOVERED',
          lastSeenRankNo: 16,
          lastSeenSponsored: false,
          lastSeenAt: '2026-06-05T08:05:00'
        }
      ],
      latestRankPoints: [
        {
          keywordId: 190001,
          keyword: 'laundry basket',
          trackedProductType: 'SELF',
          noonProductCode: 'N51004211A',
          rankStatus: 'RANKED',
          rankNo: 9,
          sponsored: false,
          priceAmount: 59.9,
          currencyCode: 'SAR',
          factTime: '2026-06-05T08:04:00'
        },
        {
          keywordId: 190001,
          keyword: 'laundry basket',
          trackedProductType: 'COMPETITOR',
          noonProductCode: 'Z6122BASKETSA',
          rankStatus: 'RANKED',
          rankNo: 8,
          sponsored: false,
          priceAmount: 48,
          currencyCode: 'SAR',
          factTime: '2026-06-05T08:04:00'
        },
        {
          keywordId: 190002,
          keyword: 'foldable hamper',
          trackedProductType: 'SELF',
          noonProductCode: 'N51004211A',
          rankStatus: 'RANKED',
          rankNo: 18,
          sponsored: true,
          priceAmount: 59.9,
          currencyCode: 'SAR',
          factTime: '2026-06-05T08:05:00'
        },
        {
          keywordId: 190002,
          keyword: 'foldable hamper',
          trackedProductType: 'COMPETITOR',
          noonProductCode: 'Z6122BASKETSA',
          rankStatus: 'RANKED',
          rankNo: 5,
          sponsored: false,
          priceAmount: 48,
          currencyCode: 'SAR',
          factTime: '2026-06-05T08:05:00'
        }
      ]
    },
    180002: {
      watchProduct: {
        id: 180002,
        ownerUserId: 501,
        storeCode: 'STR245027-NAE',
        siteCode: 'AE',
        productSiteOfferId: 170002,
        skuParent: 'API-ORG-AE',
        partnerSku: 'API-ORG-AE-207',
        childSku: 'Z8C2ORG207-1',
        selfNoonProductCode: 'N43008765A',
        selfCodeType: 'N_CODE',
        title: 'API Acrylic Cosmetic Organizer',
        brand: 'Nuono Beauty',
        imageUrl: transparentPixel,
        productFulltype: 'beauty_accessories-cosmetic_organizers',
        status: 'ACTIVE',
        latestRunId: 3002,
        latestRunStatus: 'SUCCEEDED',
        latestRunAt: '2026-06-05T08:11:00'
      },
      keywords: [
        {
          id: 190003,
          watchProductId: 180002,
          keyword: 'makeup organizer',
          keywordNorm: 'makeup organizer',
          locale: 'en-AE',
          status: 'ACTIVE',
          displayOrder: 1,
          lastProviderStatus: 'SUCCEEDED',
          lastSucceededAt: '2026-06-05T08:11:00'
        }
      ],
      candidates: [
        {
          id: 200004,
          watchProductId: 180002,
          noonProductCode: 'N60004567A',
          codeType: 'N_CODE',
          canonicalUrl: 'https://www.noon.com/uae-en/p/N60004567A/p/',
          titleSnapshot: 'Clear Makeup Storage Box',
          brandSnapshot: 'BeautyBox',
          imageUrlSnapshot: transparentPixel,
          priceAmountSnapshot: 39,
          currencyCodeSnapshot: 'AED',
          ratingSnapshot: 4.2,
          reviewCountSnapshot: 73,
          sourceType: 'SEARCH_DISCOVERY',
          reviewStatus: 'CONFIRMED',
          lastSeenAt: '2026-06-05T08:11:00'
        }
      ],
      keywordRelations: [
        {
          id: 210006,
          keywordId: 190003,
          competitorProductId: 200004,
          relationStatus: 'CONFIRMED',
          lastSeenRankNo: 7,
          lastSeenSponsored: true,
          lastSeenAt: '2026-06-05T08:11:00'
        }
      ],
      latestRankPoints: [
        {
          keywordId: 190003,
          keyword: 'makeup organizer',
          trackedProductType: 'SELF',
          noonProductCode: 'N43008765A',
          rankStatus: 'RANKED',
          rankNo: 11,
          sponsored: false,
          priceAmount: 44,
          currencyCode: 'AED',
          factTime: '2026-06-05T08:11:00'
        },
        {
          keywordId: 190003,
          keyword: 'makeup organizer',
          trackedProductType: 'COMPETITOR',
          noonProductCode: 'N60004567A',
          rankStatus: 'RANKED',
          rankNo: 7,
          sponsored: true,
          priceAmount: 39,
          currencyCode: 'AED',
          factTime: '2026-06-05T08:11:00'
        }
      ]
    }
  }
}

function buildListResponse(details: MockDetail[], searchParams: URLSearchParams) {
  const productSearch = normalize(searchParams.get('productSearch') || '')
  const keywordSearch = normalize(searchParams.get('keywordSearch') || '')
  const competitorSearch = normalize(searchParams.get('competitorSearch') || '')
  const filtered = details.filter((detail) => {
    const productFields = [
      detail.watchProduct.title,
      detail.watchProduct.brand,
      detail.watchProduct.storeCode,
      detail.watchProduct.siteCode,
      detail.watchProduct.partnerSku,
      detail.watchProduct.childSku,
      detail.watchProduct.selfNoonProductCode
    ]
    const keywordFields = detail.keywords.map((keyword) => keyword.keyword)
    const competitorFields = detail.candidates.flatMap((candidate) => [
      candidate.noonProductCode,
      candidate.titleSnapshot,
      candidate.brandSnapshot,
      candidate.canonicalUrl
    ])
    return (
      matches(productFields, productSearch) &&
      matches(keywordFields, keywordSearch) &&
      matches(competitorFields, competitorSearch)
    )
  })
  return {
    items: filtered.map((detail) => ({
      ...detail.watchProduct,
      activeKeywordCount: detail.keywords.filter((keyword) => keyword.status === 'ACTIVE').length,
      pendingCandidateCount: detail.candidates.filter((candidate) => candidate.reviewStatus === 'PENDING').length,
      confirmedCompetitorCount: detail.candidates.filter((candidate) => candidate.reviewStatus === 'CONFIRMED').length
    })),
    pagination: {
      page: 1,
      pageSize: 50,
      total: filtered.length,
      totalPages: 1
    }
  }
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function matches(fields: Array<string | undefined>, query: string) {
  if (!query) {
    return true
  }
  return fields.some((field) => normalize(field || '').includes(query))
}
