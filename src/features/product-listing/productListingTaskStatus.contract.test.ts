import assert from 'node:assert/strict'
import {
  isProductListingRealWriteAttempt,
  isProductListingRealWriteAttemptForDryRun,
  isProductListingTaskPending,
  isProductListingTaskTerminal
} from './taskStatus'

const taskStatusModule = await import('./taskStatus') as Record<string, unknown>
const dryRunFailureSummary = taskStatusModule.productListingDryRunFailureSummary as undefined | ((
  task: {
    status?: string
    validationIssues?: Array<{
      fieldKey: string
      severity: string
      code: string
      message: string
    }>
  }
) => string)

assert.equal(isProductListingTaskPending('submitted'), true)
assert.equal(isProductListingTaskPending('running'), true)
assert.equal(isProductListingTaskPending('succeeded'), false)
assert.equal(isProductListingTaskPending('failed'), false)
assert.equal(isProductListingTaskPending('rejected'), false)

assert.equal(isProductListingTaskTerminal('validated'), true)
assert.equal(isProductListingTaskTerminal('validation_failed'), true)
assert.equal(isProductListingTaskTerminal('succeeded'), true)
assert.equal(isProductListingTaskTerminal('failed'), true)
assert.equal(isProductListingTaskTerminal('rejected'), true)
assert.equal(isProductListingTaskTerminal('written_verify_failed'), true)
assert.equal(isProductListingTaskTerminal('submitted'), false)
assert.equal(isProductListingTaskTerminal('running'), false)

assert.equal(isProductListingRealWriteAttempt({ status: 'submitted' }), true)
assert.equal(isProductListingRealWriteAttempt({ status: 'written_verify_failed' }), true)
assert.equal(isProductListingRealWriteAttempt({ status: 'failed' }), false)
assert.equal(isProductListingRealWriteAttempt({ status: 'validated' }), false)
assert.equal(isProductListingRealWriteAttempt({ status: 'rejected', failureCode: 'real_write_disabled' }), true)
assert.equal(isProductListingRealWriteAttempt({ status: 'rejected', failureCode: 'real_run_already_attempted' }), true)

assert.equal(
  isProductListingRealWriteAttemptForDryRun(
    { status: 'succeeded', sourceTaskId: 1001 },
    { taskId: 1001 }
  ),
  true
)
assert.equal(
  isProductListingRealWriteAttemptForDryRun(
    { status: 'succeeded', sourceTaskId: 1000 },
    { taskId: 1001 }
  ),
  false
)

assert.equal(typeof dryRunFailureSummary, 'function')
assert.equal(
  dryRunFailureSummary?.({
    status: 'validation_failed',
    validationIssues: [
      {
        fieldKey: 'psku',
        severity: 'error',
        code: 'partner_sku_already_exists',
        message: 'PSKU 已存在，不能重复创建：test003。请更换新的 PSKU，或到商品详情中编辑已有商品。'
      }
    ]
  }),
  'PSKU 重复：test003 已存在，请更换新的 PSKU，或到商品详情中编辑已有商品。'
)
assert.equal(
  dryRunFailureSummary?.({
    status: 'validation_failed',
    validationIssues: [
      {
        fieldKey: 'barcode',
        severity: 'error',
        code: 'barcode_already_exists',
        message: 'Barcode 已存在，不能重复创建：6290000000001。请更换 barcode。'
      }
    ]
  }),
  'Barcode 重复：6290000000001 已存在，请更换 barcode。'
)
assert.equal(
  dryRunFailureSummary?.({
    status: 'validation_failed',
    validationIssues: [
      {
        fieldKey: 'purchasePrice',
        severity: 'error',
        code: 'required',
        message: 'Purchase price is required.'
      }
    ]
  }),
  '采购成本缺失'
)
