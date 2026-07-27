import type { Route } from '@playwright/test'
import {
  PRODUCT_LISTING_WORKFLOW_PSKU,
  REAL_RUN_ID,
  createOutcome,
  realRunTask
} from './product-listing-workflow.fixture-data'
import {
  productListingWorkflowForStage,
  type ProductListingWorkflowStage
} from './product-listing-workflow.fixture-workflows'

type RecoveryCalls = {
  verifyCreateOutcome: number
  confirmNotCreated: number
  continueAfterCreate: number
  verifyReadback: number
  replayProjection: number
}

type RecoveryRouteParams = {
  route: Route
  method: string
  path: string
  stage: ProductListingWorkflowStage
  allowConfirmNotCreated: boolean
  calls: RecoveryCalls
  setStage: (stage: ProductListingWorkflowStage) => void
  rejectUnexpected: (description: string) => Promise<void>
}

export async function handleProductListingRecoveryRoute(
  params: RecoveryRouteParams
) {
  const { method, path, route } = params
  if (
    method === 'POST' &&
    path === `/api/product-listing/tasks/${REAL_RUN_ID}/verify-create-outcome`
  ) {
    if (params.stage !== 'create-unknown') {
      await params.rejectUnexpected(`${method} ${path} while ${params.stage}`)
      return true
    }
    params.calls.verifyCreateOutcome += 1
    const attempt = params.calls.verifyCreateOutcome
    if (attempt === 1) {
      await route.fulfill({
        json: createOutcome(
          'not_found',
          'Noon 暂未找到该商品，不能继续写入。',
          {
            canConfirmNotCreated: params.allowConfirmNotCreated,
            lookupAttemptCount: params.allowConfirmNotCreated ? 3 : 1
          }
        )
      })
      return true
    }
    if (attempt === 2) {
      await route.fulfill({
        json: createOutcome(
          'lookup_failed',
          'Noon 查询失败，创建结果仍不确定。'
        )
      })
      return true
    }
    if (attempt === 3) {
      params.setStage('continue-after-create')
      await route.fulfill({
        json: {
          ...createOutcome(
            'found',
            '已找到 Noon 商品，可以继续完成剩余写入。'
          ),
          skuParent: 'N-SA-WF-7001',
          pskuCode: PRODUCT_LISTING_WORKFLOW_PSKU
        }
      })
      return true
    }
    await params.rejectUnexpected(`${method} ${path} attempt ${attempt}`)
    return true
  }

  if (
    method === 'POST' &&
    path === `/api/product-listing/tasks/${REAL_RUN_ID}/confirm-not-created`
  ) {
    params.calls.confirmNotCreated += 1
    if (
      params.stage !== 'create-unknown' ||
      !params.allowConfirmNotCreated
    ) {
      await params.rejectUnexpected(`${method} ${path} while ${params.stage}`)
      return true
    }
    params.setStage('editing')
    await route.fulfill({
      json: productListingWorkflowForStage('editing')
    })
    return true
  }

  if (
    method === 'POST' &&
    path === `/api/product-listing/tasks/${REAL_RUN_ID}/continue-after-create`
  ) {
    params.calls.continueAfterCreate += 1
    if (params.stage !== 'continue-after-create') {
      await params.rejectUnexpected(`${method} ${path} while ${params.stage}`)
      return true
    }
    params.setStage('verify-readback')
    await route.fulfill({
      json: realRunTask('written_verify_failed', 'readback_mismatch')
    })
    return true
  }

  if (
    method === 'POST' &&
    path === `/api/product-listing/tasks/${REAL_RUN_ID}/verify-readback`
  ) {
    params.calls.verifyReadback += 1
    if (params.stage !== 'verify-readback') {
      await params.rejectUnexpected(`${method} ${path} while ${params.stage}`)
      return true
    }
    params.setStage('replay-projection')
    await route.fulfill({
      json: realRunTask(
        'written_verify_failed',
        'projection_backfill_failed'
      )
    })
    return true
  }

  if (
    method === 'POST' &&
    path === `/api/product-listing/tasks/${REAL_RUN_ID}/replay-projection`
  ) {
    params.calls.replayProjection += 1
    if (params.stage !== 'replay-projection') {
      await params.rejectUnexpected(`${method} ${path} while ${params.stage}`)
      return true
    }
    params.setStage('published')
    await route.fulfill({ json: realRunTask('succeeded') })
    return true
  }

  return false
}
