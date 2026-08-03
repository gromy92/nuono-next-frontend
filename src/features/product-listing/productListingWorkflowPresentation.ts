import type {
  ProductListingWorkflowNextAction,
  ProductListingWorkflowPhase,
  ProductListingWorkflowView
} from './types'

type WorkflowTone = 'success' | 'processing' | 'warning' | 'default'

export type ProductListingWorkflowActionPresentation = {
  kind: ProductListingWorkflowNextAction
  label: string
  danger: boolean
}

export type ProductListingWorkflowPresentation = {
  phaseLabel: string
  phaseTone: WorkflowTone
  message: string
  action?: ProductListingWorkflowActionPresentation
  allowSave: boolean
  allowPrepare: boolean
  allowCloseReview: boolean
}

const PHASE_PRESENTATION: Record<
  ProductListingWorkflowPhase,
  Pick<ProductListingWorkflowPresentation, 'phaseLabel' | 'phaseTone'>
> = {
  EDITING: { phaseLabel: '编辑中', phaseTone: 'default' },
  READY_TO_CONFIRM: { phaseLabel: '待确认', phaseTone: 'warning' },
  PUBLISHING: { phaseLabel: '上架中', phaseTone: 'processing' },
  PUBLISHED: { phaseLabel: '上架成功', phaseTone: 'success' },
  ACTION_REQUIRED: { phaseLabel: '需要处理', phaseTone: 'warning' }
}

const ACTION_PRESENTATION: Partial<
  Record<ProductListingWorkflowNextAction, Omit<ProductListingWorkflowActionPresentation, 'kind'>>
> = {
  REVIEW_DRAFT: { label: '检查并上架', danger: false },
  EDIT_DRAFT: { label: '修改商品资料', danger: false },
  CONFIRM_PUBLISH: { label: '确认写入 Noon', danger: true },
  CHECK_CREATE_RESULT: { label: '系统正在核对 Noon 创建结果', danger: false },
  CONTINUE_AFTER_CREATE: { label: '继续完成剩余写入', danger: true },
  VERIFY_READBACK: { label: '重新回读 Noon', danger: false },
  REPLAY_PROJECTION: { label: '恢复本地商品资料', danger: false }
}

export function createEditingProductListingWorkflow(): ProductListingWorkflowView {
  return {
    phase: 'EDITING',
    writeCertainty: 'NOT_STARTED',
    nextAction: 'REVIEW_DRAFT',
    message: '完善商品资料后，可以检查并提交上架。'
  }
}

export function presentProductListingWorkflow(
  workflow: ProductListingWorkflowView
): ProductListingWorkflowPresentation {
  const phase = PHASE_PRESENTATION[workflow.phase]
  const actionDefinition = actionAllowedForPhase(workflow.phase, workflow.nextAction)
    ? ACTION_PRESENTATION[workflow.nextAction]
    : undefined
  const publishing = workflow.phase === 'PUBLISHING'
  const editable =
    workflow.writeCertainty === 'NOT_STARTED' &&
    workflow.phase === 'EDITING' &&
    (
      workflow.nextAction === 'EDIT_DRAFT' ||
      workflow.nextAction === 'REVIEW_DRAFT'
    )

  return {
    ...phase,
    message: workflow.message || defaultWorkflowMessage(workflow.phase),
    action: actionDefinition
      ? { kind: workflow.nextAction, ...actionDefinition }
      : undefined,
    allowSave: editable,
    allowPrepare: editable,
    allowCloseReview: !publishing
  }
}

function actionAllowedForPhase(
  phase: ProductListingWorkflowPhase,
  action: ProductListingWorkflowNextAction
) {
  if (phase === 'EDITING') {
    return action === 'REVIEW_DRAFT' || action === 'EDIT_DRAFT'
  }
  if (phase === 'READY_TO_CONFIRM') {
    return action === 'CONFIRM_PUBLISH'
  }
  if (phase === 'ACTION_REQUIRED') {
    return (
      action === 'EDIT_DRAFT' ||
      action === 'REVIEW_DRAFT' ||
      action === 'CHECK_CREATE_RESULT' ||
      action === 'CONTINUE_AFTER_CREATE' ||
      action === 'VERIFY_READBACK' ||
      action === 'REPLAY_PROJECTION'
    )
  }
  return false
}

function defaultWorkflowMessage(phase: ProductListingWorkflowPhase) {
  switch (phase) {
    case 'EDITING':
      return '请完善商品资料。'
    case 'READY_TO_CONFIRM':
      return '上架检查已通过，请确认是否写入 Noon。'
    case 'PUBLISHING':
      return '正在写入 Noon，请保持当前窗口并等待结果。'
    case 'PUBLISHED':
      return '商品已成功写入 Noon，并通过回读确认。'
    case 'ACTION_REQUIRED':
      return '上架需要人工处理，请按当前动作继续。'
  }
}
