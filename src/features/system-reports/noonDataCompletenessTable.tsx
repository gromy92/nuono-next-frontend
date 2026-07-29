import { Button, Space, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CategoryTag,
  StatusTag,
  formatDate,
  formatDateTime
} from './NoonDataReportBlocks'
import type {
  NoonDataCompletenessRow,
  NoonDataGapRow
} from './types'

const { Text } = Typography

export const NOON_DATA_CATEGORY_OPTIONS = [
  { label: '全部类别', value: '' },
  { label: '商品列表', value: 'PRODUCT_LIST' },
  { label: '商品详情', value: 'PRODUCT_DETAIL' },
  { label: '销售订单', value: 'SALES_ORDER' },
  { label: 'Product Views 销量/PV', value: 'SALES_PRODUCT_VIEWS' }
]

export const NOON_DATA_LATEST_STATUS_OPTIONS = [
  { label: '全部最新状态', value: '' },
  { label: '就绪', value: 'READY' },
  { label: '未完成', value: 'INCOMPLETE' },
  { label: '待确认', value: 'PENDING_CONFIRMATION' },
  { label: '失败', value: 'FAILED' },
  { label: '已暂停', value: 'PAUSED' },
  { label: '未接入', value: 'NOT_INTEGRATED' }
]

export const NOON_DATA_HISTORY_STATUS_OPTIONS = [
  { label: '全部历史状态', value: '' },
  { label: '无需补全', value: 'NOT_REQUIRED' },
  { label: '未完成', value: 'INCOMPLETE' },
  { label: '已完成', value: 'COMPLETE' },
  { label: '确认空', value: 'CONFIRMED_EMPTY' },
  { label: '超出保留期', value: 'PROVIDER_RETENTION_LIMIT' },
  { label: '失败', value: 'FAILED' },
  { label: '未接入', value: 'NOT_INTEGRATED' }
]

export function buildNoonDataCompletenessColumns(
  onOpenDrilldown: (row: NoonDataCompletenessRow) => void
): ColumnsType<NoonDataCompletenessRow> {
  return [
    {
      title: '店铺',
      dataIndex: 'storeCode',
      key: 'storeCode',
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.storeCode || '-'}</Text>
          <Text type="secondary">{row.siteCode || '-'}</Text>
        </Space>
      )
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (value) => <CategoryTag value={value} />
    },
    {
      title: '最新状态',
      dataIndex: 'latestStatus',
      key: 'latestStatus',
      render: (value) => <StatusTag value={value} />
    },
    {
      title: '历史补全',
      dataIndex: 'historyStatus',
      key: 'historyStatus',
      render: (value) => <StatusTag value={value} />
    },
    {
      title: '最新数据日',
      dataIndex: 'latestDataDate',
      key: 'latestDataDate',
      render: formatDate
    },
    {
      title: '历史覆盖',
      key: 'historyRange',
      render: (_value, row) => `${formatDate(row.historyCoveredFrom)} - ${formatDate(row.historyCoveredTo)}`
    },
    {
      title: '巡检',
      key: 'patrol',
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text>{row.patrolEnabled ? '已开启' : '未开启'}</Text>
          <Text type={row.activeGapCount ? 'danger' : 'secondary'}>{row.activeGapCount ?? 0} 个缺口</Text>
        </Space>
      )
    },
    {
      title: '下次巡检',
      dataIndex: 'nextPatrolAt',
      key: 'nextPatrolAt',
      render: formatDateTime
    },
    {
      title: '缺口',
      key: 'gaps',
      fixed: 'right',
      width: 96,
      render: (_value, row) => (
        <Button size="small" onClick={() => onOpenDrilldown(row)}>查看缺口</Button>
      )
    }
  ]
}

export const NOON_DATA_GAP_COLUMNS: ColumnsType<NoonDataGapRow> = [
  {
    title: '窗口',
    dataIndex: 'windowType',
    key: 'windowType',
    width: 160
  },
  {
    title: '日期范围',
    key: 'dateRange',
    width: 190,
    render: (_value, row) => `${formatDate(row.dateFrom)} - ${formatDate(row.dateTo)}`
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (value) => <StatusTag value={value} />
  },
  {
    title: '失败类型',
    dataIndex: 'failureType',
    key: 'failureType',
    width: 190,
    render: (value) => value || '-'
  },
  {
    title: '证据',
    key: 'evidence',
    render: (_value, row) => (
      <Space direction="vertical" size={0}>
        <Text>task {row.linkedPullTaskId ?? '-'}</Text>
        <Text type="secondary">batch {row.linkedSourceBatchId ?? '-'}</Text>
        <Text type="secondary">{row.diagnosticSummary || '-'}</Text>
      </Space>
    )
  }
]
