import { Button, Tag, Tooltip } from 'antd'
import type { OperationConfigDefaultVersionItem, OperationConfigVersionRow } from './types'
import {
  calendarPresetFor,
  calendarScopeText,
  formatCalendarScope,
  parseCalendarScope
} from './calendarConfigDomain'

export function statusTag(record: OperationConfigVersionRow) {
  if (record.status === 'SYSTEM_DEFAULT') {
    return <Tag color="blue">{record.statusLabel || '系统默认'}</Tag>
  }
  if (record.status === 'DRAFT') {
    return <Tag color="gold">{record.statusLabel || '草稿'}</Tag>
  }
  if (record.status === 'PUBLISHED' || record.status === 'CURRENT') {
    return <Tag color="green">{record.statusLabel || '当前生效'}</Tag>
  }
  if (record.status === 'HISTORICAL') {
    return <Tag>{record.statusLabel || '历史'}</Tag>
  }
  if (record.status === 'DISABLED') {
    return <Tag color="red">{record.statusLabel || '已停用'}</Tag>
  }
  return <Tag>{record.statusLabel || record.status}</Tag>
}

export function configTypeTag(record: OperationConfigVersionRow) {
  const color = record.configType === 'PRODUCT_LIFECYCLE' ? 'purple' : 'cyan'
  return <Tag color={color}>{record.configTypeLabel}</Tag>
}

export function findAction(record: OperationConfigVersionRow, action: string) {
  return record.actions.find((item) => item.action === action)
}

export function actionButton(
  record: OperationConfigVersionRow,
  action: string,
  fallbackLabel: string,
  onAction?: (record: OperationConfigVersionRow) => void
) {
  const item = findAction(record, action) ?? {
    action,
    label: fallbackLabel,
    enabled: false,
    disabledReason: '当前版本状态不可执行'
  }
  const button = (
    <Button
      data-testid={`operation-config-version-action-${action.toLowerCase()}-${record.versionNo}`}
      size="small"
      type={action === 'PUBLISH' ? 'primary' : action === 'DETAIL' ? 'link' : undefined}
      danger={action === 'DISABLE'}
      disabled={!item.enabled}
      onClick={() => {
        if (item.enabled) {
          onAction?.(record)
        }
      }}
    >
      {item.label}
    </Button>
  )
  if (item.enabled || !item.disabledReason) {
    return button
  }
  return <Tooltip title={item.disabledReason}>{button}</Tooltip>
}


export function lifecycleItemDisplayName(item: OperationConfigDefaultVersionItem) {
  const itemName = item.itemName || '生命周期阈值'
  return item.valueType ? `${itemName}(${item.valueType})` : itemName
}

export function lifecycleStageTagColor(groupName?: string | null) {
  if (groupName === '新品期') {
    return 'blue'
  }
  if (groupName === '成长期') {
    return 'green'
  }
  if (groupName === '稳定期') {
    return 'cyan'
  }
  if (groupName === '衰退期') {
    return 'orange'
  }
  if (groupName === '长尾期') {
    return 'purple'
  }
  return 'default'
}

export function normalizeCalendarItem(item: OperationConfigDefaultVersionItem): OperationConfigDefaultVersionItem {
  const preset = calendarPresetFor(item.itemName)
  const scope = parseCalendarScope(item.resultShape)
  return {
    ...item,
    groupName: preset?.groupName ?? item.groupName ?? '业务日历',
    cadence: null,
    valueType: preset?.valueType ?? item.valueType ?? null,
    defaultValue: item.defaultValue || null,
    resultShape: preset?.resultShape ?? formatCalendarScope(scope.type, scope.value),
    note: item.note ?? null
  }
}
