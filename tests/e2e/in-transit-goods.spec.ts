import { expect, test } from '@playwright/test'

const contractResponse = {
  transportModes: [
    { code: 'SEA', label: '海运' },
    { code: 'AIR', label: '空运' }
  ],
  batchStatuses: [
    { code: 'draft', label: '草稿' },
    { code: 'in_transit', label: '运输中' },
    { code: 'exception', label: '异常' },
    { code: 'completed', label: '已完成' }
  ],
  nodeStatuses: [
    { code: 'created', label: '已登记' },
    { code: 'in_transit', label: '运输中' },
    { code: 'customs_clearance', label: '清关中' },
    { code: 'exception', label: '异常' },
    { code: 'warehouse_received', label: '已入仓' }
  ],
  qualityStatuses: [
    { code: 'forwarder_unmatched', label: '货代未归一' },
    { code: 'forwarder_matched', label: '货代已归一' }
  ],
  purchaseOrderFields: [],
  feeFields: []
}

const listResponse = {
  mode: 'local-db',
  ready: true,
  items: [
    {
      batchId: 53001,
      rawForwarderName: '历史货代A',
      forwarderQualityStatus: 'forwarder_unmatched',
      transportMode: 'SEA',
      batchStatus: 'draft',
      targetStoreCode: 'STR245027-NAE',
      targetSiteCode: 'AE',
      targetWarehouseName: 'FBN-DXB',
      etaDate: '2026-06-08',
      trackingNo: 'TRK-001',
      batchReferenceNo: 'BATCH-001',
      missingFields: ['transportMode', 'targetStoreCode', 'targetWarehouseName'],
      skuCount: null,
      shippedQuantityTotal: null,
      receivedQuantityTotal: null,
      remainingQuantityTotal: null
    },
    {
      batchId: 53002,
      standardForwarderId: 51001,
      standardForwarderName: '义特物流',
      forwarderQualityStatus: 'forwarder_matched',
      transportMode: 'AIR',
      batchStatus: 'in_transit',
      targetStoreCode: 'STR245027-NSA',
      targetSiteCode: 'SA',
      targetWarehouseName: 'FBN-RUH',
      etaDate: '2026-06-03',
      containerNo: 'CONT-002',
      batchReferenceNo: 'BATCH-002',
      missingFields: [],
      skuCount: 3,
      shippedQuantityTotal: 160,
      receivedQuantityTotal: 40,
      remainingQuantityTotal: 120,
      cartonCountTotal: 8,
      totalWeightKg: null,
      totalVolumeCbm: null,
      latestNodeStatus: 'customs_clearance',
      latestNodeHappenedAt: '2026-06-01T10:30:00',
      latestNodeDescription: '清关资料已提交'
    }
  ]
}

const nodeResponse = {
  mode: 'local-db',
  ready: true,
  items: [
    {
      nodeId: 55001,
      batchId: 53002,
      nodeStatus: 'customs_clearance',
      nodeHappenedAt: '2026-06-01T10:30:00',
      description: '清关资料已提交',
      operatorName: '运营A'
    },
    {
      nodeId: 55000,
      batchId: 53002,
      nodeStatus: 'in_transit',
      nodeHappenedAt: '2026-05-30T09:00:00',
      description: '海上运输',
      operatorName: '运营B'
    }
  ]
}

const lineResponse = {
  mode: 'local-db',
  ready: true,
  items: [
    {
      lineId: 54001,
      batchId: 53002,
      packageId: 58001,
      boxNo: 'XGGEUAE04029-1',
      sku: 'SKU-AE-001',
      msku: 'MSKU-AE-001',
      psku: 'PSKU-AE-001',
      productName: '折叠手机壳',
      storeCode: 'STR245027-NSA',
      siteCode: 'SA',
      shippedQuantity: 100,
      receivedQuantity: 40,
      remainingQuantity: 60,
      cartonCount: 5,
      unitsPerCarton: 20,
      cartonWeightKg: null,
      cartonVolumeCbm: null,
      remark: '第一箱'
    },
    {
      lineId: 54009,
      batchId: 53002,
      packageId: 58001,
      boxNo: 'XGGEUAE04029-1',
      sku: 'SKU-AE-009',
      msku: 'MSKU-AE-009',
      psku: 'PSKU-AE-009',
      productName: '折叠手机膜',
      storeCode: 'STR245027-NSA',
      siteCode: 'SA',
      shippedQuantity: 60,
      receivedQuantity: 0,
      remainingQuantity: 60,
      cartonCount: 3,
      unitsPerCarton: 20,
      cartonWeightKg: null,
      cartonVolumeCbm: null,
      remark: '第一箱第二个SKU'
    }
  ]
}

const storeOverview = {
  mode: 'local-db',
  ready: true,
  selectedOwnerId: 307,
  summary: {
    totalStores: 1,
    connectedStores: 1,
    pendingStores: 0,
    managerLinks: 0
  },
  ownerOptions: [],
  stores: [],
  syncedRules: [],
  missingCoreTables: []
}

test('renders real empty in-transit batch state without mock rows', async ({ page }) => {
  let batchListRequestedUrl = ''

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
    batchListRequestedUrl = route.request().url()
    await route.fulfill({ json: { mode: 'local-db', ready: true, items: [] } })
  })

  await page.goto('/purchase/in-transit-goods?devSession=1&devRole=boss&grantInTransitGoods=1')

  const pageRoot = page.getByTestId('in-transit-goods-page')
  await expect(pageRoot).toBeVisible()
  await expect(pageRoot.getByText('暂无在途批次')).toBeVisible()
  await expect(pageRoot).not.toContainText('历史货代A')
  await expect(pageRoot).not.toContainText('BATCH-001')
  await expect(pageRoot).not.toContainText('义特物流')
  expect(batchListRequestedUrl).toContain('/api/in-transit-goods/batches')
  expect(batchListRequestedUrl).toContain('statusScope=all')
})

test('maintains in-transit batch basics without expanded fields', async ({ page }) => {
  let savedBody: Record<string, unknown> | null = null
  let savedLineBody: Record<string, unknown> | null = null
  let savedNodeBody: Record<string, unknown> | null = null
  let deletedLineUrl: string | null = null
  let importPreviewCallCount = 0
  let confirmImportUrl: string | null = null
  let lastBatchListUrl = ''

  await page.route('**/api/store-sync/overview**', async (route) => {
    await route.fulfill({ json: storeOverview })
  })
  await page.route('**/api/in-transit-goods/contracts', async (route) => {
    await route.fulfill({ json: contractResponse })
  })
  await page.route('**/api/in-transit-goods/forwarders', async (route) => {
    await route.fulfill({
      json: [
        { id: 51001, forwarderCode: 'YITE', forwarderName: '义特物流', status: 'ACTIVE' }
      ]
    })
  })
  await page.route('**/api/in-transit-goods/batches/*/lines', async (route) => {
    const url = route.request().url()
    if (route.request().method() === 'POST') {
      savedLineBody = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        json: {
          lineId: 54002,
          batchId: 53002,
          ...savedLineBody,
          remainingQuantity: Number(savedLineBody.shippedQuantity || 0) - Number(savedLineBody.receivedQuantity || 0)
        }
      })
      return
    }
    if (route.request().method() === 'DELETE') {
      deletedLineUrl = url
      await route.fulfill({ json: { ...lineResponse, items: [] } })
      return
    }
    await route.fulfill({ json: lineResponse })
  })
  await page.route('**/api/in-transit-goods/batches/*/lines/*', async (route) => {
    deletedLineUrl = route.request().url()
    await route.fulfill({ json: { ...lineResponse, items: [] } })
  })
  await page.route('**/api/in-transit-goods/batches/*/nodes', async (route) => {
    if (route.request().method() === 'POST') {
      savedNodeBody = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        json: {
          nodeId: 55002,
          batchId: 53002,
          ...savedNodeBody
        }
      })
      return
    }
    await route.fulfill({ json: nodeResponse })
  })
  await page.route('**/api/in-transit-goods/import-preview', async (route) => {
    importPreviewCallCount += 1
    if (importPreviewCallCount === 1) {
      await route.fulfill({
        json: {
          importBatchId: 56010,
          mode: 'local-db',
          ready: true,
          status: 'has_errors',
          fileName: '错误在途.csv',
          totalRowCount: 1,
          validRowCount: 0,
          errorCount: 1,
          warningCount: 1,
          willCreateBatchCount: 1,
          willUpsertLineCount: 1,
          issues: [
            {
              level: 'error',
              code: 'transport_mode_invalid',
              message: '运输方式只支持海运或空运。',
              rowNumber: 2,
              field: 'transportMode'
            },
            {
              level: 'warning',
              code: 'forwarder_unmatched',
              message: '货代未归一，确认导入后会保留原始货代名称。',
              rowNumber: 2,
              field: 'rawForwarderName'
            }
          ],
          batches: [
            {
              batchKey: 'BATCH-ERR',
              batchReferenceNo: 'BATCH-ERR',
              rawForwarderName: '历史货代X',
              forwarderQualityStatus: 'forwarder_unmatched',
              transportMode: null,
              targetStoreCode: 'STR245027-NAE',
              targetSiteCode: 'AE',
              targetWarehouseName: 'FBN-DXB',
              lines: [
                {
                  rowNumber: 2,
                  boxNo: 'XGGEUAE04029-1',
                  sku: 'SKU-ERR',
                  shippedQuantity: null,
                  receivedQuantity: 0,
                  issues: [
                    {
                      level: 'error',
                      code: 'transport_mode_invalid',
                      message: '运输方式只支持海运或空运。',
                      rowNumber: 2,
                      field: 'transportMode'
                    }
                  ]
                }
              ],
              issues: []
            }
          ]
        }
      })
      return
    }
    await route.fulfill({
      json: {
        importBatchId: 56011,
        mode: 'local-db',
        ready: true,
        status: 'ready',
        fileName: '历史在途.csv',
        totalRowCount: 2,
        validRowCount: 2,
        errorCount: 0,
        warningCount: 0,
        willCreateBatchCount: 1,
        willUpsertLineCount: 2,
        issues: [],
        batches: [
          {
            batchKey: 'BATCH-IMP',
            batchReferenceNo: 'BATCH-IMP',
            rawForwarderName: '义特物流',
            standardForwarderId: 51001,
            standardForwarderName: '义特物流',
            forwarderQualityStatus: 'forwarder_matched',
            transportMode: 'SEA',
            targetStoreCode: 'STR245027-NAE',
            targetSiteCode: 'AE',
            targetWarehouseName: 'FBN-DXB',
            etaDate: '2026-06-20',
            trackingNo: 'TRK-IMP',
            lines: [
              {
                rowNumber: 2,
                boxNo: 'XGGEUAE04029-1',
                sku: 'SKU-IMP-001',
                shippedQuantity: 10,
                receivedQuantity: 0,
                issues: []
              },
              {
                rowNumber: 3,
                boxNo: 'XGGEUAE04029-2',
                sku: 'SKU-IMP-002',
                shippedQuantity: 8,
                receivedQuantity: 2,
                issues: []
              }
            ],
            issues: []
          }
        ]
      }
    })
  })
  await page.route('**/api/in-transit-goods/import-template', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      headers: {
        'content-disposition': 'attachment; filename="in-transit-goods-import-template.xlsx"'
      },
      body: Buffer.from('xlsx-template')
    })
  })
  await page.route('**/api/in-transit-goods/imports/*/confirm', async (route) => {
    confirmImportUrl = route.request().url()
    await route.fulfill({
      json: {
        importBatchId: 56011,
        status: 'imported',
        importedBatchCount: 1,
        importedLineCount: 2
      }
    })
  })
  await page.route('**/api/in-transit-goods/batches**', async (route) => {
    const url = route.request().url()
    if (url.includes('/lines')) {
      if (route.request().method() === 'POST') {
        savedLineBody = JSON.parse(route.request().postData() || '{}')
        await route.fulfill({
          json: {
            lineId: 54002,
            batchId: 53002,
            ...savedLineBody,
            remainingQuantity: Number(savedLineBody.shippedQuantity || 0) - Number(savedLineBody.receivedQuantity || 0)
          }
        })
        return
      }
      if (route.request().method() === 'DELETE') {
        deletedLineUrl = url
        await route.fulfill({ json: { ...lineResponse, items: [] } })
        return
      }
      await route.fulfill({ json: lineResponse })
      return
    }
    if (route.request().method() === 'POST') {
      savedBody = JSON.parse(route.request().postData() || '{}')
      await route.fulfill({
        json: {
          batchId: 53003,
          ...savedBody,
          batchStatus: savedBody.batchStatus || 'draft',
          forwarderQualityStatus: 'forwarder_unmatched',
          missingFields: []
        }
      })
      return
    }
    lastBatchListUrl = url
    await route.fulfill({ json: listResponse })
  })

  await page.goto('/purchase/in-transit-goods?devSession=1&devRole=boss&grantInTransitGoods=1')

  const pageRoot = page.getByTestId('in-transit-goods-page')
  await expect(pageRoot).toBeVisible()
  await expect(pageRoot.getByText('在途商品')).toBeVisible()
  await expect(pageRoot.getByText('历史货代A')).toBeVisible()
  await expect(pageRoot.getByText('海运')).toBeVisible()
  await expect(pageRoot.getByText('空运')).toBeVisible()
  await expect(pageRoot.getByText('未归一')).toBeVisible()
  await expect(pageRoot.getByText('目标仓', { exact: true })).toBeVisible()
  await expect(pageRoot.getByText('发货 160')).toBeVisible()
  await expect(pageRoot.getByText('入仓 40')).toBeVisible()
  await expect(pageRoot.getByText('重量 -').first()).toBeVisible()
  await expect(pageRoot.getByText('体积 -').first()).toBeVisible()
  await expect(pageRoot.getByText('清关中')).toBeVisible()
  await expect(pageRoot.getByText('清关资料已提交')).toBeVisible()
  await expect(pageRoot).not.toContainText('采购单')
  await expect(pageRoot).not.toContainText('费用')
  expect(lastBatchListUrl).toContain('statusScope=all')

  await page.getByRole('row', { name: /BATCH-002/ }).getByRole('button', { name: /查看箱子/ }).click()
  const boxModal = page.getByRole('dialog', { name: /查看箱子 - BATCH-002/ })
  await expect(boxModal).toBeVisible()
  await expect(boxModal.getByText('XGGEUAE04029-1')).toBeVisible()
  await expect(boxModal.getByText('SKU-AE-001', { exact: true })).toBeVisible()
  await expect(boxModal.getByText('SKU-AE-009', { exact: true })).toBeVisible()
  await expect(boxModal.getByText('发货 160')).toBeVisible()
  await boxModal.getByRole('button', { name: /关\s*闭/ }).click()
  await expect(boxModal).toBeHidden()

  await page.getByRole('button', { name: '导入预览' }).click()
  const importDrawer = page.locator('.ant-drawer').filter({ hasText: '历史数据导入预览' })
  await expect(importDrawer).toBeVisible()
  const downloadPromise = page.waitForResponse('**/api/in-transit-goods/import-template')
  await importDrawer.getByRole('button', { name: '下载模板' }).click()
  await downloadPromise
  await page.setInputFiles('input[type=file]', {
    name: '错误在途.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('批次号,运输方式,SKU\nBATCH-ERR,铁路,SKU-ERR\n')
  })
  await expect(importDrawer.getByText('错误 1')).toBeVisible()
  await expect(importDrawer.getByText('提醒 1')).toBeVisible()
  await expect(importDrawer.getByText('运输方式只支持海运或空运。').first()).toBeVisible()
  await expect(importDrawer.getByText('货代未归一，确认导入后会保留原始货代名称。')).toBeVisible()
  await expect(importDrawer.getByRole('button', { name: '确认导入' })).toBeDisabled()

  await page.setInputFiles('input[type=file]', {
    name: '历史在途.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('批次号,运输方式,SKU,发货数量\nBATCH-IMP,SEA,SKU-IMP-001,10\n')
  })
  await expect(importDrawer.getByText('预览校验通过')).toBeVisible()
  await expect(importDrawer.getByText('BATCH-IMP')).toBeVisible()
  await expect(importDrawer.getByText('XGGEUAE04029-1')).toBeVisible()
  await expect(importDrawer.getByText('SKU-IMP-001')).toBeVisible()
  await expect(importDrawer.getByRole('button', { name: '确认导入' })).toBeEnabled()
  await importDrawer.getByRole('button', { name: '确认导入' }).click()
  await expect.poll(() => confirmImportUrl).toContain('/api/in-transit-goods/imports/56011/confirm')
  await expect(importDrawer).toBeHidden()
  await expect(pageRoot).not.toContainText('采购单')
  await expect(pageRoot).not.toContainText('费用')

  await page.getByPlaceholder('SKU/MSKU/PSKU').fill('SKU-AE-001')
  await page.getByRole('button', { name: '筛选' }).click()
  await expect.poll(() => lastBatchListUrl).toContain('skuKeyword=SKU-AE-001')

  await page.getByRole('button', { name: '新建批次' }).click()
  await page.getByPlaceholder('历史记录里的货代名称').fill('新历史货代')
  await page.locator('.ant-drawer').locator('#transportMode').click()
  await page.getByTitle('海运').click()
  await page.getByPlaceholder('如 STR245027-NAE').fill('STR245027-NAE')
  await page.getByPlaceholder('如 AE / SA').fill('AE')
  await page.getByPlaceholder('如 FBN-DXB').fill('FBN-DXB')
  await page.getByPlaceholder('YYYY-MM-DD').first().fill('2026-05-28')
  await page.getByPlaceholder('YYYY-MM-DD').nth(1).fill('2026-06-18')
  await page.getByRole('button', { name: /保\s*存/ }).click()

  await expect.poll(() => savedBody).not.toBeNull()
  expect(savedBody).toMatchObject({
    rawForwarderName: '新历史货代',
    transportMode: 'SEA',
    targetStoreCode: 'STR245027-NAE',
    targetSiteCode: 'AE',
    targetWarehouseName: 'FBN-DXB'
  })
  expect(savedBody).not.toHaveProperty('purchaseOrderNo')
  expect(savedBody).not.toHaveProperty('feeStatus')

  await page.getByRole('button', { name: /保\s*存/ }).waitFor({ state: 'detached' })
  await page.getByRole('row', { name: /BATCH-002/ }).getByRole('button', { name: /编辑/ }).click()
  const drawer = page.locator('.ant-drawer')
  await expect(drawer.getByText('商品明细')).toBeVisible()
  await expect(drawer.getByText('SKU-AE-001', { exact: true })).toBeVisible()
  await expect(drawer.getByText('XGGEUAE04029-1').first()).toBeVisible()
  await expect(drawer.getByText('发货 100')).toBeVisible()
  await expect(drawer.getByText('入仓 40')).toBeVisible()
  await expect(drawer.getByText('剩余 60').first()).toBeVisible()
  await expect(drawer.getByText('物流时间线')).toBeVisible()
  await expect(drawer.getByText('清关资料已提交')).toBeVisible()
  await expect(drawer.getByText('海上运输')).toBeVisible()

  await drawer.getByRole('button', { name: '添加商品' }).click()
  await page.getByPlaceholder('箱号').fill('XGGEUAE04029-2')
  await page.getByPlaceholder('商品 SKU').fill('SKU-AE-002')
  await page.getByPlaceholder('平台 MSKU').fill('MSKU-AE-002')
  await page.getByPlaceholder('店铺 PSKU').fill('PSKU-AE-002')
  await page.getByPlaceholder('商品名称').fill('数据线')
  await page.getByPlaceholder('发货数量').fill('12')
  await page.getByPlaceholder('已入仓数量').fill('5')
  await page.getByPlaceholder('箱数', { exact: true }).fill('2')
  await page.getByPlaceholder('单箱重量').fill('1.500000')
  await page.getByPlaceholder('单箱体积').fill('0.020000')
  await drawer.getByRole('button', { name: '保存商品' }).click()

  await expect.poll(() => savedLineBody).not.toBeNull()
  expect(savedLineBody).toMatchObject({
    boxNo: 'XGGEUAE04029-2',
    sku: 'SKU-AE-002',
    msku: 'MSKU-AE-002',
    psku: 'PSKU-AE-002',
    shippedQuantity: 12,
    receivedQuantity: 5,
    cartonCount: 2,
    cartonWeightKg: 1.5,
    cartonVolumeCbm: 0.02
  })
  expect(savedLineBody).not.toHaveProperty('remainingQuantity')
  expect(savedLineBody).not.toHaveProperty('purchaseOrderNo')
  expect(savedLineBody).not.toHaveProperty('feeStatus')

  await expect(drawer.getByRole('button', { name: '保存商品' })).toBeHidden()
  await expect(drawer.getByRole('button', { name: /删除/ }).first()).toBeEnabled()
  await drawer.getByRole('button', { name: /删除/ }).first().click()
  await expect.poll(() => deletedLineUrl).toContain('/api/in-transit-goods/batches/53002/lines/54001')

  await drawer.getByRole('button', { name: '添加节点' }).click()
  await drawer.locator('#nodeStatus').click()
  await page.getByTitle('异常').click()
  await page.getByPlaceholder('YYYY-MM-DD HH:mm:ss').fill('2026-06-02 11:00:00')
  await page.getByPlaceholder('节点说明').fill('清关异常，等待补资料')
  await page.getByPlaceholder('操作人').fill('运营C')
  await drawer.getByRole('button', { name: '保存节点' }).click()

  await expect.poll(() => savedNodeBody).not.toBeNull()
  expect(savedNodeBody).toMatchObject({
    nodeStatus: 'exception',
    nodeHappenedAt: '2026-06-02T11:00:00',
    description: '清关异常，等待补资料',
    operatorName: '运营C'
  })
  expect(savedNodeBody).not.toHaveProperty('purchaseOrderNo')
  expect(savedNodeBody).not.toHaveProperty('feeStatus')
})
