import type { InTransitLogisticsAutoSyncAccount } from './types'
import { formatNodeDateTime } from './InTransitGoodsPage.utils'

export type InTransitAutoSyncAlertItem = {
  key: number
  accountLabel: string
  failureMessage: string
  failureCode?: string
  updatedAtText: string
  taskLabel: string
}

export function isBlockingAutoSyncAccount(account: InTransitLogisticsAutoSyncAccount) {
  return Boolean(
    account.lastFailureCode?.trim()
      || account.lastFailureMessage?.trim()
      || account.lastPreviewStatus === 'FAILED'
      || account.lastSyncStatus === 'FAILED'
      || account.verificationStatus === 'FAILED'
      || account.verificationStatus === 'BLOCKED'
  )
}

export function buildInTransitAutoSyncAlertItems(
  accounts: InTransitLogisticsAutoSyncAccount[]
): InTransitAutoSyncAlertItem[] {
  return accounts.filter(isBlockingAutoSyncAccount).map((account) => {
    const forwarder = account.forwarderName?.trim() || account.sourceSystem?.trim() || '未知货代'
    const maskedLogin = account.loginAccountMasked?.trim()
    const failureCode = account.lastFailureCode?.trim() || undefined
    return {
      key: account.accountId,
      accountLabel: maskedLogin ? `${forwarder}（${maskedLogin}）` : forwarder,
      failureMessage: account.lastFailureMessage?.trim() || failureCode || '货代自动同步失败，请检查任务详情。',
      failureCode,
      updatedAtText: formatNodeDateTime(account.updatedAt),
      taskLabel: account.lastTaskId ? `任务 #${account.lastTaskId}` : '任务号 -'
    }
  })
}
