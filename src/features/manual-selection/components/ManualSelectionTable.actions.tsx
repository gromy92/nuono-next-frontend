import { BarChartOutlined, DeleteOutlined, FileSearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space } from 'antd'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import type { ManualSelectionAnalysisProjectInfo } from '../types'
import { manualSelectionCollectionUrl } from '../utils'

type ActionCellProps = {
  analysisProject?: ManualSelectionAnalysisProjectInfo
  deleting: boolean
  isInAnalysis: boolean
  record: ProductSelectionSourceCollection
  recollecting: boolean
  onAddToAnalysis: (record: ProductSelectionSourceCollection) => void
  onDelete: (record: ProductSelectionSourceCollection) => void
  onOpenDetail: (record: ProductSelectionSourceCollection) => void
  onRecollect: (record: ProductSelectionSourceCollection) => void
}

export function ActionCell({ analysisProject, deleting, isInAnalysis, record, recollecting, onAddToAnalysis, onDelete, onOpenDetail, onRecollect }: ActionCellProps) {
  const canAddToAnalysis = record.status === 'success' && !isInAnalysis

  return (
    <Space className="manual-selection-row-actions" direction="vertical" size={4}>
      <Button
        size="small"
        type="text"
        icon={<FileSearchOutlined />}
        block
        data-testid="manual-selection-detail-button"
        onClick={() => onOpenDetail(record)}
      >
        详情
      </Button>
      <Button
        size="small"
        type={canAddToAnalysis ? 'primary' : 'default'}
        icon={<BarChartOutlined />}
        block
        data-testid="manual-selection-analysis-button"
        disabled={!canAddToAnalysis}
        title={isInAnalysis ? `已入组：${analysisProject?.projectName || '未命名组'}` : canAddToAnalysis ? '加入组' : '采集成功后才能加入组'}
        onClick={() => onAddToAnalysis(record)}
      >
        {isInAnalysis ? '已入组' : '加入组'}
      </Button>
      <Button
        size="small"
        icon={<ReloadOutlined />}
        block
        data-testid="manual-selection-recollect-button"
        loading={recollecting}
        disabled={deleting || !manualSelectionCollectionUrl(record)}
        onClick={() => onRecollect(record)}
      >
        重新采集
      </Button>
      <Popconfirm
        title="删除人工采集数据"
        description={isInAnalysis ? '该数据已被选品分析引用，请先在选品分析中解除关联。' : '确认删除这条人工采集数据吗？'}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        disabled={isInAnalysis}
        onConfirm={() => onDelete(record)}
      >
        <Button
          danger
          size="small"
          type="text"
          icon={<DeleteOutlined />}
          block
          data-testid="manual-selection-delete-button"
          loading={deleting}
          disabled={isInAnalysis || recollecting}
          title={isInAnalysis ? '已被选品分析引用，请先解除关联' : '删除人工采集数据'}
        >
          删除
        </Button>
      </Popconfirm>
    </Space>
  )
}
