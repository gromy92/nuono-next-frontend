import { Tooltip, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { loadOfficialWarehouseProductInboundHistory } from './statisticsApi'
import { buildProductStockSourceChain, inferProductStockSourceByTotal } from './statisticsDomain'
import type { ProductStockSourceChainSegment } from './statisticsDomain'
import type { OfficialWarehouseStockStatisticsRow } from './statisticsTypes'
import { sourceSegmentColor } from './productStockSourcePresentation'

const { Text } = Typography

export function ProductStockSourcePreview({
  row,
  storeCode,
  siteCode,
  onOpenDetail
}: {
  row: OfficialWarehouseStockStatisticsRow
  storeCode?: string
  siteCode?: string
  onOpenDetail: () => void
}) {
  const fallbackChain = useMemo(
    () => buildProductStockSourceChain(inferProductStockSourceByTotal(row.currentStock || 0, [])),
    [row.currentStock]
  )
  const [chain, setChain] = useState(fallbackChain)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setChain(fallbackChain)
    setFailed(false)
    if (!storeCode || !siteCode || !(row.partnerSku || row.productSiteOfferId)) {
      return () => {
        cancelled = true
      }
    }
    setLoading(true)
    void loadOfficialWarehouseProductInboundHistory({
      storeCode,
      siteCode,
      partnerSku: row.partnerSku,
      productSiteOfferId: row.productSiteOfferId
    })
      .then((history) => {
        if (!cancelled) {
          setChain(
            buildProductStockSourceChain(
              inferProductStockSourceByTotal(row.currentStock || 0, history.rows),
              history.sourceCandidates
            )
          )
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [fallbackChain, row.currentStock, row.partnerSku, row.productSiteOfferId, siteCode, storeCode])

  if (!chain.totalQuantity) {
    return <Text type="secondary">暂无库存</Text>
  }

  return (
    <div className="official-warehouse-source-preview" aria-busy={loading}>
      <ProductStockSourcePreviewStage
        title="ASN"
        totalQuantity={chain.totalQuantity}
        segments={chain.stages.asn}
        onOpenDetail={onOpenDetail}
      />
      <ProductStockSourcePreviewStage
        title="物流"
        totalQuantity={chain.totalQuantity}
        segments={chain.stages.logistics}
        onOpenDetail={onOpenDetail}
      />
      <ProductStockSourcePreviewStage
        title="采购单"
        totalQuantity={chain.totalQuantity}
        segments={chain.stages.purchaseOrder}
        onOpenDetail={onOpenDetail}
      />
      {failed ? <Text className="official-warehouse-source-preview-error" type="secondary">来源读取失败</Text> : null}
    </div>
  )
}

function ProductStockSourcePreviewStage({
  title,
  totalQuantity,
  segments,
  onOpenDetail
}: {
  title: string
  totalQuantity: number
  segments: ProductStockSourceChainSegment[]
  onOpenDetail: () => void
}) {
  const visibleSegments = segments.length
    ? segments
    : [{
        key: `${title}-empty`,
        stage: 'ASN' as const,
        label: '未匹配来源',
        quantity: totalQuantity,
        status: 'UNMATCHED' as const,
        detail: {}
      }]
  return (
    <div className="official-warehouse-source-preview-stage">
      <div className="official-warehouse-source-preview-stage-head">
        <Text strong>{title}</Text>
        <Text type="secondary">{visibleSegments.length} 段</Text>
      </div>
      <div className="official-warehouse-source-preview-bar" aria-label={`${title}库存来源进度`}>
        {visibleSegments.map((segment, index) => (
          <Tooltip key={segment.key} title={`${segment.label}：${segment.quantity.toLocaleString()} 件`}>
            <button
              type="button"
              className="official-warehouse-source-preview-bar-segment"
              aria-label={`${title} ${segment.label} ${segment.quantity.toLocaleString()} 件`}
              style={{ flexGrow: Math.max(segment.quantity, 1), background: sourceSegmentColor(segment, index) }}
              onClick={onOpenDetail}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
