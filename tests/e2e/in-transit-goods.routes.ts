import type { Page, Route } from '@playwright/test'
import {
  batchFreightCostResponse,
  contractResponse,
  lineResponse,
  listResponse,
  nodeResponse
} from './in-transit-goods.fixtures'
import {
  forwarderFreightComparisonResponse,
  skuFreightHistoryResponse,
  storeOverview
} from './in-transit-goods.freight-fixtures'
import {
  importPreviewReady,
  importPreviewWithErrors
} from './in-transit-goods.import-fixtures'

export type InTransitRouteState = {
  savedBody: Record<string, unknown> | null
  savedLineBody: Record<string, unknown> | null
  savedAliasBody: Record<string, unknown> | null
  deletedLineUrl: string | null
  batchFreightCostUrl: string | null
  skuHistoryUrl: string | null
  forwarderComparisonUrl: string | null
  importPreviewCallCount: number
  confirmImportUrl: string | null
  lastBatchListUrl: string
}

export async function setupEmptyInTransitRoutes(page: Page) {
  const state = { batchListRequestedUrl: '' }
  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: storeOverview })
  })
  await page.route('**/api/in-transit-goods/contracts', async (route) => {
    await route.fulfill({ json: contractResponse })
  })
  await page.route('**/api/in-transit-goods/forwarders', async (route) => {
    await route.fulfill({ json: [] })
  })
  await page.route('**/api/in-transit-goods/batches**', async (route) => {
    state.batchListRequestedUrl = route.request().url()
    await route.fulfill({ json: { mode: 'local-db', ready: true, totalCount: 0, page: 1, pageSize: 20, items: [] } })
  })
  return state
}

export async function setupMaintainsInTransitRoutes(page: Page): Promise<InTransitRouteState> {
  const state: InTransitRouteState = {
    savedBody: null,
    savedLineBody: null,
    savedAliasBody: null,
    deletedLineUrl: null,
    batchFreightCostUrl: null,
    skuHistoryUrl: null,
    forwarderComparisonUrl: null,
    importPreviewCallCount: 0,
    confirmImportUrl: null,
    lastBatchListUrl: ''
  }

  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: storeOverview })
  })
  await page.route('**/api/in-transit-goods/contracts', async (route) => {
    await route.fulfill({ json: contractResponse })
  })
  await page.route('**/api/in-transit-goods/forwarders', async (route) => {
    await route.fulfill({
      json: [
        { id: 51002, forwarderCode: 'QIKE', forwarderName: '启客', status: 'ACTIVE' },
        { id: 51003, forwarderCode: 'YITONG', forwarderName: '易通', status: 'ACTIVE' },
        { id: 51001, forwarderCode: 'YITE', forwarderName: '义特', status: 'ACTIVE' }
      ]
    })
  })
  await page.route('**/api/in-transit-goods/forwarder-aliases', async (route) => {
    state.savedAliasBody = JSON.parse(route.request().postData() || '{}')
    await route.fulfill({
      json: {
        id: 61001,
        standardForwarderId: state.savedAliasBody?.standardForwarderId,
        rawForwarderName: state.savedAliasBody?.rawForwarderName,
        normalizedRawForwarderName: '历史货代a',
        standardForwarderName: '启客',
        status: 'ACTIVE'
      }
    })
  })
  await setupLineRoutes(page, state)
  await setupNodeRoutes(page)
  await setupImportRoutes(page, state)
  await setupFreightRoutes(page, state)
  await setupBatchRoutes(page, state)
  return state
}

async function setupLineRoutes(page: Page, state: InTransitRouteState) {
  await page.route('**/api/in-transit-goods/batches/*/lines', async (route) => {
    const handled = await fulfillLineRoute(route, state)
    if (!handled) {
      await route.fulfill({ json: lineResponse })
    }
  })
  await page.route('**/api/in-transit-goods/batches/*/lines/*', async (route) => {
    state.deletedLineUrl = route.request().url()
    await route.fulfill({ json: { ...lineResponse, items: [] } })
  })
}

async function setupNodeRoutes(page: Page) {
  await page.route('**/api/in-transit-goods/batches/*/nodes/*', async (route) => {
    await route.fulfill({ json: { ...nodeResponse, items: [nodeResponse.items[1]] } })
  })
  await page.route('**/api/in-transit-goods/batches/*/nodes', async (route) => {
    if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({ json: { nodeId: body.nodeId ?? 55002, batchId: 53002, ...body } })
      return
    }
    await route.fulfill({ json: nodeResponse })
  })
}

async function setupImportRoutes(page: Page, state: InTransitRouteState) {
  await page.route('**/api/in-transit-goods/import-preview', async (route) => {
    state.importPreviewCallCount += 1
    await route.fulfill({ json: state.importPreviewCallCount === 1 ? importPreviewWithErrors : importPreviewReady })
  })
  await page.route('**/api/in-transit-goods/import-template', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      headers: { 'content-disposition': 'attachment; filename="in-transit-goods-import-template.xlsx"' },
      body: Buffer.from('xlsx-template')
    })
  })
  await page.route('**/api/in-transit-goods/imports/*/confirm', async (route) => {
    state.confirmImportUrl = route.request().url()
    await route.fulfill({
      json: { importBatchId: 56011, status: 'imported', importedBatchCount: 1, importedLineCount: 2 }
    })
  })
}

async function setupFreightRoutes(page: Page, state: InTransitRouteState) {
  await page.route('**/api/in-transit-goods/batches/*/freight-costs', async (route) => {
    state.batchFreightCostUrl = route.request().url()
    await route.fulfill({ json: batchFreightCostResponse })
  })
  await page.route('**/api/in-transit-goods/freight-costs/statistics**', async (route) => {
    await route.fulfill({ json: { items: [] } })
  })
  await page.route('**/api/in-transit-goods/freight-costs/sku-history**', async (route) => {
    state.skuHistoryUrl = route.request().url()
    await route.fulfill({ json: skuFreightHistoryResponse })
  })
  await page.route('**/api/in-transit-goods/freight-costs/forwarder-comparison**', async (route) => {
    state.forwarderComparisonUrl = route.request().url()
    await route.fulfill({ json: forwarderFreightComparisonResponse })
  })
}

async function setupBatchRoutes(page: Page, state: InTransitRouteState) {
  await page.route('**/api/in-transit-goods/batches**', async (route) => {
    const url = route.request().url()
    if (url.includes('/lines')) {
      const handled = await fulfillLineRoute(route, state)
      if (!handled) {
        await route.fulfill({ json: lineResponse })
      }
      return
    }
    if (route.request().method() === 'POST') {
      state.savedBody = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        json: {
          batchId: 53003,
          ...state.savedBody,
          batchStatus: state.savedBody.batchStatus || 'draft',
          forwarderQualityStatus: 'forwarder_unmatched',
          missingFields: []
        }
      })
      return
    }
    state.lastBatchListUrl = url
    await route.fulfill({ json: listResponse })
  })
}

async function fulfillLineRoute(route: Route, state: InTransitRouteState) {
  const url = route.request().url()
  if (route.request().method() === 'POST') {
    state.savedLineBody = JSON.parse(route.request().postData() || '{}')
    await route.fulfill({
      json: {
        lineId: 54002,
        batchId: 53002,
        ...state.savedLineBody,
        remainingQuantity: Number(state.savedLineBody.shippedQuantity || 0) - Number(state.savedLineBody.receivedQuantity || 0)
      }
    })
    return true
  }
  if (route.request().method() === 'DELETE') {
    state.deletedLineUrl = url
    await route.fulfill({ json: { ...lineResponse, items: [] } })
    return true
  }
  return false
}
