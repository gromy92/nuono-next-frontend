import { Button, Space } from 'antd'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { manualSelectionCollectionUrl } from '../utils'

type ActionCellProps = {
  record: ProductSelectionSourceCollection
  recollecting: boolean
  onOpenDetail: (record: ProductSelectionSourceCollection) => void
  onRecollect: (record: ProductSelectionSourceCollection) => void
}

export function ActionCell({ record, recollecting, onOpenDetail, onRecollect }: ActionCellProps) {
  return (
    <Space direction="vertical" size={6}>
      <Button
        size="small"
        type="link"
        data-testid="manual-selection-detail-button"
        onClick={() => onOpenDetail(record)}
      >
        查看详情
      </Button>
      <Button
        size="small"
        type="primary"
        ghost
        data-testid="manual-selection-recollect-button"
        loading={recollecting}
        disabled={!manualSelectionCollectionUrl(record)}
        onClick={() => onRecollect(record)}
      >
        重新采集
      </Button>
    </Space>
  )
}
