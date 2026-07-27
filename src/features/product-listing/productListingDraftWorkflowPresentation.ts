import { presentProductListingWorkflow } from './productListingWorkflowPresentation'
import type {
  ProductListingWorkflowPhase,
  ProductListingWorkflowSummaryView
} from './types'

const ACTION_LABELS: Record<ProductListingWorkflowPhase, string> = {
  EDITING: '继续编辑',
  READY_TO_CONFIRM: '继续确认',
  PUBLISHING: '查看进度',
  PUBLISHED: '查看结果',
  ACTION_REQUIRED: '去处理'
}

export function presentProductListingDraftWorkflow(
  workflow?: ProductListingWorkflowSummaryView
) {
  if (!workflow) {
    return {
      phaseLabel: '状态待同步',
      tagColor: 'orange',
      actionLabel: '查看流程',
      message: '进入上架页读取最新流程状态。'
    }
  }
  const presentation = presentProductListingWorkflow(workflow)
  return {
    phaseLabel: presentation.phaseLabel,
    tagColor: tagColor(presentation.phaseTone),
    actionLabel: ACTION_LABELS[workflow.phase],
    message: presentation.message
  }
}

function tagColor(tone: 'success' | 'processing' | 'warning' | 'default') {
  if (tone === 'success') {
    return 'green'
  }
  if (tone === 'processing') {
    return 'blue'
  }
  if (tone === 'warning') {
    return 'orange'
  }
  return 'default'
}
