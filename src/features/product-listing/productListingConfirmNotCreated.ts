import type { ProductListingWorkflowView } from './types'

export function isProductListingConfirmNotCreatedSuccess(
  workflow?: ProductListingWorkflowView
) {
  return Boolean(
    workflow &&
      workflow.phase === 'EDITING' &&
      workflow.writeCertainty === 'NOT_STARTED' &&
      workflow.nextAction === 'REVIEW_DRAFT'
  )
}

export function productListingNotCreatedConfirmationConfig(params: {
  lookupAttemptCount: number
  onConfirm: () => Promise<void>
}) {
  return {
    title: '确认 Noon 未创建商品',
    content:
      `后端已完成 ${params.lookupAttemptCount} 次可靠查询并跨过安全等待时间。` +
      '确认后将结束本次不确定写入并返回编辑；系统不会自动重放上架。',
    okText: '确认未创建并返回编辑',
    okButtonProps: { danger: true },
    cancelText: '继续核对',
    onOk: params.onConfirm
  }
}
