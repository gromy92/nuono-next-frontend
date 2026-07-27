import type { ProductListingWorkflowView } from './types'

export type ProductListingReauthenticationNotice = {
  type: 'info' | 'success' | 'error'
  message: string
}

export const PRODUCT_LISTING_REAUTHENTICATION_POLL_INTERVAL_MS = 2000
export const PRODUCT_LISTING_REAUTHENTICATION_POLL_TIMEOUT_MS = 120000

const REAUTHENTICATION_WAIT_GUIDANCE =
  '如需邮件验证码，验证码阶段最长约 90 秒；系统会每 2 秒查询授权结果，最长等待 120 秒。请保持页面打开，不要重复点击。明确未写入时，授权成功后同一上架任务自动继续；结果未知或已经写入时绝不会重复创建商品。'

export function isProductListingReauthenticationTarget(
  workflow?: ProductListingWorkflowView
) {
  return Boolean(
    workflow &&
      workflow.phase === 'ACTION_REQUIRED' &&
      workflow.nextAction === 'REAUTHENTICATE' &&
      (
        workflow.writeCertainty === 'NOT_STARTED' ||
        workflow.writeCertainty === 'UNKNOWN' ||
        workflow.writeCertainty === 'WRITTEN'
      )
  )
}

export function shouldAutoStartProductListingReauthentication(
  workflow?: ProductListingWorkflowView
) {
  return Boolean(
    isProductListingReauthenticationTarget(workflow) &&
      workflow?.writeCertainty === 'NOT_STARTED'
  )
}

export function isProductListingReauthenticationSuccess(
  workflow?: ProductListingWorkflowView
) {
  return Boolean(
    workflow &&
      (
        (
          workflow.phase === 'PUBLISHING' &&
          workflow.writeCertainty === 'NOT_STARTED' &&
          workflow.nextAction === 'WAIT'
        ) ||
        (
          workflow.phase === 'EDITING' &&
          workflow.writeCertainty === 'NOT_STARTED' &&
          workflow.nextAction === 'REVIEW_DRAFT'
        ) ||
        (
          workflow.phase === 'ACTION_REQUIRED' &&
          workflow.writeCertainty === 'UNKNOWN' &&
          workflow.nextAction === 'CHECK_CREATE_RESULT'
        ) ||
        (
          workflow.phase === 'ACTION_REQUIRED' &&
          workflow.writeCertainty === 'WRITTEN' &&
          (
            workflow.nextAction === 'CONTINUE_AFTER_CREATE' ||
            workflow.nextAction === 'VERIFY_READBACK'
          )
        )
      )
  )
}

export function isProductListingReauthenticationPending(
  workflow?: ProductListingWorkflowView
) {
  return Boolean(
    workflow &&
      workflow.phase === 'ACTION_REQUIRED' &&
      workflow.nextAction === 'WAIT_FOR_REAUTHENTICATION' &&
      (
        workflow.writeCertainty === 'NOT_STARTED' ||
        workflow.writeCertainty === 'UNKNOWN' ||
        workflow.writeCertainty === 'WRITTEN'
      )
  )
}

export function productListingReauthenticationConfirmationConfig(params: {
  storeCode: string
  writeCertainty: ProductListingWorkflowView['writeCertainty']
  onConfirm: () => Promise<void>
}) {
  const uncertain = params.writeCertainty === 'UNKNOWN'
  const written = params.writeCertainty === 'WRITTEN'
  const actionDescription = uncertain
    ? `Noon 创建结果仍未知。将使用 ${params.storeCode} 当前保存的凭证重建会话并执行只读 Catalog 校验；成功后只恢复创建结果核对，绝不会重复创建商品。`
    : written
      ? `Noon 商品已经创建。将使用 ${params.storeCode} 当前保存的凭证重建会话并执行只读 Catalog 校验；成功后只开放创建后续写或回读，绝不会重复创建商品。`
      : `创建尚未开始。将使用 ${params.storeCode} 当前保存的凭证重建 Noon 会话并执行只读 Catalog 校验；授权成功后同一上架任务自动继续。`
  return {
    title: '重新授权 Noon',
    content: `${actionDescription}${REAUTHENTICATION_WAIT_GUIDANCE}`,
    okText: '重新授权',
    cancelText: '取消',
    onOk: params.onConfirm
  }
}

export function productListingReauthenticationProgressNotice(
  workflowMessage?: string
): ProductListingReauthenticationNotice {
  const currentStatus = workflowMessage?.trim()
  return {
    type: 'info',
    message: `${currentStatus || '正在重新授权 Noon。'}${REAUTHENTICATION_WAIT_GUIDANCE}`
  }
}

export function productListingReauthenticationSuccessNotice(
  workflow: ProductListingWorkflowView
): ProductListingReauthenticationNotice {
  const message = workflow.phase === 'PUBLISHING' &&
      workflow.writeCertainty === 'NOT_STARTED'
    ? 'Noon 重新授权成功，系统已用同一任务继续上架。'
    : workflow.writeCertainty === 'UNKNOWN'
    ? 'Noon 重新授权成功，系统正在自动核对创建结果；不会重复创建或确认旧任务。'
    : workflow.writeCertainty === 'WRITTEN'
      ? 'Noon 重新授权成功，请按页面动作继续完成创建后写入或回读；系统不会重复创建或确认旧任务。'
      : 'Noon 重新授权成功，已安全返回编辑。'
  return { type: 'success', message }
}

export function productListingReauthenticationFailureNotice(
  errorMessage: string,
  status?: number
): ProductListingReauthenticationNotice {
  const detail = errorMessage.trim() || 'Noon 重新授权未完成。'
  const prefix = status === 409 ? '重新授权未完成' : '重新授权失败'
  return {
    type: 'error',
    message:
      `${prefix}：${detail} 原上架任务保持不变。请按提示处理后只重试“重新授权 Noon”，不要重复确认旧任务。`
  }
}

export function productListingReauthenticationTimeoutNotice():
ProductListingReauthenticationNotice {
  return {
    type: 'error',
    message:
      '等待 Noon 授权结果已超过 120 秒，后台任务可能仍在处理。请刷新页面继续查询，不要重复发起授权，也不要确认旧任务。'
  }
}
