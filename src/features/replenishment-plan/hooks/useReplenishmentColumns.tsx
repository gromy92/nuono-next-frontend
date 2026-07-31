import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Space, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ProductBaselineIdentity } from '../../product-baseline'
import { pskuSiteTransportKey } from '../purchaseDrafts'
import type { ReplenishmentPlanItem } from '../types'
import { SEA_ETA_UNCERTAIN_AIR_WINDOW_TOOLTIP } from '../pageTypes'
import {
  blockingReasonText, hasSeaEtaRiskWarning, purchaseOpeningKey, resolvedProductActiveState
} from '../replenishmentDomain'
import {
  formatAdjustedHistoryBuckets, formatDate, formatListingAgeDays, formatMonthDay,
  formatMonthlyStabilityFactor, formatPurchaseTransportSource, formatQuantity,
  formatRawHistoryBuckets, numericQuantity
} from '../replenishmentFormatting'
import { renderInboundBatchGroup } from '../components/replenishmentPresentation'
import type { useReplenishmentPlanController } from './useReplenishmentPlanController'

const { Text } = Typography

export function useReplenishmentColumns(state: ReturnType<typeof useReplenishmentPlanController>) {
  const {
    planDate, overview, query, setPreviewImage, openPurchaseModal, openingPurchaseKey,
    purchaseTransportQuantities, purchaseTransportSources
  } = state
  function activeStateLabel(item: ReplenishmentPlanItem) {
    if (resolvedProductActiveState(item) === 'INACTIVE') return '已停用'
    if (resolvedProductActiveState(item) === 'UNKNOWN') return '自动核实中'
    return '参与预测'
  }

  function renderEligibilityNotice(item: ReplenishmentPlanItem) {
    return (
      <Space direction="vertical" size={3} className="replenishment-plan-eligibility-notice">
        <Tag color={resolvedProductActiveState(item) === 'INACTIVE' ? 'default' : 'orange'}>
          {activeStateLabel(item)}
        </Tag>
        <Text type="secondary">未参与预测</Text>
        <Text type="secondary">{blockingReasonText(item)}</Text>
      </Space>
    )
  }
  function renderSuggestionTransportTag(item: ReplenishmentPlanItem, transportMode: 'AIR' | 'SEA') {
    const isAir = transportMode === 'AIR'
    const label = isAir ? '空运' : '海运'
    if (item.calculationBlocked) {
      return (
        <Tooltip title={blockingReasonText(item)}>
          <Tag color="red" className="replenishment-plan-suggestion-tag is-blocked">
            {label} 不可计算
          </Tag>
        </Tooltip>
      )
    }
    const calculatedUnits = isAir ? item.airCalculatedUnits : item.seaCalculatedUnits
    const suggestedUnits = isAir ? item.airSuggestedUnits : item.seaSuggestedUnits
    const status = purchaseTransportStatus(item, transportMode)
    const source = purchaseTransportSource(item, transportMode)
    const seaEtaRisk = isAir && hasSeaEtaRiskWarning(item)
    const statusClassName = status === '已加'
      ? 'is-added'
      : status === '部分'
        ? 'is-partial'
      : status === '待加'
        ? 'is-pending'
        : 'is-none'
    const tagColor = seaEtaRisk ? 'red' : status === '已加' ? undefined : status === '部分' ? 'orange' : isAir ? 'geekblue' : 'cyan'
    const tag = (
      <Tag color={tagColor} className={`replenishment-plan-suggestion-tag ${statusClassName}${seaEtaRisk ? ' is-sea-eta-risk' : ''}`}>
        {label} 计算 {formatQuantity(calculatedUnits)} / 建议 {formatQuantity(suggestedUnits)}
        <span className={`replenishment-plan-suggestion-status ${statusClassName}`}>{status}</span>
      </Tag>
    )
    if (!source && !seaEtaRisk) {
      return tag
    }
    const tooltipLines = [
      ...(seaEtaRisk ? [SEA_ETA_UNCERTAIN_AIR_WINDOW_TOOLTIP] : []),
      ...(source ? [formatPurchaseTransportSource(source)] : [])
    ]
    return (
      <Tooltip title={tooltipLines.join('\n')}>
        {tag}
      </Tooltip>
    )
  }

  function purchaseTransportStatus(item: ReplenishmentPlanItem, transportMode: 'AIR' | 'SEA') {
    const suggestedUnits = transportMode === 'AIR' ? item.airSuggestedUnits : item.seaSuggestedUnits
    const suggestedQuantity = numericQuantity(suggestedUnits)
    if (suggestedQuantity <= 0) {
      return '无需'
    }
    const plannedQuantity = query?.siteCode
      ? purchaseTransportQuantities.get(pskuSiteTransportKey(item.partnerSku, query.siteCode, transportMode)) || 0
      : 0
    if (plannedQuantity >= suggestedQuantity) {
      return '已加'
    }
    return plannedQuantity > 0 ? '部分' : '待加'
  }

  function purchaseTransportSource(item: ReplenishmentPlanItem, transportMode: 'AIR' | 'SEA') {
    if (!query?.siteCode) {
      return undefined
    }
    return purchaseTransportSources.get(pskuSiteTransportKey(item.partnerSku, query.siteCode, transportMode))
  }
  const columns: ColumnsType<ReplenishmentPlanItem> = [
    {
      title: '商品',
      dataIndex: 'partnerSku',
      width: '22%',
      render: (_: string, item) => (
        <div className="replenishment-plan-product-cell">
          <div className="replenishment-plan-product-main">
            <ProductBaselineIdentity
              title={item.productTitle || item.partnerSku}
              imageUrl={item.imageUrl}
              imageCount={item.imageUrl ? 1 : 0}
              imageAlt={item.productTitle || item.partnerSku}
              imageWidth={72}
              onImageClick={item.imageUrl ? () => setPreviewImage({
                url: item.imageUrl || '',
                title: item.productTitle || item.partnerSku
              }) : undefined}
              extra={(
                <div className="replenishment-plan-product-meta">
                  <div className="replenishment-plan-product-codes">
                    <Text type="secondary" copyable={{ text: item.partnerSku }}>{item.partnerSku}</Text>
                    {item.sku ? <Text type="secondary" copyable={{ text: item.sku }}>{item.sku}</Text> : null}
                    <Tag color={resolvedProductActiveState(item) === 'ACTIVE'
                      ? 'green'
                      : resolvedProductActiveState(item) === 'UNKNOWN' ? 'orange' : 'default'}
                    >
                      {activeStateLabel(item)}
                    </Tag>
                  </div>
                  <div className="replenishment-plan-product-listing">
                    <Text type="secondary" className="replenishment-plan-label">上架</Text>
                    <Text type="secondary">
                      {formatDate(item.listingAt) || '-'}{formatListingAgeDays(item.listingAt, planDate)}
                    </Text>
                  </div>
                  <div className="replenishment-plan-product-stock">
                    <Text type="secondary" className="replenishment-plan-label">库存</Text>
                    <div className="replenishment-plan-product-stock-values">
                      <Text>FBN {formatQuantity(item.fbnStockUnits)}</Text>
                      <Text type="secondary">Supermall {formatQuantity(item.supermallStockUnits)}</Text>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      )
    },
    {
      title: (
        <Space size={4} className="replenishment-plan-history-title">
          <span>历史数据</span>
          <Tooltip title="校正历史为按日历因子还原后的常态销量，原始历史为 Noon 报表原始销量；30-60 和 60-90 为历史分段，不是累计值。">
            <ExclamationCircleOutlined className="replenishment-plan-title-help" aria-label="历史数据说明" />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'historyUnits7',
      width: '20%',
      render: (_: unknown, item) => resolvedProductActiveState(item) !== 'ACTIVE' ? renderEligibilityNotice(item) : (
        <div className="replenishment-plan-evidence-cell">
          <div className="replenishment-plan-evidence-card replenishment-plan-evidence-card-history">
            <div className="replenishment-plan-line replenishment-plan-history-row">
              <Text type="secondary" className="replenishment-plan-label replenishment-plan-label-wide">实际历史</Text>
              <Text type="secondary">{item.observedDays || 0} 天 / {item.confidenceLabel || '-'} / 稳定 {formatMonthlyStabilityFactor(item)}</Text>
            </div>
            <div className="replenishment-plan-line replenishment-plan-history-row">
              <Text type="secondary" className="replenishment-plan-label replenishment-plan-label-wide">历史时间</Text>
              <Text className="replenishment-plan-muted">7 / 30 / 30-60 / 60-90天</Text>
            </div>
            <div className="replenishment-plan-history-stack">
              <div className="replenishment-plan-line replenishment-plan-history-row">
                <Text type="secondary" className="replenishment-plan-label replenishment-plan-label-wide">校正历史</Text>
                <Text strong className="replenishment-plan-metric">
                  {formatAdjustedHistoryBuckets(item)} 件
                </Text>
              </div>
              <div className="replenishment-plan-line replenishment-plan-history-row">
                <Text type="secondary" className="replenishment-plan-label replenishment-plan-label-wide">原始历史</Text>
                <Text type="secondary" className="replenishment-plan-muted">{formatRawHistoryBuckets(item)} 件</Text>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: '预测数据',
      dataIndex: 'forecastUnits100',
      width: '18%',
      render: (_: unknown, item) => resolvedProductActiveState(item) !== 'ACTIVE' ? renderEligibilityNotice(item) : (
        <div className="replenishment-plan-evidence-cell">
          <div className="replenishment-plan-evidence-card replenishment-plan-evidence-card-forecast">
            <Space direction="vertical" size={4} className="replenishment-plan-forecast-stack">
              <div className="replenishment-plan-line">
                <Text type="secondary" className="replenishment-plan-label replenishment-plan-label-wide">未来100天</Text>
                <Text className="replenishment-plan-metric">{formatQuantity(item.forecastUnits100)} 件</Text>
              </div>
              <div className="replenishment-plan-window-line">
                <Text type="secondary" className="replenishment-plan-window-mode">空运</Text>
                <Text type="secondary" className="replenishment-plan-window-days">{item.airWindowStartDay}-{item.airWindowEndDay} 天</Text>
                <Text type="secondary" className="replenishment-plan-window-label">预测</Text>
                <Text type="secondary" className="replenishment-plan-window-value">{formatQuantity(item.airWindowForecastUnits)}</Text>
              </div>
              <div className="replenishment-plan-window-line">
                <Text type="secondary" className="replenishment-plan-window-mode">海运</Text>
                <Text type="secondary" className="replenishment-plan-window-days">{item.seaWindowStartDay}-{item.seaWindowEndDay} 天</Text>
                <Text type="secondary" className="replenishment-plan-window-label">预测</Text>
                <Text type="secondary" className="replenishment-plan-window-value">{formatQuantity(item.seaWindowForecastUnits)}</Text>
              </div>
              {item.firstStockoutDay === null || item.firstStockoutDay === undefined
                ? <Text type="secondary" className="replenishment-plan-risk-muted">暂无缺货风险</Text>
                : <Text type="danger" className="replenishment-plan-risk">第 {item.firstStockoutDay} 天缺货</Text>}
            </Space>
          </div>
        </div>
      )
    },
    {
      title: '在途依据',
      dataIndex: 'knownInboundUnits',
      width: '23%',
      render: (_: unknown, item) => (
        <Space direction="vertical" size={3} className="replenishment-plan-inbound-cell">
          <div className="replenishment-plan-line replenishment-plan-inbound-summary">
            <Text type="secondary" className="replenishment-plan-label">覆盖</Text>
            <Text className="replenishment-plan-primary">{formatQuantity(item.knownInboundUnits)}</Text>
            <Text type="secondary" className="replenishment-plan-inline-muted">最近 {formatMonthDay(item.nearestInboundEtaDate) || '-'}</Text>
          </div>
          {renderInboundBatchGroup(item.inboundBatches, 'known', planDate, overview?.siteCode || query?.siteCode || '')}
          {renderInboundBatchGroup(item.missingEtaBatches, 'missing', planDate, overview?.siteCode || query?.siteCode || '')}
        </Space>
      )
    },
    {
      title: '建议',
      dataIndex: 'seaSuggestedUnits',
      width: '17%',
      render: (_: unknown, item) => (
        <Space direction="vertical" size={5} className="replenishment-plan-suggestion-cell">
          <div className="replenishment-plan-suggestion-tags">
            {renderSuggestionTransportTag(item, 'AIR')}
            {renderSuggestionTransportTag(item, 'SEA')}
          </div>
          <Space wrap size={[4, 4]} className="replenishment-plan-row-actions">
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              disabled={item.calculationBlocked}
              onClick={() => void openPurchaseModal([item])}
              loading={openingPurchaseKey === purchaseOpeningKey([item])}
            >
              加入采购
            </Button>
          </Space>
        </Space>
      )
    }
  ]

  return columns
}
