import { Button, Modal } from 'antd'
import { useEffect, useState } from 'react'
import type { CompetitorDashboardRankChangeItem, RankStatus } from './types'

export function RankChangeDetailModal({
  item,
  copied,
  onCopy,
  onOpenProduct,
  onClose
}: {
  item?: CompetitorDashboardRankChangeItem
  copied: boolean
  onCopy: () => void
  onOpenProduct: () => void
  onClose: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const shouldShowImage = Boolean(item?.imageUrl && !imageFailed)

  useEffect(() => {
    setImageFailed(false)
  }, [item?.imageUrl])

  return (
    <Modal
      width={560}
      title="排名变化详情"
      open={Boolean(item)}
      onCancel={onClose}
      footer={[
        <Button key="copy" onClick={onCopy}>
          {copied ? '已复制' : '复制内容'}
        </Button>,
        <Button key="open" type="primary" disabled={!item?.watchProductId} onClick={onOpenProduct}>
          打开商品明细
        </Button>,
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      {item ? (
        <div className="competitor-analysis-rank-detail-content">
          <div className="competitor-analysis-rank-detail-product">
            <div className="competitor-analysis-rank-detail-image">
              {shouldShowImage ? (
                <img src={item.imageUrl} alt={item.title || item.partnerSku} onError={() => setImageFailed(true)} />
              ) : (
                <span>无图</span>
              )}
            </div>
            <div className="competitor-analysis-rank-detail-product-meta">
              <strong>{rankChangeIdentityValue(item) || '-'}</strong>
              <span>{item.title || '-'}</span>
            </div>
          </div>
          <div className="competitor-analysis-rank-detail-copyable">
            {rankChangeRows(item).map((row) => (
              <div key={row.label} className="competitor-analysis-rank-detail-row">
                <span>{row.label}</span>
                <strong>{row.value || '-'}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

export function rankChangeCopyText(item: CompetitorDashboardRankChangeItem) {
  return rankChangeRows(item)
    .map((row) => `${row.label}: ${row.value || '-'}`)
    .join('\n')
}

function rankChangeRows(item: CompetitorDashboardRankChangeItem) {
  return [
    { label: '关键词', value: item.keyword },
    { label: '对象', value: item.trackedProductType === 'self' ? '我的商品' : '竞品' },
    { label: '变化', value: `${rankDisplay(item.previousRankStatus, item.previousRankNo)} -> ${rankDisplay(item.rankStatus, item.rankNo)}（${rankChangeLabel(item)}）` },
    { label: '范围变化', value: rankRangeChangeText(item) },
    { label: '日期', value: [item.previousDate, item.currentDate].filter(Boolean).join(' -> ') }
  ]
}

function rankChangeIdentityValue(item: CompetitorDashboardRankChangeItem) {
  return item.trackedProductType === 'competitor'
    ? item.noonProductCode || item.partnerSku
    : item.partnerSku
}

function rankRangeChangeText(item: CompetitorDashboardRankChangeItem) {
  const changes = [
    item.priceChangeSummary ? `价格：${item.priceChangeSummary}` : '',
    item.titleChangeSummary ? `标题：${item.titleChangeSummary}` : '',
    item.adChangeSummary ? `广告：${item.adChangeSummary}` : ''
  ].filter(Boolean)
  return changes.length ? changes.join('\n') : '无价格/标题/广告变化'
}

function rankChangeLabel(item: CompetitorDashboardRankChangeItem) {
  if (item.previousRankStatus !== 'ranked' && item.rankStatus === 'ranked') return '进榜'
  if (item.previousRankStatus === 'ranked' && item.rankStatus !== 'ranked') return '出榜'
  if (item.rankDelta > 0) return `+${item.rankDelta}`
  if (item.rankDelta < 0) return `${item.rankDelta}`
  return '0'
}

function rankDisplay(status?: RankStatus, rankNo?: number) {
  return status === 'ranked' && rankNo ? `#${rankNo}` : '未进榜'
}
