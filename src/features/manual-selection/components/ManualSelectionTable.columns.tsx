import { Space, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import type { ManualSelectionAnalysisProjectInfo } from '../types'
import { formatManualSelectionCollectedAt } from '../utils'
import { ActionCell } from './ManualSelectionTable.actions'
import {
  Ali1688StatusCell,
  CompletenessCell,
  SourceChannelCell,
  SourceNameCell,
  SourceStatusCell,
} from './ManualSelectionTable.cells'

const { Text } = Typography

type ManualSelectionTableColumnOptions = {
  analysisCollectionIds: string[]
  analysisProjectByCollectionId: Record<string, ManualSelectionAnalysisProjectInfo>
  deletingCollectionIds: string[]
  recollecting: boolean
  onAddToAnalysis: (record: ProductSelectionSourceCollection) => void
  onDelete: (record: ProductSelectionSourceCollection) => void
  onOpenDetail: (record: ProductSelectionSourceCollection) => void
  onRecollect: (record: ProductSelectionSourceCollection) => void
}

export function buildManualSelectionTableColumns(
  options: ManualSelectionTableColumnOptions
): ColumnsType<ProductSelectionSourceCollection> {
  const analysisIdSet = new Set(options.analysisCollectionIds)

  return [
    {
      title: '主图/三方渠道',
      key: 'source',
      width: 118,
      render: (_value, record) => <SourceChannelCell record={record} />
    },
    {
      title: '商品名称',
      key: 'sourceName',
      width: 292,
      render: (_value, record) => <SourceNameCell record={record} />
    },
    {
      title: '采集完整度',
      key: 'collectedCompleteness',
      width: 124,
      render: (_value, record) => <CompletenessCell record={record} />
    },
    {
      title: '采集状态',
      key: 'collectStatus',
      width: 168,
      render: (_value, record) => (
        <Space direction="vertical" size={3}>
          <SourceStatusCell value={record.status} record={record} />
          <Text type="secondary">{formatManualSelectionCollectedAt(record.collectedAt)}</Text>
        </Space>
      )
    },
    {
      title: '组',
      key: 'analysisProject',
      width: 126,
      render: (_value, record) => {
        const project = options.analysisProjectByCollectionId[record.id]
        if (!project) {
          return <Text type="secondary">未入组</Text>
        }
        return (
          <Space className="manual-selection-linked-project" direction="vertical" size={2}>
            <Text strong title={project.projectName}>{project.projectName}</Text>
            <Text type="secondary">{project.projectMaterialCount || 1} 个素材</Text>
          </Space>
        )
      }
    },
    {
      title: '1688查询',
      key: 'ali1688Query',
      width: 196,
      render: (_value, record) => <Ali1688StatusCell record={record} />
    },
    {
      title: '操作',
      key: 'action',
      width: 112,
      fixed: 'right',
      render: (_value, record) => (
        <ActionCell
          isInAnalysis={analysisIdSet.has(record.id)}
          analysisProject={options.analysisProjectByCollectionId[record.id]}
          deleting={options.deletingCollectionIds.includes(record.id)}
          record={record}
          {...options}
        />
      )
    }
  ]
}
