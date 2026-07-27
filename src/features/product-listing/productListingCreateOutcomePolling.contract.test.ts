import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const hookSource = readFileSync(
  new URL('./useProductListingCreateOutcomePolling.ts', import.meta.url),
  'utf8'
)
const pageSource = readFileSync(
  new URL('./ProductListingPage.tsx', import.meta.url),
  'utf8'
)
const confirmNotCreatedSource = readFileSync(
  new URL('./useProductListingConfirmNotCreated.ts', import.meta.url),
  'utf8'
)

assert.ok(
  hookSource.includes("workflow.nextAction === 'CHECK_CREATE_RESULT'") &&
    hookSource.includes('verifyProductListingCreateOutcome(session.taskId)') &&
    hookSource.includes('CREATE_OUTCOME_POLL_INTERVAL_MS = 30_000') &&
    hookSource.includes('verification.canConfirmNotCreated') &&
    hookSource.includes('continueProductListingRealRunAfterCreate(session.taskId)') &&
    hookSource.includes('系统未重复创建商品，已保留恢复入口') &&
    !hookSource.includes('confirmProductListingNotCreated'),
  'unknown create outcomes must be checked automatically, resume only after a formal reference is found, and never auto-confirm absence'
)
assert.ok(
  confirmNotCreatedSource.includes('useProductListingCreateOutcomePolling({') &&
    confirmNotCreatedSource.includes('observeVerification') &&
    confirmNotCreatedSource.includes('busy || createOutcomePolling.busy') &&
    pageSource.includes('confirmNotCreated.busy'),
  'the existing unknown-outcome recovery controller must own automatic reconciliation and expose its busy state to the page'
)
