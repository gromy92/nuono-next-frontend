import { Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  ProductSelectionSourceCollection,
  SourceCollectionStatus
} from '../../source-collection/types'
import { formatManualSelectionCollectedAt } from '../utils'
import { ActionCell } from './ManualSelectionTable.actions'
import {
  Ali1688StatusCell,
  CompletenessCell,
  SkuCountCell,
  SourceImageCell,
  SourceStatusCell,
  SourceTitleCell
} from './ManualSelectionTable.cells'

const { Text } = Typography

type ManualSelectionTableColumnOptions = {
  recollecting: boolean
  onOpenDetail: (record: ProductSelectionSourceCollection) => void
  onRecollect: (record: ProductSelectionSourceCollection) => void
}

export function buildManualSelectionTableColumns(
  options: ManualSelectionTableColumnOptions
): ColumnsType<ProductSelectionSourceCollection> {
  return [
    {
      title: '主图',
      dataIndex: 'sourceImageUrl',
      key: 'sourceImageUrl',
      width: 130,
      render: (value: string, record) => <SourceImageCell value={value} record={record} />
    },
    {
      title: '三方渠道',
      dataIndex: 'sourcePlatform',
      key: 'sourcePlatform',
      width: 130,
      render: (value: string) => <Text>{value || '-'}</Text>
    },
    {
      title: '英文名',
      dataIndex: 'sourceTitle',
      key: 'sourceTitle',
      width: 330,
      render: (value: string, record) => <SourceTitleCell value={value} record={record} />
    },
    {
      title: '中文名',
      dataIndex: 'sourceTitleCn',
      key: 'sourceTitleCn',
      width: 170,
      render: (value: string, record) => value || record.selectedText || '-'
    },
    {
      title: '采集完整度',
      key: 'collectedCompleteness',
      width: 150,
      render: (_value, record) => <CompletenessCell record={record} />
    },
    {
      title: '采集时间',
      dataIndex: 'collectedAt',
      key: 'collectedAt',
      width: 170,
      render: (value: string) => formatManualSelectionCollectedAt(value)
    },
    {
      title: '源头采集',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (value: SourceCollectionStatus, record) => <SourceStatusCell value={value} record={record} />
    },
    {
      title: '1688查询',
      key: 'ali1688Query',
      width: 240,
      render: (_value, record) => <Ali1688StatusCell record={record} />
    },
    {
      title: 'sku数量',
      key: 'skuNum',
      width: 110,
      align: 'center',
      render: (_value, record) => <SkuCountCell record={record} />
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_value, record) => <ActionCell record={record} {...options} />
    }
  ]
}
