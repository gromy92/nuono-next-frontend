import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProductListingWorkflowPanel } from './ProductListingWorkflowPanel'
import type { ProductListingWorkflowView } from './types'

function render(workflow: ProductListingWorkflowView) {
  return renderToStaticMarkup(
    <ProductListingWorkflowPanel workflow={workflow} onAction={() => undefined} />
  )
}

const publishingMarkup = render({
  phase: 'PUBLISHING',
  writeCertainty: 'UNKNOWN',
  nextAction: 'WAIT',
  message: '正在执行真实上架'
})
assert.match(publishingMarkup, /上架中/)
assert.doesNotMatch(publishingMarkup, /data-testid="product-listing-workflow-action"/)
assert.doesNotMatch(publishingMarkup, /writeCertainty|nextAction|reasonCode|failureCode|REAL_RUN|Dry-run|技术详情/)

const unknownMarkup = render({
  phase: 'ACTION_REQUIRED',
  writeCertainty: 'UNKNOWN',
  nextAction: 'CHECK_CREATE_RESULT',
  reasonCode: 'noon_create_outcome_unknown',
  message: '只允许先核对创建结果'
})
assert.match(unknownMarkup, /需要处理/)
assert.match(unknownMarkup, /核对 Noon 创建结果/)
assert.doesNotMatch(unknownMarkup, /继续完成剩余写入/)
assert.doesNotMatch(unknownMarkup, /noon_create_outcome_unknown/)

const foundMarkup = render({
  phase: 'ACTION_REQUIRED',
  writeCertainty: 'WRITTEN',
  nextAction: 'CONTINUE_AFTER_CREATE',
  message: '已确认创建，可以续写'
})
assert.match(foundMarkup, /继续完成剩余写入/)
assert.match(foundMarkup, /ant-btn-dangerous/)
