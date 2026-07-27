import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { presentProductListingDraftWorkflow } from './productListingDraftWorkflowPresentation'
import type { ProductListingWorkflowPhase } from './types'

const expectations: Array<[ProductListingWorkflowPhase, string, string]> = [
  ['EDITING', '编辑中', '继续编辑'],
  ['READY_TO_CONFIRM', '待确认', '继续确认'],
  ['PUBLISHING', '上架中', '查看进度'],
  ['PUBLISHED', '上架成功', '查看结果'],
  ['ACTION_REQUIRED', '需要处理', '去处理']
]

expectations.forEach(([phase, phaseLabel, actionLabel]) => {
  const presented = presentProductListingDraftWorkflow({
    phase,
    writeCertainty: phase === 'PUBLISHED' ? 'VERIFIED' : 'NOT_STARTED',
    nextAction: phase === 'EDITING' ? 'REVIEW_DRAFT' : phase === 'PUBLISHED' ? 'NONE' : 'WAIT'
  })
  assert.equal(presented.phaseLabel, phaseLabel)
  assert.equal(presented.actionLabel, actionLabel)
})

assert.equal(
  presentProductListingDraftWorkflow(undefined).phaseLabel,
  '状态待同步',
  'missing workflow summary must fail closed instead of inferring state from raw draft status'
)

const apiSource = readFileSync(new URL('./api.ts', import.meta.url), 'utf8')
const drawerSource = readFileSync(
  new URL('../product-management/components/ProductListingDraftDrawer.tsx', import.meta.url),
  'utf8'
)
assert.ok(
  apiSource.includes("includeWorkflow: 'true'") &&
    drawerSource.includes('presentProductListingDraftWorkflow(record.workflow)') &&
    !drawerSource.includes('draftStatusLabel(record.status)'),
  'the draft drawer must consume backend workflow summaries without N+1 or raw-status inference'
)
