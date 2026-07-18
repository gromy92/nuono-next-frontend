import { ExclamationCircleOutlined, PlusOutlined, ReloadOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, Input, InputNumber, Modal, Select, Space, Spin, Table, Tag, Tooltip, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Key } from 'react'
import { normalizeError } from '../../shared/api'
import { PURCHASE_IN_TRANSIT_GOODS_PATH, withCurrentWorkspaceDevQuery } from '../app-shell/WorkspaceRouting'
import type { AuthSession } from '../auth/session'
import { ProductBaselineIdentity } from '../product-baseline'
import { addPurchaseOrderItems, loadPurchaseOrders } from '../purchase-order/api'
import type {
  PurchaseOrder,
  PurchaseOrderItemCommand,
  PurchaseSiteCode,
  PurchaseTransportMode,
  SiteAllocation
} from '../purchase-order/types'
import { fetchReplenishmentPlanOverview } from './api'
import { formatPurchaseDuplicateNotice } from './purchaseDuplicateNotice'
import { summarizePurchasePlanProgress, type PurchasePlanProgressSummary } from './purchaseProgress'
import { summarizeMissingEta } from './summary'
import { buildPurchaseDrafts, filterBatchPurchaseDrafts, pskuSiteTransportKey } from './purchaseDrafts'
import type { PurchaseDraftQuantity, PurchaseDraftRow } from './purchaseDrafts'
import type {
  ReplenishmentPlanInboundBatch,
  ReplenishmentPlanItem,
  ReplenishmentPlanMissingEtaBatch,
  ReplenishmentPlanOverview,
  ReplenishmentPlanQuery,
  ReplenishmentQuantity
} from './types'
import './ReplenishmentPlanTab.css'

const { Text } = Typography
const BATCH_PURCHASE_OPENING_KEY = '__batch__'
const SEA_ETA_UNCERTAIN_AIR_WINDOW_WARNING = 'sea_eta_uncertain_air_window_coverage'
const SEA_ETA_UNCERTAIN_AIR_WINDOW_TOOLTIP = '海运到货时间具有不确定性 谨慎评判'
const BLOCKING_WARNING_LABELS: Record<string, string> = {
  daily_forecast_missing: '缺少日级预测',
  daily_forecast_gap: '未来 1-100 天预测不完整',
  stock_fact_missing: '缺少库存事实',
  fbn_stock_fact_missing: '缺少 FBN 库存',
  forecast_fact_expired: '预测事实已过期',
  inbound_site_unresolved: '在途目的站点无法确认'
}

type ReplenishmentPlanTabProps = {
  session?: AuthSession | null
  purchaseOrdersRevision?: number
  onPurchaseOrdersChanged?: () => void | Promise<void>
}

type ProductImagePreview = {
  url: string
  title: string
}

type PurchaseDraftTransportKey = 'air' | 'sea'

type PurchaseDraftLine = {
  partnerSku: string
  site: PurchaseSiteCode
  transportMode: PurchaseTransportMode
  quantity: number
}

type PurchaseTransportSource = {
  orderTitle?: string
  orderNo?: string
  orderStatus?: string
  quantity?: number
}

type SuggestionFilter = 'all' | 'needed' | 'air' | 'sea'

function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').toUpperCase()
  if (normalized.endsWith('-NSA') || normalized.endsWith('-SAU') || normalized.endsWith('-SA')) return 'SA'
  if (normalized.endsWith('-NAE') || normalized.endsWith('-UAE') || normalized.endsWith('-AE')) return 'AE'
  if (normalized.endsWith('-EG')) return 'EG'
  return ''
}

export function ReplenishmentPlanTab({ session, purchaseOrdersRevision, onPurchaseOrdersChanged }: ReplenishmentPlanTabProps) {
  const currentStore = session?.currentStore
  const [overview, setOverview] = useState<ReplenishmentPlanOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [suggestionFilter, setSuggestionFilter] = useState<SuggestionFilter>('all')
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [selectedPurchaseRows, setSelectedPurchaseRows] = useState<ReplenishmentPlanItem[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [openingPurchaseKey, setOpeningPurchaseKey] = useState<string>()
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [purchaseDrafts, setPurchaseDrafts] = useState<PurchaseDraftRow[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<ProductImagePreview | null>(null)
  const [purchaseDuplicateNotice, setPurchaseDuplicateNotice] = useState('')

  const query = useMemo<ReplenishmentPlanQuery | null>(() => {
    if (!currentStore?.storeCode) return null
    return {
      storeCode: currentStore.storeCode,
      siteCode: currentStore.site || siteCodeFromStoreCode(currentStore.storeCode)
    }
  }, [currentStore])

  const loadOverview = useCallback(async () => {
    if (!query?.storeCode || !query.siteCode) {
      setOverview(null)
      return
    }
    setLoading(true)
    setErrorMessage('')
    try {
      const nextOverview = await fetchReplenishmentPlanOverview(query)
      setOverview(nextOverview)
      setSelectedRowKeys([])
      setSelectedPurchaseRows([])
    } catch (error) {
      setOverview(null)
      setErrorMessage(normalizeError(error, '补货计划加载失败'))
    } finally {
      setLoading(false)
    }
  }, [query])

  const rows = overview?.rows || []
  const planDate = useMemo(() => todayIsoDate(), [])
  const searchMatchedRows = useMemo(() => {
    const normalized = searchKeyword.trim().toLowerCase()
    if (!normalized) {
      return rows
    }
    return rows.filter((item) => [
      item.partnerSku,
      item.sku,
      item.productTitle
    ].some((value) => (value || '').toLowerCase().includes(normalized)))
  }, [rows, searchKeyword])
  const filteredRows = useMemo(
    () => searchMatchedRows.filter((item) => matchesSuggestionFilter(item, suggestionFilter)),
    [searchMatchedRows, suggestionFilter]
  )
  const suggestionSummary = useMemo(() => summarizeSuggestions(searchMatchedRows), [searchMatchedRows])
  const missingEtaSummary = useMemo(() => summarizeMissingEta(searchMatchedRows), [searchMatchedRows])
  const blockedRows = useMemo(
    () => searchMatchedRows.filter((item) => item.calculationBlocked),
    [searchMatchedRows]
  )
  const pastEtaReviewCount = useMemo(
    () => searchMatchedRows.reduce((count, item) => (
      count + (item.inboundBatches || []).filter((batch) => batch.etaReviewRequired).length
    ), 0),
    [searchMatchedRows]
  )

  const editableOrders = useMemo(
    () => editablePurchaseOrders(purchaseOrders),
    [purchaseOrders]
  )
  const purchasePlanningOrders = useMemo(
    () => purchasePlanningScopeOrders(purchaseOrders),
    [purchaseOrders]
  )
  const purchaseProgressSummary = useMemo(
    () => summarizePurchasePlanProgress(searchMatchedRows, purchasePlanningOrders, query?.siteCode),
    [searchMatchedRows, purchasePlanningOrders, query?.siteCode]
  )

  const selectedPurchaseOrder = useMemo(
    () => editableOrders.find((order) => order.id === selectedOrderId),
    [editableOrders, selectedOrderId]
  )

  const purchaseTransportQuantities = useMemo(
    () => purchaseOrderTransportQuantities(purchasePlanningOrders),
    [purchasePlanningOrders]
  )
  const purchaseTransportSources = useMemo(
    () => purchaseOrderTransportSources(purchasePlanningOrders),
    [purchasePlanningOrders]
  )

  const loadEditablePurchaseOrders = useCallback(async () => {
    if (!query?.storeCode) {
      setPurchaseOrders([])
      return []
    }
    setOrdersLoading(true)
    try {
      const nextOrders = await loadPurchaseOrders({ storeCode: query.storeCode })
      const nextEditableOrders = editablePurchaseOrders(nextOrders)
      setPurchaseOrders(nextOrders)
      setSelectedOrderId((current) => {
        const candidate = nextEditableOrders.find((order) => order.id === current)
        return candidate?.id || nextEditableOrders[0]?.id
      })
      return nextOrders
    } catch (error) {
      message.error(normalizeError(error, '采购单加载失败'))
      setPurchaseOrders([])
      return []
    } finally {
      setOrdersLoading(false)
    }
  }, [query?.storeCode])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  useEffect(() => {
    void loadEditablePurchaseOrders()
  }, [loadEditablePurchaseOrders, purchaseOrdersRevision])

  const refreshReplenishmentPlan = useCallback(async () => {
    await Promise.all([
      loadOverview(),
      loadEditablePurchaseOrders()
    ])
  }, [loadOverview, loadEditablePurchaseOrders])

  const openPurchaseModal = async (targetRows: ReplenishmentPlanItem[], source: 'single' | 'batch' = 'single') => {
    if (!query?.siteCode) {
      message.warning('请先选择店铺站点。')
      return
    }
    const calculableRows = targetRows.filter((item) => !item.calculationBlocked)
    if (!calculableRows.length) {
      message.warning('所选商品数据依据不足，当前不可加入采购。')
      return
    }
    if (calculableRows.length !== targetRows.length) {
      message.warning('已跳过数据依据不足的商品。')
    }
    const allDrafts = calculableRows.flatMap((item) => buildPurchaseDrafts(item, query.siteCode))
    const drafts = source === 'batch' ? filterBatchPurchaseDrafts(allDrafts) : allDrafts
    if (!drafts.length) {
      message.warning('当前没有可加入采购的商品。')
      return
    }
    const openingKey = purchaseOpeningKey(targetRows)
    setOpeningPurchaseKey(openingKey)
    try {
      const nextOrders = await loadEditablePurchaseOrders()
      setPurchaseDuplicateNotice(formatPurchaseDuplicateNotice(drafts, purchasePlanningScopeOrders(nextOrders)))
      setPurchaseDrafts(drafts)
      setPurchaseModalOpen(true)
    } finally {
      setOpeningPurchaseKey(undefined)
    }
  }

  const closePurchaseModal = () => {
    setPurchaseModalOpen(false)
    setPurchaseDrafts([])
    setSelectedOrderId(undefined)
    setPurchaseDuplicateNotice('')
  }

  const submitPurchaseDrafts = async () => {
    if (!query?.storeCode) {
      message.warning('请先选择店铺。')
      return
    }
    if (!selectedPurchaseOrder) {
      message.warning('请选择已有采购单。')
      return
    }
    const validDrafts = purchaseDraftLines(purchaseDrafts)
    if (!validDrafts.length) {
      message.warning('请至少保留一个大于 0 的商品数量。')
      return
    }
    const selectedOrderIdSnapshot = selectedPurchaseOrder.id
    setSubmitting(true)
    try {
      const latestOrders = await loadEditablePurchaseOrders()
      const latestEditableOrders = editablePurchaseOrders(latestOrders)
      const latestSelectedPurchaseOrder = latestEditableOrders.find((order) => order.id === selectedOrderIdSnapshot)
      if (!latestSelectedPurchaseOrder) {
        message.warning('采购单状态已变更，请重新选择可编辑采购单。')
        return
      }
      const items: PurchaseOrderItemCommand[] = validDrafts.map((draft) => ({
        psku: draft.partnerSku,
        site: draft.site,
        transportMode: draft.transportMode,
        quantity: Math.ceil(draft.quantity),
        fulfillmentType: 'WAREHOUSE_RECEIPT'
      }))
      const nextOrder = await addPurchaseOrderItems(latestSelectedPurchaseOrder.id, { items })
      setPurchaseOrders((current) => replacePurchaseOrder(current, nextOrder))
      message.success(`采购单已更新：${latestSelectedPurchaseOrder.title}`)
      closePurchaseModal()
      setSelectedRowKeys([])
      setSelectedPurchaseRows([])
      await onPurchaseOrdersChanged?.()
    } catch (error) {
      message.error(normalizeError(error, '加入采购单失败'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleSelectedRowsChange(keys: Key[], rows: ReplenishmentPlanItem[]) {
    setSelectedRowKeys(keys)
    setSelectedPurchaseRows(rows)
  }

  const renderSuggestionFilterButton = (
    filter: SuggestionFilter,
    label: string,
    count: number,
    suffix?: string
  ) => (
    <button
      type="button"
      className={suggestionFilter === filter
        ? 'replenishment-plan-summary-filter is-active'
        : 'replenishment-plan-summary-filter'}
      aria-pressed={suggestionFilter === filter}
      onClick={() => setSuggestionFilter(filter)}
    >
      <span>{label}</span>
      <strong>{formatQuantity(count)}</strong>
      {suffix ? <span>{suffix}</span> : null}
    </button>
  )

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
      render: (_: unknown, item) => (
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
      render: (_: unknown, item) => (
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

  return (
    <div className="replenishment-plan-tab" data-testid="replenishment-plan-tab">
      <div className="replenishment-plan-toolbar">
        <div className="replenishment-plan-toolbar-main">
          <Space wrap size={8}>
            <Input
              allowClear
              size="small"
              placeholder="搜索标题 / PSKU / SKU"
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              style={{ width: 220 }}
            />
          </Space>
          <div className="replenishment-plan-summary-bar">
            {renderSuggestionFilterButton('all', '全部', suggestionSummary.totalSkuCount, 'SKU')}
            {renderSuggestionFilterButton('needed', '需要补货', suggestionSummary.replenishmentSkuCount, 'SKU')}
            {renderSuggestionFilterButton('air', '空运', suggestionSummary.airSkuCount)}
            {renderSuggestionFilterButton('sea', '海运', suggestionSummary.seaSkuCount)}
          </div>
        </div>
        <div className="replenishment-plan-toolbar-actions">
          <Button size="small" icon={<ReloadOutlined />} loading={loading || ordersLoading} onClick={() => void refreshReplenishmentPlan()}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            loading={openingPurchaseKey === BATCH_PURCHASE_OPENING_KEY}
            disabled={!selectedPurchaseRows.length}
            onClick={() => void openPurchaseModal(selectedPurchaseRows, 'batch')}
          >
            批量加入采购
          </Button>
        </div>
      </div>

      {renderPurchaseProgressSummary(purchaseProgressSummary)}

      {errorMessage ? <Alert type="error" showIcon message="补货计划加载失败" description={errorMessage} /> : null}
      {blockedRows.length ? (
        <Alert
          className="replenishment-plan-calculation-blocked-alert"
          type="error"
          showIcon
          message={`${blockedRows.length} 个商品数据依据不足，已停止生成采购建议`}
          description={summarizeBlockingReasons(blockedRows)}
        />
      ) : null}
      {missingEtaSummary.batchCount ? (
        <Alert
          className="replenishment-plan-missing-eta-alert"
          type="warning"
          showIcon
          message={`${missingEtaSummary.itemCount} 个商品存在 ${missingEtaSummary.batchCount} 批未维护 ETA 的在途，共 ${formatQuantity(missingEtaSummary.quantity)} 件未计入覆盖`}
          action={<Button size="small" onClick={openMissingEtaOverviewMaintenance}>维护在途 ETA</Button>}
        />
      ) : null}
      {pastEtaReviewCount ? (
        <Alert
          className="replenishment-plan-past-eta-alert"
          type="warning"
          showIcon
          message={`${pastEtaReviewCount} 批在途 ETA 已过期，未计入覆盖，请复核实际到仓状态`}
          action={<Button size="small" onClick={openMissingEtaOverviewMaintenance}>复核在途</Button>}
        />
      ) : null}

      <Spin spinning={loading}>
        {overview?.state === 'empty' ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无补货计划；请先生成销量预测。" />
        ) : (
          <Table<ReplenishmentPlanItem>
            rowKey="partnerSku"
            size="small"
            dataSource={filteredRows}
            columns={columns}
            tableLayout="fixed"
            rowSelection={{
              selectedRowKeys,
              onChange: handleSelectedRowsChange,
              getCheckboxProps: (item) => ({
                disabled: item.calculationBlocked,
                title: item.calculationBlocked ? '数据依据不足，当前不可加入采购' : undefined
              })
            }}
            pagination={{ pageSize: 20, showSizeChanger: false }}
            locale={{ emptyText: '暂无符合条件的补货计划' }}
          />
        )}
      </Spin>

      <Modal
        title={previewImage?.title || '商品图片'}
        open={Boolean(previewImage)}
        footer={null}
        onCancel={() => setPreviewImage(null)}
        width={720}
        centered
      >
        {previewImage ? (
          <img
            src={previewImage.url}
            alt={previewImage.title}
            style={{ display: 'block', width: '100%', maxHeight: '72vh', objectFit: 'contain' }}
          />
        ) : null}
      </Modal>

      <Modal
        title="加入采购单"
        open={purchaseModalOpen}
        width={860}
        okText="加入采购"
        cancelText="取消"
        okButtonProps={{ loading: submitting, disabled: ordersLoading || !selectedOrderId }}
        onOk={() => void submitPurchaseDrafts()}
        onCancel={closePurchaseModal}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {purchaseDuplicateNotice ? (
            <Alert
              className="replenishment-plan-purchase-duplicate-alert"
              type="error"
              showIcon
              message={purchaseDuplicateNotice}
            />
          ) : null}
          <Select
            loading={ordersLoading}
            value={selectedOrderId}
            placeholder="选择已有采购单"
            style={{ width: '100%' }}
            options={editableOrders.map((order) => ({
              label: `${order.title} / ${order.orderNo}`,
              value: order.id
            }))}
            onChange={setSelectedOrderId}
            notFoundContent={ordersLoading ? '加载中' : '暂无可编辑采购单'}
          />
          <Table<PurchaseDraftRow>
            size="small"
            rowKey="key"
            dataSource={purchaseDrafts}
            pagination={false}
            columns={[
              {
                title: '商品',
                dataIndex: 'partnerSku',
                render: (_: string, draft) => (
                  <Space direction="vertical" size={0}>
                    <Text strong>{draft.partnerSku}</Text>
                    <Text type="secondary">{draft.productTitle || draft.sku || '-'}</Text>
                  </Space>
                )
              },
              {
                title: '空运',
                dataIndex: 'air',
                width: 190,
                render: (_: PurchaseDraftQuantity, draft) => renderDraftQuantityEditor(draft, 'air')
              },
              {
                title: '海运',
                dataIndex: 'sea',
                width: 190,
                render: (_: PurchaseDraftQuantity, draft) => renderDraftQuantityEditor(draft, 'sea')
              }
            ]}
          />
        </Space>
      </Modal>
    </div>
  )

  function renderDraftQuantityEditor(draft: PurchaseDraftRow, transportKey: PurchaseDraftTransportKey) {
    const quantityDraft = draft[transportKey]
    return (
      <div className="replenishment-plan-draft-transport-cell">
        <Text type="secondary" className="replenishment-plan-draft-quantity-prefix">
          计算 {formatQuantity(quantityDraft.calculatedQuantity)} / 建议
        </Text>
        <InputNumber
          min={0}
          precision={0}
          value={quantityDraft.quantity}
          onChange={(value) => updateDraftQuantity(draft.key, transportKey, Math.max(0, Number(value || 0)))}
        />
      </div>
    )
  }

  function updateDraftQuantity(key: string, transportKey: PurchaseDraftTransportKey, quantity: number) {
    setPurchaseDrafts((current) => current.map((draft) => {
      if (draft.key !== key) {
        return draft
      }
      const nextDraft: PurchaseDraftRow = {
        ...draft,
        [transportKey]: {
          ...draft[transportKey],
          quantity
        }
      }
      return nextDraft
    }))
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
}

function hasSeaEtaRiskWarning(item: ReplenishmentPlanItem) {
  return item.warnings?.includes(SEA_ETA_UNCERTAIN_AIR_WINDOW_WARNING)
}

function blockingReasonText(item: ReplenishmentPlanItem) {
  const labels = (item.warnings || [])
    .map((warning) => BLOCKING_WARNING_LABELS[warning])
    .filter(Boolean)
  return labels.length ? labels.join('；') : '补货计算依据不足'
}

function summarizeBlockingReasons(rows: ReplenishmentPlanItem[]) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    for (const warning of row.warnings || []) {
      const label = BLOCKING_WARNING_LABELS[warning]
      if (label) {
        counts.set(label, (counts.get(label) || 0) + 1)
      }
    }
  }
  return Array.from(counts.entries())
    .map(([label, count]) => `${label} ${count} 个`)
    .join('；')
}

function openMissingEtaOverviewMaintenance() {
  if (typeof window === 'undefined') {
    return
  }
  const targetPath = withCurrentWorkspaceDevQuery(`${PURCHASE_IN_TRANSIT_GOODS_PATH}?statusScope=active`)
  window.history.pushState({}, '', targetPath)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function purchaseDraftLines(drafts: PurchaseDraftRow[]): PurchaseDraftLine[] {
  return drafts.flatMap((draft) => [draft.air, draft.sea]
    .filter((quantityDraft) => quantityDraft.quantity > 0)
    .map((quantityDraft) => ({
      partnerSku: draft.partnerSku,
      site: draft.site,
      transportMode: quantityDraft.transportMode,
      quantity: quantityDraft.quantity
    })))
}

function replacePurchaseOrder(orders: PurchaseOrder[], nextOrder: PurchaseOrder) {
  const replaced = orders.map((order) => order.id === nextOrder.id ? nextOrder : order)
  return orders.some((order) => order.id === nextOrder.id) ? replaced : [nextOrder, ...orders]
}

function editablePurchaseOrders(orders: PurchaseOrder[]) {
  return orders.filter((order) => (
    order.status !== 'submitted'
    && order.status !== 'deleted'
    && order.status !== 'done'
    && !isHistoricalPurchaseOrder(order)
  ))
}

function purchasePlanningScopeOrders(orders: PurchaseOrder[]) {
  return orders.filter((order) => (
    order.status !== 'deleted'
    && order.status !== 'done'
    && !isHistoricalPurchaseOrder(order)
  ))
}

function isHistoricalPurchaseOrder(order: PurchaseOrder) {
  return (order.orderNo || '').startsWith('PO-HIST-')
}

function purchaseOpeningKey(targetRows: ReplenishmentPlanItem[]) {
  if (targetRows.length !== 1) {
    return BATCH_PURCHASE_OPENING_KEY
  }
  return targetRows[0]?.partnerSku || BATCH_PURCHASE_OPENING_KEY
}

function purchaseOrderTransportQuantities(orders: PurchaseOrder[]) {
  const quantities = new Map<string, number>()
  for (const order of orders) {
    for (const item of order.items || []) {
      for (const allocation of item.allocations || []) {
        const key = pskuSiteTransportKey(item.partnerSku, allocation.site, allocation.transportMode)
        quantities.set(key, (quantities.get(key) || 0) + numericQuantity(allocation.quantity))
      }
    }
  }
  return quantities
}

function purchaseOrderTransportSources(orders: PurchaseOrder[]) {
  const sources = new Map<string, PurchaseTransportSource>()
  for (const order of orders) {
    for (const item of order.items || []) {
      for (const allocation of item.allocations || []) {
        const key = pskuSiteTransportKey(item.partnerSku, allocation.site, allocation.transportMode)
        const current = sources.get(key)
        const next = current || purchaseTransportSourceFromAllocation(order, allocation)
        sources.set(key, {
          ...next,
          quantity: numericQuantity(current?.quantity) + numericQuantity(allocation.quantity)
        })
      }
    }
  }
  return sources
}

function purchaseTransportSourceFromAllocation(order: PurchaseOrder, allocation: SiteAllocation): PurchaseTransportSource {
  return {
    orderTitle: order.title,
    orderNo: order.orderNo,
    orderStatus: order.status,
    quantity: allocation.quantity
  }
}

function summarizeSuggestions(rows: ReplenishmentPlanItem[]) {
  const totalSkuCount = rows.length
  let replenishmentSkuCount = 0
  let airSkuCount = 0
  let seaSkuCount = 0
  for (const row of rows) {
    const hasAir = hasAirSuggestion(row)
    const hasSea = hasSeaSuggestion(row)
    if (hasAir || hasSea) {
      replenishmentSkuCount += 1
    }
    if (hasAir) {
      airSkuCount += 1
    }
    if (hasSea) {
      seaSkuCount += 1
    }
  }
  return { totalSkuCount, replenishmentSkuCount, airSkuCount, seaSkuCount }
}

function matchesSuggestionFilter(item: ReplenishmentPlanItem, suggestionFilter: SuggestionFilter) {
  if (suggestionFilter === 'all') {
    return true
  }
  if (suggestionFilter === 'needed') {
    return hasAirSuggestion(item) || hasSeaSuggestion(item)
  }
  if (suggestionFilter === 'air') {
    return hasAirSuggestion(item)
  }
  if (suggestionFilter === 'sea') {
    return hasSeaSuggestion(item)
  }
  return true
}

function renderPurchaseProgressSummary(summary: PurchasePlanProgressSummary) {
  const orderText = summary.orderLabels.length ? summary.orderLabels.join('、') : '暂无'
  return (
    <div className="replenishment-plan-progress-summary">
      <Text strong className="replenishment-plan-progress-title">当前计划</Text>
      <Tooltip title={orderText}>
        <Text className="replenishment-plan-progress-orders">已加入 {orderText}</Text>
      </Tooltip>
      <Text>
        商品 {formatQuantity(summary.addedSkuCount)} / {formatQuantity(summary.totalReplenishmentSkuCount)} 个
      </Text>
      {summary.partialSkuCount ? <Text>部分覆盖 {formatQuantity(summary.partialSkuCount)} 个</Text> : null}
      <Text>
        空运 {formatQuantity(summary.airSkuCount)} 个 / {formatQuantity(summary.airQuantity)} 件
      </Text>
      <Text>
        海运 {formatQuantity(summary.seaSkuCount)} 个 / {formatQuantity(summary.seaQuantity)} 件
      </Text>
      <Text strong>还剩 {formatQuantity(summary.remainingSkuCount)} 个商品</Text>
    </div>
  )
}

function hasAirSuggestion(item: ReplenishmentPlanItem) {
  return !item.calculationBlocked && numericQuantity(item.airSuggestedUnits) > 0
}

function hasSeaSuggestion(item: ReplenishmentPlanItem) {
  return !item.calculationBlocked && numericQuantity(item.seaSuggestedUnits) > 0
}

function renderInboundBatchGroup(
  batches: Array<ReplenishmentPlanInboundBatch | ReplenishmentPlanMissingEtaBatch> | undefined,
  kind: 'known' | 'missing',
  planDate: string,
  siteCode: string
) {
  if (!batches?.length) {
    return null
  }
  return (
    <div className="replenishment-plan-inbound-group">
      <Space direction="vertical" size={2} className="replenishment-plan-inbound-list">
        {batches.map((batch, index) => {
          const etaReviewRequired = isEtaReviewRequired(batch)
          const etaDate = 'etaDate' in batch ? batch.etaDate : null
          const etaDistanceText = etaDate ? formatEtaDistanceDays(etaDate, planDate) : ''
          const etaDisplay = etaDate ? `${formatMonthDay(etaDate)}${etaDistanceText ? ` ${etaDistanceText}` : ''}` : 'ETA 未维护'
          const destinationDisplay = batch.destinationCode
            ? `${batch.destinationCode} / ${siteCode || '-'}`
            : siteCode || '-'
          return (
            <div
              className={`replenishment-plan-inbound-batch${etaReviewRequired ? ' replenishment-plan-inbound-batch-review' : ''}`}
              key={inboundBatchKey(batch, index)}
            >
              <span className="replenishment-plan-inbound-identity">
                <Text type="secondary" className="replenishment-plan-inbound-ref">{batch.batchReferenceNo || `#${batch.batchId || '-'}`}</Text>
                <Text type="secondary" className="replenishment-plan-inbound-destination">{destinationDisplay}</Text>
              </span>
              <Text type="secondary" className="replenishment-plan-inbound-quantity">{formatQuantity(batch.remainingQuantity)}</Text>
              <Text
                type={etaReviewRequired || kind === 'missing' ? 'danger' : undefined}
                className="replenishment-plan-inbound-eta"
              >
                {etaReviewRequired
                  ? `${etaDisplay} 待判断`
                  : etaDisplay}
              </Text>
            </div>
          )
        })}
      </Space>
    </div>
  )
}

function isEtaReviewRequired(batch: ReplenishmentPlanInboundBatch | ReplenishmentPlanMissingEtaBatch) {
  return 'etaReviewRequired' in batch && batch.etaReviewRequired
}

function inboundBatchKey(batch: ReplenishmentPlanInboundBatch | ReplenishmentPlanMissingEtaBatch, index: number) {
  return `${batch.batchId || 'batch'}:${batch.batchReferenceNo || 'ref'}:${index}`
}

function purchaseOrderStatusLabel(value?: string | null) {
  if (value === 'draft') return '草稿'
  if (value === 'pending_collection') return '待采集'
  if (value === 'collecting') return '采集中'
  if (value === 'partial_done') return '部分完成'
  if (value === 'done') return '完成'
  if (value === 'exception') return '异常'
  if (value === 'submitted') return '已封存'
  if (value === 'deleted') return '已删除'
  return value || '-'
}

function formatPurchaseTransportSource(source: PurchaseTransportSource) {
  const orderText = [source.orderTitle, source.orderNo].filter(Boolean).join(' / ') || '采购单'
  const statusText = source.orderStatus ? `（${purchaseOrderStatusLabel(source.orderStatus)}）` : ''
  const quantityText = source.quantity === undefined ? '' : `，数量 ${formatQuantity(source.quantity)}`
  return `${orderText}${statusText}${quantityText}`
}

function formatQuantity(value?: ReplenishmentQuantity | null) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return String(value)
  }
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2)
}

function formatWholeQuantity(value?: ReplenishmentQuantity | null) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return String(value)
  }
  return String(Math.round(parsed))
}

function formatMonthlyStabilityFactor(item: ReplenishmentPlanItem) {
  const factor = monthlyStabilityFactor(item)
  return factor === null ? '-' : factor.toFixed(2)
}

function formatAdjustedHistoryBuckets(item: ReplenishmentPlanItem) {
  return historyBuckets(
    numericQuantity(item.adjustedHistoryUnits7),
    numericQuantity(item.adjustedHistoryUnits30),
    numericQuantity(item.adjustedHistoryUnits60),
    numericQuantity(item.adjustedHistoryUnits90)
  ).map((quantity) => formatWholeQuantity(quantity)).join(' / ')
}

function formatRawHistoryBuckets(item: ReplenishmentPlanItem) {
  return historyBuckets(
    numericQuantity(item.historyUnits7),
    numericQuantity(item.historyUnits30),
    numericQuantity(item.historyUnits60),
    numericQuantity(item.historyUnits90)
  ).map((quantity) => formatWholeQuantity(quantity)).join(' / ')
}

function historyBuckets(history7: number, history30: number, history60: number, history90: number) {
  return [
    Math.max(0, history7),
    Math.max(0, history30),
    Math.max(0, history60 - history30),
    Math.max(0, history90 - history60)
  ]
}

function monthlySalesBuckets(item: ReplenishmentPlanItem) {
  const month1 = numericQuantity(item.adjustedHistoryUnits30)
  const month2 = numericQuantity(item.adjustedHistoryUnits60) - numericQuantity(item.adjustedHistoryUnits30)
  const month3 = numericQuantity(item.adjustedHistoryUnits90) - numericQuantity(item.adjustedHistoryUnits60)
  return [month1, month2, month3].map((quantity) => Math.max(0, Math.round(quantity)))
}

function monthlyStabilityFactor(item: ReplenishmentPlanItem) {
  const buckets = monthlySalesBuckets(item)
  const average = buckets.reduce((sum, quantity) => sum + quantity, 0) / buckets.length
  if (average <= 0) {
    return null
  }
  const variance = buckets.reduce((sum, quantity) => sum + ((quantity - average) ** 2), 0) / buckets.length
  const coefficientOfVariation = Math.sqrt(variance) / average
  return Math.max(0, Math.min(1, 1 - coefficientOfVariation))
}

function formatMonthDay(value?: string | null) {
  if (!value) {
    return ''
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return `${match[2]}-${match[3]}`
  }
  return value
}

function formatDate(value?: string | null) {
  if (!value) {
    return ''
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }
  return value
}

function formatListingAgeDays(value?: string | null, planDate?: string | null) {
  const listingDate = parseIsoDate(value)
  const currentDate = parseIsoDate(planDate) || parseIsoDate(todayIsoDate())
  if (!listingDate || !currentDate) {
    return ''
  }
  const days = Math.max(0, Math.floor((currentDate.getTime() - listingDate.getTime()) / 86400000))
  return ` ${days}天`
}

function formatEtaDistanceDays(value?: string | null, planDate?: string | null) {
  const etaDate = parseIsoDate(value)
  const currentDate = parseIsoDate(planDate) || parseIsoDate(todayIsoDate())
  if (!etaDate || !currentDate) {
    return ''
  }
  const days = Math.round((etaDate.getTime() - currentDate.getTime()) / 86400000)
  if (days === 0) {
    return '今天'
  }
  return days > 0 ? `${days}天后` : `${Math.abs(days)}天前`
}

function todayIsoDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseIsoDate(value?: string | null) {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) {
    return null
  }
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

function numericQuantity(value?: ReplenishmentQuantity | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
