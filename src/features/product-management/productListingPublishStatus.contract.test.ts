import { strict as assert } from 'node:assert'
import {
  buildProductPublishStatusDisplay,
  productListingPublishStatusMeta
} from './utils/productListingPublishStatus'
import type { ProductListRowPayload } from './types'

function row(overrides: Partial<ProductListRowPayload>): ProductListRowPayload {
  return {
    skuParent: 'ZTEST',
    partnerSku: 'PTEST',
    productSourceType: 'SELF_BUILT',
    detailBaselineStatus: 'ready',
    siteLabels: ['SA'],
    liveStatuses: ['live'],
    issueTags: [],
    ...overrides
  }
}

assert.deepEqual(productListingPublishStatusMeta('succeeded'), {
  label: '上架成功',
  tag: 'success',
  border: '#bbf7d0',
  background: '#f0fdf4',
  text: '#166534'
})

assert.equal(productListingPublishStatusMeta('failed').label, '上架失败')
assert.equal(productListingPublishStatusMeta('written_verify_failed').label, '已写入，回读异常')
assert.equal(productListingPublishStatusMeta('submitted').label, '上架中')

assert.deepEqual(
  buildProductPublishStatusDisplay(row({
    listingPublishTask: {
      taskId: 10153,
      taskNo: 'PLT-10153',
      status: 'succeeded',
      statusLabel: '上架成功',
      partnerSku: 'PTEST',
      pskuCode: 'a0eb6dc54597eeecd3e4b26451e731da',
      finishedAt: '2026-07-10 15:03:00'
    }
  })),
  {
    kind: 'listing',
    title: '真实上架任务',
    label: '上架成功',
    timeText: '2026-07-10 15:03:00',
    resultText: 'PLT-10153',
    color: {
      tag: 'success',
      border: '#bbf7d0',
      background: '#f0fdf4',
      text: '#166534'
    }
  },
  'product list publish column should display latest real listing task'
)

assert.equal(
  buildProductPublishStatusDisplay(row({
    lastPublishTask: {
      taskType: 'publish-current',
      statusLabel: '发布成功',
      finishedAt: '2026-07-09 10:00:00'
    },
    listingPublishTask: {
      status: 'failed',
      statusLabel: '上架失败',
      failureMessage: 'Noon API failed'
    }
  }))?.kind,
  'listing',
  'listing task must take priority over product-detail publish task in the product list status column'
)

assert.deepEqual(
  buildProductPublishStatusDisplay(row({
    lastPublishTask: {
      taskId: 64095,
      taskType: 'product-delete',
      status: 'synced',
      statusLabel: '删除成功',
      resultText: '商品删除已完成。',
      submittedAt: '2026-07-11 16:18:41',
      finishedAt: '2026-07-11 16:48:44'
    },
    listingPublishTask: {
      taskId: 10189,
      taskNo: 'PLT-10189',
      status: 'succeeded',
      statusLabel: '上架成功',
      partnerSku: 'PAPERSAYSB441',
      finishedAt: '2026-07-12 09:35:32'
    }
  })),
  {
    kind: 'listing',
    title: '真实上架任务',
    label: '上架成功',
    timeText: '2026-07-12 09:35:32',
    resultText: 'PLT-10189',
    color: {
      tag: 'success',
      border: '#bbf7d0',
      background: '#f0fdf4',
      text: '#166534'
    }
  },
  'older successful delete task must not hide a newer successful listing task'
)

assert.deepEqual(
  buildProductPublishStatusDisplay(row({
    lastPublishTask: {
      taskId: 64090,
      taskType: 'product-rebuild',
      status: 'product_delete_pending_effective',
      statusLabel: '重建中',
      resultText: '商品重建正在后台处理。',
      submittedAt: '2026-07-11 10:41:03'
    },
    listingPublishTask: {
      taskId: 10176,
      taskNo: 'PLT-10176',
      status: 'succeeded',
      statusLabel: '上架成功',
      partnerSku: 'test1101',
      finishedAt: '2026-07-11 09:59:05'
    }
  })),
  {
    kind: 'product-detail',
    title: '重建任务',
    label: '重建中',
    timeText: '2026-07-11 10:41:03',
    resultText: '商品重建正在后台处理。',
    color: {
      tag: 'processing',
      border: '#bfdbfe',
      background: '#eff6ff',
      text: '#1d4ed8'
    }
  },
  'active rebuild task must override the previous successful listing task in the product list status column'
)
