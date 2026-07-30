import { BarChartOutlined, FileSearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import type { ManualSelectionAnalysisProjectInfo } from '../types'
import { manualSelectionCollectionUrl } from '../utils'

type ActionCellProps = {
  analysisProject?: ManualSelectionAnalysisProjectInfo
  isInAnalysis: boolean
  record: ProductSelectionSourceCollection
  recollecting: boolean
  onAddToAnalysis: (record: ProductSelectionSourceCollection) => void
  onOpenDetail: (record: ProductSelectionSourceCollection) => void
  onRecollect: (record: ProductSelectionSourceCollection) => void
}

export function ActionCell({ analysisProject, isInAnalysis, record, recollecting, onAddToAnalysis, onOpenDetail, onRecollect }: ActionCellProps) {
  const canAddToAnalysis = record.status === 'success' && !isInAnalysis

  return (
    <Space className="manual-selection-row-actions" size={4}>
      <Button
        className="manual-selection-row-action-detail"
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
        className="manual-selection-row-action-analysis"
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
        className="manual-selection-row-action-recollect"
        size="small"
        icon={<ReloadOutlined />}
        block
        data-testid="manual-selection-recollect-button"
        loading={recollecting}
        disabled={!manualSelectionCollectionUrl(record)}
        onClick={() => onRecollect(record)}
      >
        重采
      </Button>
    </Space>
  )
}
