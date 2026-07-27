import { ApiError } from '../../shared/api'
import type {
  ProductListingWorkflowNextAction,
  ProductListingWorkflowView
} from './types'

export type DangerousProductListingRecoveryAction =
  | 'CONTINUE_AFTER_CREATE'
  | 'REPLAY_PROJECTION'

export function isAmbiguousProductListingCommandError(error: unknown) {
  if (!(error instanceof ApiError)) {
    return true
  }

  const isExplicitClientRejection =
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 408 &&
    error.status !== 425 &&
    error.status !== 429

  return !isExplicitClientRejection
}

export function isDangerousProductListingRecoveryAction(
  action: ProductListingWorkflowNextAction
): action is DangerousProductListingRecoveryAction {
  return action === 'CONTINUE_AFTER_CREATE' || action === 'REPLAY_PROJECTION'
}

export function shouldAwaitDangerousProductListingActionWorkflow(
  action: DangerousProductListingRecoveryAction,
  workflow?: ProductListingWorkflowView
) {
  return !workflow || workflow.nextAction === action
}
