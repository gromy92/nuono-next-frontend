import { useEffect, useState } from 'react'
import { buildCurrentStockWarehouseBreakdown, normalizeOfficialWarehouseProductImageUrl } from './statisticsDomain'
import type { OfficialWarehouseStockStatisticsRow } from './statisticsTypes'

export function OfficialWarehouseProductThumb({ row }: { row: OfficialWarehouseStockStatisticsRow }) {
  const [failed, setFailed] = useState(false)
  const imageUrl = normalizeOfficialWarehouseProductImageUrl(row.imageUrl)
  useEffect(() => {
    setFailed(false)
  }, [imageUrl])
  if (!imageUrl || failed) {
    return <div className="official-warehouse-product-thumb-placeholder">无图</div>
  }
  return (
    <img
      className="official-warehouse-product-thumb"
      src={imageUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export function OfficialWarehouseCurrentStockDetail({ row }: { row: OfficialWarehouseStockStatisticsRow }) {
  const breakdown = buildCurrentStockWarehouseBreakdown(Number(row.currentStock || 0), row.warehouseStocks)
  const summaryItems = [
    {
      key: 'fbn',
      label: '仓',
      value: breakdown.fbnEffectiveStock,
      className: 'official-warehouse-current-stock-summary-fbn'
    },
    {
      key: 'supermall',
      label: 'Supermall',
      value: breakdown.supermallEffectiveStock,
      className: 'official-warehouse-current-stock-summary-supermall'
    },
    {
      key: 'other',
      label: '未标仓',
      value: breakdown.otherEffectiveStock,
      className: 'official-warehouse-current-stock-summary-other'
    }
  ].filter((item) => item.value > 0)

  return (
    <div className="official-warehouse-current-stock-detail">
      <div className="official-warehouse-current-stock-head">
        <div className="official-warehouse-current-stock-total">
          <span>总计</span>
          <strong>{breakdown.totalStock.toLocaleString()}</strong>
          <span>件</span>
        </div>
        {summaryItems.map((item) => (
          <span className={`official-warehouse-current-stock-summary-pill ${item.className}`} key={item.key}>
            <span>{item.label}</span>
            <strong>{item.value.toLocaleString()}</strong>
          </span>
        ))}
      </div>
      {breakdown.rows.length ? (
        <div className="official-warehouse-current-stock-warehouse-chips">
          {breakdown.rows.map((stock) => <WarehouseStockChip key={stock.key} stock={stock} />)}
        </div>
      ) : null}
    </div>
  )
}

function WarehouseStockChip({
  stock
}: {
  stock: ReturnType<typeof buildCurrentStockWarehouseBreakdown>['rows'][number]
}) {
  const extraBuckets = [
    { label: '退货', value: stock.returnStock },
    { label: '异常', value: stock.failedOrExceptionStock },
    { label: '待确认', value: stock.pendingConfirmationStock }
  ].filter((bucket) => bucket.value > 0)
  const title = [
    `${stock.warehouseCode} ${stock.warehouseTypeLabel}`,
    `有效 ${stock.effectiveStock.toLocaleString()}`,
    ...extraBuckets.map((bucket) => `${bucket.label} ${bucket.value.toLocaleString()}`)
  ].join(' · ')
  return (
    <span
      className={`official-warehouse-current-stock-warehouse-chip official-warehouse-current-stock-warehouse-chip-${stock.warehouseType.toLowerCase()}`}
      title={title}
    >
      <span className="official-warehouse-current-stock-warehouse-code">{stock.warehouseCode}</span>
      <strong>{stock.effectiveStock.toLocaleString()}</strong>
      {extraBuckets.length ? <span className="official-warehouse-current-stock-warehouse-alert">!</span> : null}
    </span>
  )
}
