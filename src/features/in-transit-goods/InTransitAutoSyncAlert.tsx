import { Alert } from 'antd'
import { buildInTransitAutoSyncAlertItems } from './autoSyncAlerts'
import type { InTransitLogisticsAutoSyncAccount } from './types'

type InTransitAutoSyncAlertProps = {
  state:
    | { status: 'idle' | 'loading' | 'success'; accounts: InTransitLogisticsAutoSyncAccount[] }
    | { status: 'error'; accounts: InTransitLogisticsAutoSyncAccount[]; message: string }
}

export function InTransitAutoSyncAlert({ state }: InTransitAutoSyncAlertProps) {
  const items = buildInTransitAutoSyncAlertItems(state.accounts)
  if (state.status === 'error' && items.length === 0) {
    return (
      <Alert
        type="warning"
        showIcon
        message="货代自动同步告警加载失败"
        description={`${state.message}；在途批次列表仍可继续使用。`}
      />
    )
  }
  if (items.length === 0) {
    return null
  }

  return (
    <Alert
      className="in-transit-auto-sync-alert"
      type="error"
      showIcon
      message={`货代自动同步已阻断（${items.length} 个账号）`}
      description={(
        <ul>
          {items.map((item) => (
            <li key={item.key}>
              <strong>{item.accountLabel}</strong>
              {'：'}{item.failureMessage}
              {' · '}状态更新时间 {item.updatedAtText}
              {' · '}{item.taskLabel}
            </li>
          ))}
        </ul>
      )}
    />
  )
}
