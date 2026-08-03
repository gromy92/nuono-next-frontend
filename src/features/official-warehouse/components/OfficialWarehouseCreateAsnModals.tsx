import { SearchOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, Input, InputNumber, Modal, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dispatch, Key, SetStateAction } from 'react'
import type {
  OfficialWarehouseBatchProductSummary,
  OfficialWarehouseProductCandidate,
  OfficialWarehouseShippingBatchCandidate
} from '../api'
import { OfficialWarehouseBatchSummaryPanel } from './OfficialWarehouseBatchSummaryPanel'
import { OfficialWarehouseShippingBatchPicker } from './OfficialWarehouseShippingBatchPicker'
import {
  displayPsku,
  officialWarehouseCandidateKey,
  shippingBatchDisplayNo
} from '../officialWarehouseCandidatePresentation'
import type {
  Ali1688SpecDraft,
  CreateAsnConfirmation,
  CreateAsnSubmitFeedback
} from '../officialWarehouseFormModel'

const { Text } = Typography

type Props = {
  createOpen: boolean
  setCreateOpen: Dispatch<SetStateAction<boolean>>
  createSubmitFeedback?: CreateAsnSubmitFeedback
  setCreateSubmitFeedback: Dispatch<SetStateAction<CreateAsnSubmitFeedback | undefined>>
  createAsnConfirmation?: CreateAsnConfirmation
  setCreateAsnConfirmation: Dispatch<SetStateAction<CreateAsnConfirmation | undefined>>
  submitCreateAsn: () => Promise<void>
  submitting: boolean
  selectedAlreadyAppointedBatches: OfficialWarehouseShippingBatchCandidate[]
  shippingBatchLoadError?: string
  loadShippingBatches: (keyword?: string, prepareProductMatches?: boolean, forceRefresh?: boolean) => Promise<void>
  shippingBatchKeyword: string
  shippingBatchLoading: boolean
  shippingBatches: OfficialWarehouseShippingBatchCandidate[]
  selectedShippingBatchIds: string[]
  batchSummary?: OfficialWarehouseBatchProductSummary
  batchSummaryLoading: boolean
  batchSummaryError?: string
  reloadBatchSummary: () => Promise<void>
  batchSummaryBlocked: boolean
  setSelectedShippingBatchIds: Dispatch<SetStateAction<string[]>>
  shippingBatchOptions: Array<{ label: string; value: string }>
  handleShippingBatchSearch: (value: string) => void
  clearCandidateSelection: () => void
  setQuantityByCandidateKey: Dispatch<SetStateAction<Record<string, number>>>
  loadCandidates: (batchIds?: string[], keywordValue?: string) => Promise<void>
  candidateKeyword: string
  setCandidateKeyword: Dispatch<SetStateAction<string>>
  candidateLoading: boolean
  selectedCandidateKeys: Key[]
  candidateColumns: ColumnsType<OfficialWarehouseProductCandidate>
  candidates: OfficialWarehouseProductCandidate[]
  updateCandidateSelection: (keys: Key[], rows: OfficialWarehouseProductCandidate[]) => void
  candidateEmptyDescription: string
  confirmCreateAsn: () => void
  specTarget?: OfficialWarehouseProductCandidate
  setSpecTarget: Dispatch<SetStateAction<OfficialWarehouseProductCandidate | undefined>>
  saveAli1688Spec: () => Promise<void>
  specSaving: boolean
  specDraft: Ali1688SpecDraft
  setSpecDraft: Dispatch<SetStateAction<Ali1688SpecDraft>>
}

export function OfficialWarehouseCreateAsnModals(props: Props) {
  const {
    createOpen, setCreateOpen, createSubmitFeedback, setCreateSubmitFeedback,
    createAsnConfirmation, setCreateAsnConfirmation, submitCreateAsn, submitting,
    selectedAlreadyAppointedBatches, shippingBatchLoadError, loadShippingBatches,
    shippingBatchKeyword, shippingBatchLoading, shippingBatches,
    selectedShippingBatchIds, setSelectedShippingBatchIds, shippingBatchOptions,
    batchSummary, batchSummaryLoading, batchSummaryError, reloadBatchSummary, batchSummaryBlocked,
    handleShippingBatchSearch, clearCandidateSelection, setQuantityByCandidateKey,
    loadCandidates, candidateKeyword, setCandidateKeyword, candidateLoading,
    selectedCandidateKeys, candidateColumns, candidates, updateCandidateSelection,
    candidateEmptyDescription, confirmCreateAsn, specTarget, setSpecTarget,
    saveAli1688Spec, specSaving, specDraft, setSpecDraft
  } = props
  return (
    <>
      <Modal
        title="选择商品创建 Noon ASN"
        open={createOpen}
        width={1040}
        onCancel={() => {
          setCreateOpen(false)
          setCreateSubmitFeedback(undefined)
          setCreateAsnConfirmation(undefined)
        }}
        onOk={() => void submitCreateAsn()}
        confirmLoading={submitting}
        okText="创建 ASN"
        okButtonProps={{ disabled: batchSummaryBlocked || Boolean(createSubmitFeedback?.problem?.partialSuccess) }}
        destroyOnClose
      >
        <div className="official-warehouse-modal-body">
          {createSubmitFeedback ? (
            <Alert
              type="error"
              showIcon
              message={createSubmitFeedback.message}
              description={[
                createSubmitFeedback.problem?.reference
                  ? `业务参考：${createSubmitFeedback.problem.reference}`
                  : '',
                createSubmitFeedback.problem?.partialSuccess
                  ? 'Noon 侧已产生业务数据，系统已禁用重复创建；请关闭弹窗后在 ASN 列表确认。'
                  : createSubmitFeedback.problem?.retryable
                    ? '可在确认 Noon 状态后重试。'
                    : createSubmitFeedback.problem
                      ? '请按提示处理后再提交。'
                      : ''
              ].filter(Boolean).join('；') || undefined}
            />
          ) : null}
          {selectedAlreadyAppointedBatches.length ? (
            <Alert
              type="warning"
              showIcon
              message="所选物流批次已约过仓，仍可继续使用"
              description={`批次 ${selectedAlreadyAppointedBatches.map(shippingBatchDisplayNo).join('、')} 再次创建 ASN 前会要求确认，请核对本次商品和数量。`}
            />
          ) : null}
          <OfficialWarehouseShippingBatchPicker
            error={shippingBatchLoadError}
            loadBatches={loadShippingBatches}
            keyword={shippingBatchKeyword}
            loading={shippingBatchLoading}
            batches={shippingBatches}
            selectedIds={selectedShippingBatchIds}
            options={shippingBatchOptions}
            onSearch={handleShippingBatchSearch}
            onChange={(nextBatchIds) => {
                setSelectedShippingBatchIds(nextBatchIds)
                clearCandidateSelection()
                setQuantityByCandidateKey({})
                void loadCandidates(nextBatchIds, candidateKeyword)
            }}
          />
          <OfficialWarehouseBatchSummaryPanel selectedBatchCount={selectedShippingBatchIds.length} summary={batchSummary} loading={batchSummaryLoading} error={batchSummaryError} onRetry={() => void reloadBatchSummary()} />
          <div className="official-warehouse-toolbar official-warehouse-modal-toolbar">
            <div className="official-warehouse-toolbar-left">
              <Input.TextArea
                className="official-warehouse-search"
                allowClear
                autoSize={{ minRows: 1, maxRows: 3 }}
                placeholder="搜索 SKU / 批量粘贴 PSKU / 中文标题 / 英文标题"
                value={candidateKeyword}
                onChange={(event) => setCandidateKeyword(event.target.value)}
              />
              <Button
                icon={<SearchOutlined />}
                onClick={() => void loadCandidates(selectedShippingBatchIds, candidateKeyword)}
                loading={candidateLoading}
              >
                搜索
              </Button>
            </div>
            <Space>
              <Text type="secondary">已选择 {selectedCandidateKeys.length} 个商品</Text>
              <Button size="small" disabled={!selectedCandidateKeys.length} onClick={clearCandidateSelection}>
                清空选择
              </Button>
            </Space>
          </div>
          <Table
            rowKey={officialWarehouseCandidateKey}
            size="small"
            loading={candidateLoading}
            columns={candidateColumns}
            dataSource={candidates}
            pagination={{ pageSize: 20, showSizeChanger: false, hideOnSinglePage: true }}
            scroll={{ x: 1160 }}
            rowSelection={{
              selectedRowKeys: selectedCandidateKeys,
              preserveSelectedRowKeys: true,
              onChange: updateCandidateSelection,
              getCheckboxProps: (row) => ({
                disabled: Boolean(row.missingTags?.length || !row.partnerSku),
                title: row.partnerSku ? undefined : '缺少 PSKU，不能创建 ASN'
              })
            }}
            locale={{
              emptyText: (
                <Empty
                  description={candidateEmptyDescription}
                />
              )
            }}
          />
        </div>
      </Modal>

      <Modal
        title="创建前确认"
        open={Boolean(createAsnConfirmation)}
        onCancel={() => setCreateAsnConfirmation(undefined)}
        onOk={confirmCreateAsn}
        okText="确认继续"
        cancelText="返回补选"
        destroyOnClose
      >
        <Space direction="vertical" size={12}>
          {createAsnConfirmation?.missingBatches.length ? (
            <Alert
              type="warning"
              showIcon
              message="当前选择未覆盖物流批次中的全部待约商品，可能造成漏约。"
              description={createAsnConfirmation.missingBatches.map((batch) => (
                <div key={batch.shippingBatchId || batch.batchNo}>
                  批次 {batch.batchNo || batch.shippingBatchId || '-'} 缺少：
                  {batch.items.map((item) => (
                    `${item.title || item.partnerSku || item.noonSku || '未知商品'}` +
                    `${item.partnerSku ? `（${item.partnerSku}）` : ''} × ${Number(item.missingQuantity || 0).toLocaleString()}`
                  )).join('、')}。
                </div>
              ))}
            />
          ) : null}
          {createAsnConfirmation?.batchNos.length ? (
            <Alert
              type="warning"
              showIcon
              message={`物流批次 ${createAsnConfirmation.batchNos.join('、')} 已经约过仓，将再次创建 Noon ASN。`}
            />
          ) : null}
          <Text>确认继续？</Text>
        </Space>
      </Modal>

      <Modal
        title={specTarget ? `${displayPsku(specTarget)} · 填写 1688 规格` : '填写 1688 规格'}
        open={Boolean(specTarget)}
        width={820}
        onCancel={() => setSpecTarget(undefined)}
        onOk={() => void saveAli1688Spec()}
        confirmLoading={specSaving}
        okText="保存规格"
        cancelText="取消"
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          message="保存到 商品规格 → 1688规格；不会覆盖仓管规格或 Noon 官方规格。"
        />
        <div className="official-warehouse-spec-grid">
          {([
            ['productLengthCm', '产品长（cm）'],
            ['productWidthCm', '产品宽（cm）'],
            ['productHeightCm', '产品高（cm）'],
            ['productWeightG', '产品重量（g）'],
            ['cartonLengthCm', '外箱长（cm）'],
            ['cartonWidthCm', '外箱宽（cm）'],
            ['cartonHeightCm', '外箱高（cm）'],
            ['cartonWeightKg', '外箱重量（kg）'],
            ['cartonQuantity', '箱装数']
          ] as Array<[keyof Ali1688SpecDraft, string]>).map(([field, label]) => (
            <label key={field} className="official-warehouse-spec-field">
              <Text type="secondary">{label}</Text>
              <InputNumber
                min={field === 'cartonQuantity' ? 1 : 0.001}
                precision={field === 'cartonQuantity' ? 0 : 3}
                value={specDraft[field]}
                onChange={(value) => setSpecDraft((current) => ({
                  ...current,
                  [field]: value == null ? undefined : Number(value)
                }))}
              />
            </label>
          ))}
        </div>
      </Modal>


    </>
  )
}
