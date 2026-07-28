import { Button, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  SalesActivityWindow,
  SalesActivityWindowInput,
  SalesAnalyticsQuery
} from '../types'
import type { ActivityWindowFormValues } from '../model/pageTypes'
import { activityTypeLabel } from './formatters'

const { Text } = Typography

export function activityColumns(
  onEdit: (window: SalesActivityWindow) => void,
  onToggle: (window: SalesActivityWindow) => void,
  actionLoading: boolean
): ColumnsType<SalesActivityWindow> {
  return [
    { title: '活动', dataIndex: 'name', width: 180 },
    { title: '类型', dataIndex: 'activityType', width: 100, render: activityTypeLabel },
    { title: '类目', dataIndex: 'categoryScope', width: 130, render: (value?: string) => value || <Text type="secondary">全部</Text> },
    {
      title: '日期',
      key: 'dateRange',
      width: 210,
      render: (_, row) => `${row.dateFrom} 至 ${row.dateTo}`
    },
    { title: '系数', dataIndex: 'factor', width: 80, align: 'right', render: (value: number) => `${Number(value).toFixed(2)}x` },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 80,
      render: (enabled: boolean) => <Tag color={enabled ? 'green' : 'default'}>{enabled ? '启用' : '停用'}</Tag>
    },
    { title: '版本', dataIndex: 'versionNo', width: 72, align: 'right' },
    {
      title: '',
      key: 'action',
      width: 128,
      render: (_, row) => (
        <Space size={4}>
          <Button size="small" onClick={() => onEdit(row)}>
            编辑
          </Button>
          <Button size="small" onClick={() => onToggle(row)} loading={actionLoading}>
            {row.enabled ? '停用' : '启用'}
          </Button>
        </Space>
      )
    }
  ]
}

export function activityPayloadFromForm(
  query: SalesAnalyticsQuery,
  values: ActivityWindowFormValues,
  id?: number
): SalesActivityWindowInput {
  const categoryScope = values.categoryScope?.trim()
  return {
    id,
    storeCode: query.storeCode,
    siteCode: query.siteCode,
    name: values.name.trim(),
    activityType: values.activityType,
    categoryScope: categoryScope || undefined,
    dateFrom: values.dateRange[0].format('YYYY-MM-DD'),
    dateTo: values.dateRange[1].format('YYYY-MM-DD'),
    factor: Number(values.factor),
    enabled: values.enabled
  }
}
