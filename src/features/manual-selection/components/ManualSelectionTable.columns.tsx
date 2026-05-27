import type { ColumnsType } from 'antd/es/table'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { ActionCell } from './ManualSelectionTable.actions'
import {
  Ali1688StatusCell,
  CollectedAtCell,
  CollectionStatusCell,
  SkuCountCell,
  SourceImageCell,
  SourceNameCell,
} from './ManualSelectionTable.cells'

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
      width: 132,
      render: (value: string, record) => <SourceImageCell value={value} record={record} />
    },
    {
      title: '名称',
      key: 'sourceName',
      width: 430,
      render: (_value, record) => <SourceNameCell record={record} />
    },
    {
      title: '采集状态',
      key: 'collectionStatus',
      width: 198,
      render: (_value, record) => <CollectionStatusCell record={record} />
    },
    {
      title: '1688查询',
      key: 'ali1688Query',
      width: 224,
      render: (_value, record) => <Ali1688StatusCell record={record} />
    },
    {
      title: '采集时间',
      dataIndex: 'collectedAt',
      key: 'collectedAt',
      width: 176,
      render: (value: string, record) => <CollectedAtCell value={value} record={record} />
    },
    {
      title: 'sku数量',
      key: 'skuNum',
      width: 80,
      align: 'center',
      render: (_value, record) => <SkuCountCell record={record} />
    },
    {
      title: '操作',
      key: 'action',
      width: 112,
      fixed: 'right',
      render: (_value, record) => <ActionCell record={record} {...options} />
    }
  ]
}
