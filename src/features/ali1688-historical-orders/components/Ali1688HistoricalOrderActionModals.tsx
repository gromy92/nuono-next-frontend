import { Button, Input, InputNumber, List, Modal, Space, Table, Typography } from 'antd'
import type { ReactNode } from 'react'
import type { ProductLineRow } from '../model/pageTypes'
import {
  assignmentTargetDescription,
  isDiscontinuedTarget,
  isStorelessFullLineTarget
} from '../model/assignmentTargets'
import {
  assignmentMaxQuantity,
  assignmentQuantityKey
} from '../model/assignmentQuantities'
import { compactJoin } from '../presentation/orderText'
import type { useAli1688AssignmentWorkflow } from '../hooks/useAli1688AssignmentWorkflow'
import type { useAli1688HistoricalOrdersWorkbench } from '../hooks/useAli1688HistoricalOrdersWorkbench'
import type { useAli1688OrderDeletion } from '../hooks/useAli1688OrderDeletion'
import type { useAli1688ProductLinkWorkflow } from '../hooks/useAli1688ProductLinkWorkflow'
import { Ali1688AuthorizationModal } from './Ali1688AuthorizationModal'
import { Ali1688ExcelImportModal } from './Ali1688ExcelImportModal'
import { Ali1688ProductLinkEditor } from './Ali1688ProductLinkEditor'

const { Text } = Typography

interface Ali1688HistoricalOrderActionModalsProps {
  workbenchState: ReturnType<typeof useAli1688HistoricalOrdersWorkbench>
  assignmentState: ReturnType<typeof useAli1688AssignmentWorkflow>
  productLinkState: ReturnType<typeof useAli1688ProductLinkWorkflow>
  deletionState: ReturnType<typeof useAli1688OrderDeletion>
  actionModalFooter: ReactNode
  submitProductUnlinkFromModal: (assignmentId?: number) => Promise<void>
  importHistoryOpen: boolean
  loadImportHistory: (resetDetail: boolean) => Promise<void>
}

export function Ali1688HistoricalOrderActionModals({
  workbenchState,
  assignmentState,
  productLinkState,
  deletionState,
  actionModalFooter,
  submitProductUnlinkFromModal,
  importHistoryOpen,
  loadImportHistory
}: Ali1688HistoricalOrderActionModalsProps) {
  const {
    assignmentModalOpen,
    actionProductLineRows,
    assignmentTargetValues,
    assignmentTargetQuantities,
    selectedAssignmentTargetOptions,
    canAssignActionProductRows,
    canLinkActionProductRows,
    toggleAssignmentTargetValue,
    updateAssignmentTargetQuantity,
    closeActionModal
  } = assignmentState
  const {
    productLinkRow,
    productLinkRows,
    productLinkCandidates,
    productLinkStatusFilter,
    productLinkSearch,
    setProductLinkSearch,
    selectedProductCandidate,
    setSelectedProductCandidate,
    productLinkUnlinkingAssignmentId,
    filteredProductLinkCandidates,
    canShowProductCandidateSearch,
    changeProductLinkStatusFilter,
    productLinkLoading
  } = productLinkState
  const {
    deleteOrderTarget,
    setDeleteOrderTarget,
    deleteOrderReason,
    setDeleteOrderReason,
    deleteOrderSubmitting,
    submitDeleteOrder
  } = deletionState
  const {
    assignmentTargetOptions,
    canMutateProductLinks,
    authorizationModalOpen,
    setAuthorizationModalOpen,
    excelImportModalOpen,
    setExcelImportModalOpen,
    authorizationSubmitting,
    authorizationErrorMessage,
    setAuthorizationErrorMessage,
    confirmOpenApiAuthorization,
    loadWorkbench,
    query
  } = workbenchState

  return (
    <>
      <Modal
        title="分配/关联"
        open={assignmentModalOpen}
        onCancel={closeActionModal}
        footer={actionModalFooter}
        width={1180}
        destroyOnClose
      >
        <Space direction="vertical" size={14} className="ali1688-assignment-modal ali1688-product-action-modal">
          {canAssignActionProductRows ? (
            <>
              <Text type="secondary">
                {actionProductLineRows.length === 1
                  ? '单个货品可拆分到多个店铺，请为每个店铺填写数量。'
                  : '多选货品可拆分到多个店铺，请为每个店铺和货品填写数量。'}
              </Text>
              <div className="ali1688-assignment-target-options" role="group" aria-label="目标店铺">
                {assignmentTargetOptions.map((option) => (
                  <Button
                    key={option.value}
                    size="small"
                    type={assignmentTargetValues.includes(option.value) ? 'primary' : 'default'}
                    danger={isDiscontinuedTarget(option)}
                    aria-pressed={assignmentTargetValues.includes(option.value)}
                    className="ali1688-assignment-target-option"
                    onClick={() => toggleAssignmentTargetValue(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              {selectedAssignmentTargetOptions.some(isStorelessFullLineTarget) ? (
                <List
                  size="small"
                  dataSource={actionProductLineRows}
                  renderItem={(row) => (
                    <List.Item>
                      <List.Item.Meta
                        title={<Text>{row.item?.title || '未返回'}</Text>}
                        description={
                          <Text type="secondary">
                            标记为{assignmentTargetDescription(selectedAssignmentTargetOptions[0])}，使用整条货品行数量 {assignmentMaxQuantity(row)}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Table
                  className="ali1688-assignment-matrix"
                  size="small"
                  pagination={false}
                  rowKey={(row) => row.lineKey}
                  dataSource={actionProductLineRows}
                  columns={[
                    {
                      title: '商品',
                      key: 'product',
                      width: 360,
                      render: (_, row: ProductLineRow) => (
                        <Space direction="vertical" size={2} className="ali1688-assignment-product-cell">
                          <Text strong className="ali1688-assignment-product-title">{row.item?.title || '未返回'}</Text>
                          <Text type="secondary">{compactJoin([`剩余 ${assignmentMaxQuantity(row)}`, row.order.orderNo], ' · ')}</Text>
                        </Space>
                      )
                    },
                    ...selectedAssignmentTargetOptions.map((target) => ({
                      title: target.label,
                      key: target.value,
                      width: 150,
                      render: (_: unknown, row: ProductLineRow) => (
                        <InputNumber
                          aria-label={`分配数量 ${target.label} ${row.item?.title || '未返回'}`}
                          min={0}
                          max={assignmentMaxQuantity(row)}
                          value={assignmentTargetQuantities[assignmentQuantityKey(target.value, row)]}
                          onChange={(value) => updateAssignmentTargetQuantity(target.value, row, value)}
                        />
                      )
                    }))
                  ]}
                  scroll={{ x: Math.max(520, 360 + selectedAssignmentTargetOptions.length * 150) }}
                />
              )}
            </>
          ) : null}
          {canMutateProductLinks ? (
            <Ali1688ProductLinkEditor
              productLinkRows={productLinkRows}
              canLinkActionProductRows={canLinkActionProductRows}
              productLinkRow={productLinkRow}
              canMutateProductLinks={canMutateProductLinks}
              productLinkUnlinkingAssignmentId={productLinkUnlinkingAssignmentId}
              submitProductUnlinkFromModal={submitProductUnlinkFromModal}
              canShowProductCandidateSearch={canShowProductCandidateSearch}
              productLinkSearch={productLinkSearch}
              setProductLinkSearch={setProductLinkSearch}
              selectedProductCandidate={selectedProductCandidate}
              setSelectedProductCandidate={setSelectedProductCandidate}
              productLinkStatusFilter={productLinkStatusFilter}
              changeProductLinkStatusFilter={changeProductLinkStatusFilter}
              productLinkLoading={productLinkLoading}
              filteredProductLinkCandidates={filteredProductLinkCandidates}
              productLinkCandidateCount={productLinkCandidates.length}
            />
          ) : null}
        </Space>
      </Modal>

      <Modal
        title="删除订单"
        open={Boolean(deleteOrderTarget)}
        onCancel={() => {
          setDeleteOrderTarget(null)
          setDeleteOrderReason('不属于任何店铺')
        }}
        onOk={() => void submitDeleteOrder()}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true, disabled: !deleteOrderReason.trim() }}
        confirmLoading={deleteOrderSubmitting}
        destroyOnClose
      >
        <Space direction="vertical" size={12} className="ali1688-delete-order-modal">
          <Text strong>{deleteOrderTarget?.orderNo || deleteOrderTarget?.id || '-'}</Text>
          <Input
            aria-label="删除原因"
            value={deleteOrderReason}
            onChange={(event) => setDeleteOrderReason(event.target.value)}
          />
        </Space>
      </Modal>

      <Ali1688AuthorizationModal
        open={authorizationModalOpen}
        submitting={authorizationSubmitting}
        errorMessage={authorizationErrorMessage}
        onCancel={() => {
          setAuthorizationErrorMessage(undefined)
          setAuthorizationModalOpen(false)
        }}
        onConfirm={() => void confirmOpenApiAuthorization()}
      />
      <Ali1688ExcelImportModal
        open={excelImportModalOpen}
        onClose={() => setExcelImportModalOpen(false)}
        onImported={async () => {
          await loadWorkbench({ ...query, page: 1 })
          if (importHistoryOpen) await loadImportHistory(false)
        }}
      />
    </>
  )
}
