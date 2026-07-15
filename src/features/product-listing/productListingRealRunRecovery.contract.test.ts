import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const apiSource = readFileSync(new URL('./api.ts', import.meta.url), 'utf8')
const pageSource = readFileSync(new URL('./ProductListingPage.tsx', import.meta.url), 'utf8')
const taskStatusSource = readFileSync(new URL('./taskStatus.ts', import.meta.url), 'utf8')

assert(
  apiSource.includes('/verify-readback'),
  'product listing API should expose readback-only verification for written_verify_failed tasks'
)
assert(
  apiSource.includes('/continue-after-create'),
  'product listing API should expose continuation after Noon create succeeds but later steps fail'
)
assert(
  apiSource.includes("params.set('draftId', String(draftId))") &&
    pageSource.includes('fetchRecentProductListingTasks(recentTasksStoreCode, 10, currentDraftId)'),
  'listing task recovery should query the backend by draftId instead of filtering a store-level top-N window'
)
assert(
  pageSource.includes('重新回读校验') && pageSource.includes('handleVerifyReadBack'),
  'listing page should expose a human-triggered readback recovery action'
)
assert(
  pageSource.includes('继续写后续步骤') && pageSource.includes('handleContinueAfterCreate'),
  'listing page should expose a human-triggered continue-after-create recovery action'
)
assert(
  pageSource.includes('className="product-listing-recovery-alert"') &&
    pageSource.includes('查询 Noon 并继续') &&
    pageSource.indexOf('className="product-listing-recovery-alert"') < pageSource.indexOf('<Modal'),
  'recovered unknown or interrupted tasks should expose a recovery action on the page without reopening the listing modal'
)
assert(
  pageSource.includes("task.failureCode === 'noon_create_outcome_unknown'") &&
    pageSource.includes("task.failureCode === 'real_run_interrupted'") &&
    pageSource.includes('不会重复创建'),
  'unknown or interrupted create outcomes should expose reference lookup plus continuation without replaying create'
)
assert(
  pageSource.includes('saveProductListingReturnNotice(PRODUCT_LISTING_REAL_RUN_SUBMITTED_NOTICE)') &&
    pageSource.includes('window.location.assign(withCurrentWorkspaceDevQuery(PRODUCT_WORKSPACE_PATH))'),
  'confirmed listing real-run should return to the product list after a task is submitted'
)
assert(
  pageSource.includes('pskuCode') && pageSource.includes('skuParent') && pageSource.includes('readBackAttempts'),
  'real-run task review should surface Noon external references needed for manual checks'
)
assert(
  pageSource.includes('realRunConfirmationBlockedReason') &&
    pageSource.includes('realRunNotice') &&
    pageSource.includes('message.warning(blockedReason)') &&
    pageSource.includes('当前不能确认上架') &&
    !pageSource.includes('disabled: !canConfirmRealRun'),
  'confirm listing should always provide visible feedback when the real-run action is blocked instead of silently doing nothing'
)
assert(
  pageSource.includes('realRunTaskCompletionNotice') &&
    pageSource.includes('setRealRunNotice(notice)') &&
    pageSource.includes('真实上架成功，Noon 回读已通过'),
  'polling real-run completion should update the listing confirmation modal notice after a pending task succeeds or fails'
)
assert(
  pageSource.includes('const realRunPending = isProductListingTaskPending(realRunTaskView?.status)') &&
    pageSource.includes("okText={realRunPending ? '上架执行中' : '确认上架'}") &&
    pageSource.includes('confirmLoading={confirmingRealRun || realRunPending}') &&
    pageSource.includes('正在写入 Noon，请等待执行结果'),
  'confirm listing should show an executing state after a real-run task is submitted so the operator does not think the click had no effect'
)
assert(
  pageSource.includes('const realRunTerminal = Boolean(') &&
    pageSource.includes('const listingReviewFooter = realRunTerminal') &&
    pageSource.includes('footer={listingReviewFooter}') &&
    pageSource.includes('key="close-real-run-terminal"'),
  'completed real-run review modal should remove the confirm listing action and leave only close'
)
assert(
  pageSource.includes('dryRunReviewNotice') &&
    pageSource.includes("taskView.status === 'validated' && !realWriteAttemptLocked ? 'success' : 'warning'") &&
    pageSource.includes('该 dry-run 已完成真实上架，不能重复提交'),
  'validated dry-run notice should not say it can be confirmed again after a real write attempt already exists'
)
assert(
    pageSource.includes('{!realWriteAttemptLocked ? (') &&
    pageSource.includes('确认上架会写入 Noon') &&
    pageSource.includes('{realRunPending ? (') &&
    pageSource.includes(': realRunNotice ? (') &&
    pageSource.includes(': taskView ? (') &&
    pageSource.includes('message={dryRunReviewNotice(taskView, realWriteAttemptLocked, realRunTaskView)}'),
  'listing review modal should collapse already-attempted dry-run states into one primary alert instead of stacking duplicate warnings'
)
assert(
  pageSource.includes('productListingDryRunFailureSummary') &&
    taskStatusSource.includes("purchasePrice: '采购成本'") &&
    taskStatusSource.includes("productFullType: '商品 Fulltype'") &&
    pageSource.includes('dry-run 未通过：'),
  'failed dry-run notice should summarize hard validation errors in Chinese instead of only saying to handle issues'
)
