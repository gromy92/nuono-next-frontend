import { RocketOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'
import type { ProductSelectionSourceCollection } from '../../source-collection/types'
import { manualSelectionCollectionUrl } from '../utils'

type ActionCellProps = {
  record: ProductSelectionSourceCollection
  recollecting: boolean
  onOpenDetail: (record: ProductSelectionSourceCollection) => void
  onOpenListing: (record: ProductSelectionSourceCollection) => void
  onRecollect: (record: ProductSelectionSourceCollection) => void
}

export function ActionCell({ record, recollecting, onOpenDetail, onOpenListing, onRecollect }: ActionCellProps) {
  const canOpenListing = record.status === 'success'

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
        icon={<RocketOutlined />}
        data-testid="manual-selection-listing-button"
        disabled={!canOpenListing}
        title={canOpenListing ? '用这条采集记录创建商品上架草稿' : '采集成功后才能上架'}
        onClick={() => onOpenListing(record)}
      >
        上架
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
