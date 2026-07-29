import {
  Alert,
  Button,
  Checkbox,
  Drawer,
  Input,
  InputNumber,
  Modal,
  Space,
  Tooltip,
  Typography
} from 'antd'
import type { Ali1688SkuPurchaseHistoryItem } from '../../ali1688-historical-orders/types'
import { usePurchaseBatchEditor } from '../hooks/usePurchaseBatchEditor'
import type { PurchaseBatch } from '../model/pageTypes'
import {
  displayText,
  formatCurrency,
  formatNumberText,
  normalizeNullableInteger,
  normalizeNullableNumber,
  purchaseBatchOrderNos,
  purchaseBatchUnitPrice,
  sourceMatchRejectionMessage
} from '../model/purchaseBatchMetrics'

const { Text } = Typography

export function PurchaseBatchDrawer({
  record,
  batches,
  onClose,
  onSaveBatches
}: {
  record: Ali1688SkuPurchaseHistoryItem | null
  batches: PurchaseBatch[]
  onClose: () => void
  onSaveBatches: (
    record: Ali1688SkuPurchaseHistoryItem,
    batches: PurchaseBatch[]
  ) => Promise<void>
}) {
  const editor = usePurchaseBatchEditor({ record, batches, onClose, onSaveBatches })
  const {
    selectedSourceKeys, draftBatches, saving, sourceMatchForm,
    sourceMatchPreview, sourceMatchLoading, sourceMatchSaving, sources,
    selectedKeySet, metrics, sourceMatchBatch, sourceMatchCandidate,
    toggleSource, mergeSelectedSources, updateDraftBatch, openSourceMatch,
    closeSourceMatch, updateSourceMatchForm, previewSourceMatch,
    saveSourceMatch, saveDraftBatches
  } = editor

  return (
    <Drawer
      title={`采购批次 · ${displayText(record?.skuParent)}`}
      open={Boolean(record)}
      onClose={onClose}
      width={1120}
      destroyOnClose
    >
      {record ? (
        <div className="ali1688-sku-batch-drawer">
          <div className="ali1688-sku-batch-toolbar">
            <Text strong>
              批次汇总: 采购次数 {metrics.purchaseCount} · 总费用 {formatCurrency(metrics.totalCost)} · 总件数{' '}
              {formatNumberText(metrics.totalQuantity)}
            </Text>
            <Space>
              <Button onClick={mergeSelectedSources} disabled={!selectedSourceKeys.length}>
                合并为批次
              </Button>
              <Button aria-label="保存" type="primary" loading={saving} onClick={() => void saveDraftBatches()}>
                保存
              </Button>
              <Button aria-label="关闭" onClick={onClose}>关闭</Button>
            </Space>
          </div>

          <section className="ali1688-sku-batch-section">
            <Text strong>来源订单</Text>
            <div className="ali1688-sku-batch-table-wrap" data-testid="sku-purchase-batch-source-table">
              <table className="ali1688-sku-batch-table">
                <thead>
                  <tr>
                    <th aria-label="选择订单" />
                    <th>订单号</th><th>采购时间</th><th>供应商</th>
                    <th>原始数量</th><th>原始成本</th><th>原始单价</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <tr key={source.key}>
                      <td>
                        <Checkbox
                          aria-label={`选择 ${displayText(source.orderNo)}`}
                          checked={selectedKeySet.has(source.key)}
                          onChange={(event) => toggleSource(source.key, event.target.checked)}
                        />
                      </td>
                      <td>{displayText(source.orderNo)}</td>
                      <td>{displayText(source.orderTime)}</td>
                      <td>{displayText(source.supplierName)}</td>
                      <td>{formatNumberText(source.assignedQuantity)}</td>
                      <td>{formatCurrency(source.allocatedCost)}</td>
                      <td>{formatCurrency(source.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="ali1688-sku-batch-section">
            <Text strong>采购批次</Text>
            <div className="ali1688-sku-batch-table-wrap">
              <table className="ali1688-sku-batch-table ali1688-sku-batch-edit-table">
                <thead>
                  <tr>
                    <th>批次</th><th>来源订单</th><th>计入 SKU 数量</th>
                    <th>计入 SKU 成本</th><th>批次单价</th><th>备注</th><th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {draftBatches.map((batch) => (
                    <tr key={batch.id}>
                      <td>
                        <Text strong>{batch.label}</Text>
                        <Text type="secondary" className="ali1688-sku-batch-order-count">
                          {batch.sources.length} 单
                        </Text>
                      </td>
                      <td>{displayText(purchaseBatchOrderNos(batch).join('、'))}</td>
                      <td>
                        <InputNumber
                          aria-label={`${batch.label} 计入 SKU 数量`}
                          min={0}
                          precision={0}
                          step={1}
                          value={batch.countedQuantity ?? undefined}
                          onChange={(value) => updateDraftBatch(batch.id, {
                            countedQuantity: normalizeNullableInteger(value)
                          })}
                        />
                      </td>
                      <td>
                        <InputNumber
                          aria-label={`${batch.label} 计入 SKU 成本`}
                          min={0}
                          precision={2}
                          value={batch.countedCost ?? undefined}
                          onChange={(value) => updateDraftBatch(batch.id, {
                            countedCost: normalizeNullableNumber(value)
                          })}
                        />
                      </td>
                      <td>{formatCurrency(purchaseBatchUnitPrice(batch))}</td>
                      <td>
                        <Input
                          aria-label={`${batch.label} 备注`}
                          value={batch.note || ''}
                          onChange={(event) => updateDraftBatch(batch.id, { note: event.target.value })}
                        />
                      </td>
                      <td>
                        <Tooltip title={batch.batchId ? '匹配 1688 历史订单来源' : '新批次需先保存并刷新后再匹配来源'}>
                          <span>
                            <Button size="small" disabled={!batch.batchId} onClick={() => openSourceMatch(batch)}>
                              匹配来源
                            </Button>
                          </span>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <Modal
            title={`匹配 1688 来源 · ${displayText(sourceMatchBatch?.label)}`}
            open={Boolean(sourceMatchBatch)}
            okText="保存来源"
            cancelText="关闭"
            width={720}
            destroyOnClose
            confirmLoading={sourceMatchSaving}
            okButtonProps={{ disabled: !sourceMatchCandidate }}
            onOk={() => void saveSourceMatch()}
            onCancel={closeSourceMatch}
          >
            <div className="ali1688-sku-source-match-modal">
              <div className="ali1688-sku-source-match-form">
                <label>
                  <Text type="secondary">订单号</Text>
                  <Input
                    aria-label="匹配订单号"
                    value={sourceMatchForm.orderNo}
                    onChange={(event) => updateSourceMatchForm('orderNo', event.target.value)}
                  />
                </label>
                <label>
                  <Text type="secondary">offer_id</Text>
                  <Input
                    aria-label="匹配 offer_id"
                    value={sourceMatchForm.offerId}
                    onChange={(event) => updateSourceMatchForm('offerId', event.target.value)}
                  />
                </label>
                <label>
                  <Text type="secondary">sku_id</Text>
                  <Input
                    aria-label="匹配 sku_id"
                    value={sourceMatchForm.skuId}
                    onChange={(event) => updateSourceMatchForm('skuId', event.target.value)}
                  />
                </label>
                <Button
                  type="primary"
                  loading={sourceMatchLoading}
                  disabled={!sourceMatchBatch?.batchId}
                  onClick={() => void previewSourceMatch()}
                >
                  预览匹配
                </Button>
              </div>
              {sourceMatchPreview?.rejectionReason ? (
                <Alert
                  type="warning"
                  showIcon
                  message={sourceMatchRejectionMessage(sourceMatchPreview.rejectionReason)}
                />
              ) : null}
              {sourceMatchCandidate ? (
                <div className="ali1688-sku-source-match-candidate">
                  <Text strong>唯一命中来源</Text>
                  <dl>
                    <div><dt>订单号</dt><dd>{displayText(sourceMatchCandidate.orderNo)}</dd></div>
                    <div><dt>采购时间</dt><dd>{displayText(sourceMatchCandidate.orderTime)}</dd></div>
                    <div><dt>供应商</dt><dd>{displayText(sourceMatchCandidate.supplierName)}</dd></div>
                    <div><dt>分配数量</dt><dd>{formatNumberText(sourceMatchCandidate.assignedQuantity)}</dd></div>
                  </dl>
                </div>
              ) : null}
            </div>
          </Modal>
        </div>
      ) : null}
    </Drawer>
  )
}
