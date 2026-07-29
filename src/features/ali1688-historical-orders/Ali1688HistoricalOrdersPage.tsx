import { Button } from 'antd'
import { type ReactNode, useState } from 'react'
import type { Ali1688HistoricalOrderDetail } from './types'
import type {
  Ali1688HistoricalOrdersPageProps,
  ProductLineRow
} from './model/pageTypes'
import { canSubmitAssignment } from './model/assignmentQuantities'
import { findSelectedDetailItem } from './presentation/orderContextCells'
import { useAli1688AssignmentRecords } from './hooks/useAli1688AssignmentRecords'
import { useAli1688AssignmentWorkflow } from './hooks/useAli1688AssignmentWorkflow'
import { useAli1688HistoricalOrdersWorkbench } from './hooks/useAli1688HistoricalOrdersWorkbench'
import { useAli1688ImportHistory } from './hooks/useAli1688ImportHistory'
import { useAli1688OrderDeletion } from './hooks/useAli1688OrderDeletion'
import { useAli1688ProductLinkWorkflow } from './hooks/useAli1688ProductLinkWorkflow'
import { Ali1688AssignmentRecords } from './components/Ali1688AssignmentRecords'
import { Ali1688HistoricalOrderActionModals } from './components/Ali1688HistoricalOrderActionModals'
import { Ali1688HistoricalOrderDrawers } from './components/Ali1688HistoricalOrderDrawers'
import { Ali1688HistoricalOrdersPanel } from './components/Ali1688HistoricalOrdersPanel'
import './Ali1688HistoricalOrdersPage.css'

export function Ali1688HistoricalOrdersPage({
  storeCode,
  siteCode,
  operatorRoleName,
  availableStores
}: Ali1688HistoricalOrdersPageProps) {
  const workbenchState = useAli1688HistoricalOrdersWorkbench({
    storeCode,
    siteCode,
    operatorRoleName,
    availableStores
  })
  const importState = useAli1688ImportHistory()
  const [selectedOrder, setSelectedOrder] =
    useState<Ali1688HistoricalOrderDetail | null>(null)
  const [selectedLineItemId, setSelectedLineItemId] = useState<string>()
  const detailLoading = false
  const selectedDetailItem = selectedOrder
    ? findSelectedDetailItem(selectedOrder, selectedLineItemId)
    : undefined

  const productLinkState = useAli1688ProductLinkWorkflow({
    canMutateProductLinks: workbenchState.canMutateProductLinks,
    query: workbenchState.query,
    reloadWorkbench: workbenchState.loadWorkbench,
    clearSelectedLines: () => workbenchState.setSelectedLineKeys([]),
    closeAction: closeProductAction
  })
  const assignmentState = useAli1688AssignmentWorkflow({
    assignmentTargetOptions: workbenchState.assignmentTargetOptions,
    canMutateProductLinks: workbenchState.canMutateProductLinks,
    query: workbenchState.query,
    reloadWorkbench: workbenchState.loadWorkbench,
    clearSelectedLines: () => workbenchState.setSelectedLineKeys([]),
    initializeProductRows: productLinkState.initializeProductActionRows,
    continueProductRows: productLinkState.continueAfterAssignment,
    resetProductRows: productLinkState.resetProductLinkState
  })
  const deletionState = useAli1688OrderDeletion({
    query: workbenchState.query,
    reloadWorkbench: workbenchState.loadWorkbench,
    clearSelectedLines: () => workbenchState.setSelectedLineKeys([])
  })
  const assignmentRecordsState = useAli1688AssignmentRecords({
    selectedDetailItem,
    query: workbenchState.query,
    reloadWorkbench: workbenchState.loadWorkbench
  })

  return (
    <section className="ali1688-historical-orders-page" data-testid="ali1688-historical-orders-page">
      <Ali1688HistoricalOrdersPanel
        state={workbenchState}
        openImportHistory={importState.openImportHistory}
        openProductActionModalForRows={assignmentState.openProductActionModalForRows}
        openProductActionModal={openProductActionModal}
        openDeleteOrderModal={deletionState.openDeleteOrderModal}
      />
      <Ali1688HistoricalOrderDrawers
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
        setSelectedLineItemId={setSelectedLineItemId}
        selectedDetailItem={selectedDetailItem}
        detailLoading={detailLoading}
        assignmentTargetOptions={workbenchState.assignmentTargetOptions}
        assignmentRecordsNode={
          <Ali1688AssignmentRecords
            assignmentRecords={assignmentRecordsState.assignmentRecords}
            assignmentRecordsLoading={assignmentRecordsState.assignmentRecordsLoading}
            assignmentRecordQuantities={assignmentRecordsState.assignmentRecordQuantities}
            assignmentRecordUpdatingId={assignmentRecordsState.assignmentRecordUpdatingId}
            updateAssignmentRecordQuantity={assignmentRecordsState.updateAssignmentRecordQuantity}
            submitAssignmentRecordAdjustment={assignmentRecordsState.submitAssignmentRecordAdjustment}
            submitAssignmentRecordRevoke={assignmentRecordsState.submitAssignmentRecordRevoke}
          />
        }
        resetAssignmentRecords={assignmentRecordsState.resetAssignmentRecords}
        importState={importState}
      />
      <Ali1688HistoricalOrderActionModals
        workbenchState={workbenchState}
        assignmentState={assignmentState}
        productLinkState={productLinkState}
        deletionState={deletionState}
        actionModalFooter={renderActionModalFooter()}
        submitProductUnlinkFromModal={submitProductUnlinkFromModal}
        importHistoryOpen={importState.importHistoryOpen}
        loadImportHistory={importState.loadImportHistory}
      />
    </section>
  )

  function closeProductAction() {
    assignmentState.closeActionModal()
  }

  async function openProductActionModal(row: ProductLineRow) {
    await assignmentState.openProductActionModalForRows([row])
  }

  async function submitProductUnlinkFromModal(assignmentId?: number) {
    if (await productLinkState.submitProductUnlink(assignmentId)) {
      assignmentState.closeActionModal()
    }
  }

  function renderActionModalFooter() {
    const footerButtons: ReactNode[] = [
      <Button key="cancel" onClick={assignmentState.closeActionModal}>
        取消
      </Button>
    ]
    if (assignmentState.canAssignActionProductRows) {
      footerButtons.push(
        <Button
          key="assign"
          type={workbenchState.canMutateProductLinks ? 'default' : 'primary'}
          loading={assignmentState.assigning}
          disabled={!canSubmitAssignment(
            assignmentState.actionProductLineRows,
            assignmentState.assignmentTargetValues,
            assignmentState.assignmentTargetQuantities
          )}
          onClick={() => void assignmentState.submitAssignment()}
        >
          确认分配
        </Button>
      )
    }
    if (assignmentState.canAssignActionProductRows && workbenchState.canMutateProductLinks) {
      footerButtons.push(
        <Button
          key="assign-and-link"
          type={assignmentState.canLinkActionProductRows ? 'default' : 'primary'}
          loading={assignmentState.assigning}
          disabled={!assignmentState.canContinueAssignmentToProductLink}
          onClick={() => void assignmentState.submitAssignment({ keepOpenForLink: true })}
        >
          保存分配并继续关联
        </Button>
      )
    }
    if (productLinkState.canMarkDiscontinuedActionRows) {
      footerButtons.push(
        <Button
          key="mark-discontinued"
          danger
          loading={productLinkState.markingDiscontinued}
          disabled={productLinkState.productLinkSubmitting}
          onClick={() => void productLinkState.submitMarkDiscontinuedFromProductLink()}
        >
          标记下架数据
        </Button>
      )
    }
    if (workbenchState.canMutateProductLinks && assignmentState.canLinkActionProductRows) {
      footerButtons.push(
        <Button
          key="link"
          type="primary"
          loading={productLinkState.productLinkSubmitting}
          disabled={!productLinkState.selectedProductCandidate}
          onClick={() => void productLinkState.submitProductLink()}
        >
          确认关联
        </Button>
      )
    }
    return footerButtons
  }

}
