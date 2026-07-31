import { ReloadOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, Input, InputNumber, Modal, Select, Space, Spin, Table, Typography } from 'antd'
import type { PurchaseDraftQuantity, PurchaseDraftRow } from '../purchaseDrafts'
import type { ReplenishmentPlanItem } from '../types'
import { BATCH_PURCHASE_OPENING_KEY, type ProductCoverageFilter, type PurchaseDraftTransportKey, type SuggestionFilter } from '../pageTypes'
import { openMissingEtaOverviewMaintenance, summarizeBlockingReasons } from '../replenishmentDomain'
import { formatQuantity } from '../replenishmentFormatting'
import { renderPurchaseProgressSummary } from './replenishmentPresentation'
import { useReplenishmentColumns } from '../hooks/useReplenishmentColumns'
import type { useReplenishmentPlanController } from '../hooks/useReplenishmentPlanController'

const { Text } = Typography

export function ReplenishmentPlanWorkbench({ state }: {
  state: ReturnType<typeof useReplenishmentPlanController>
}) {
  const {
    overview, loading, errorMessage, searchKeyword, setSearchKeyword, suggestionFilter, setSuggestionFilter,
    coverageFilter, setCoverageFilter,
    selectedRowKeys, selectedPurchaseRows, ordersLoading, openingPurchaseKey, purchaseModalOpen,
    purchaseDrafts, setPurchaseDrafts, selectedOrderId, setSelectedOrderId, submitting,
    previewImage, setPreviewImage, purchaseDuplicateNotice, filteredRows, suggestionSummary,
    missingEtaSummary, blockedRows, pastEtaReviewCount, editableOrders,
    purchaseProgressSummary, refreshReplenishmentPlan, openPurchaseModal,
    closePurchaseModal, submitPurchaseDrafts, handleSelectedRowsChange
  } = state
  const coverage = overview?.coverage
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
  const renderCoverageFilterButton = (
    filter: ProductCoverageFilter,
    label: string,
    count: number
  ) => (
    <button
      type="button"
      className={coverageFilter === filter
        ? 'replenishment-plan-summary-filter is-active'
        : 'replenishment-plan-summary-filter'}
      aria-pressed={coverageFilter === filter}
      onClick={() => {
        setCoverageFilter(filter)
        setSuggestionFilter('all')
      }}
    >
      <span>{label}</span>
      <strong>{formatQuantity(count)}</strong>
    </button>
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

  const columns = useReplenishmentColumns(state)

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
          {coverage ? (
            <div className="replenishment-plan-summary-bar replenishment-plan-coverage-summary">
              {renderCoverageFilterButton('all', '全部商品', coverage.totalProductCount)}
              {renderCoverageFilterButton('active', '在售商品', coverage.activeProductCount)}
              {renderCoverageFilterButton('inactive', '已停用', coverage.inactiveProductCount)}
              {renderCoverageFilterButton('unknown', '待核实', coverage.unknownProductCount)}
              <span className="replenishment-plan-forecasted-count">
                参与预测 <strong>{formatQuantity(coverage.forecastedProductCount)}</strong>
              </span>
            </div>
          ) : null}
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
      {coverage?.unknownProductCount ? (
        <Alert
          className="replenishment-plan-active-state-alert"
          type="warning"
          showIcon
          message={`${coverage.unknownProductCount} 个商品在售状态待核实`}
          description="状态仅用于提示，不影响补货测算。"
        />
      ) : null}
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

}
