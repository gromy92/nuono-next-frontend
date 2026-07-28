import { Card, Form, Input, Space } from 'antd'
import { useRef, useState } from 'react'
import { ProductListingDetailEditor } from './ProductListingDetailEditor'
import { ProductListingReviewModal } from './ProductListingReviewModal'
import { ProductListingPageStatus, ProductListingSaveDraftButton, type ProductListingNotice } from './ProductListingPageStatus'
import { ProductListingWorkflowPanel } from './ProductListingWorkflowPanel'
import { ProductListingWorkflowActionButton } from './ProductListingWorkflowActionButton'
import { reopenProductListingReview } from './api'
import { productListingEditorDraftToMetadataValues, type ProductListingMetadataFormValues } from './productDetailAdapter'
import type { ProductListingChangeSummaryItem } from './productListingChangeSummary'
import { completeProductListingReviewReopen } from './productListingReviewReopenCompletion'
import { useProductListingReviewReopenController } from './useProductListingReviewReopen'
import { useProductListingReauthentication } from './useProductListingReauthentication'
import { useProductListingConfirmNotCreated } from './useProductListingConfirmNotCreated'
import { useProductListingDangerousActionPolling } from './useProductListingDangerousActionPolling'
import { useProductListingWorkflowState } from './useProductListingWorkflowState'
import { useProductListingWorkflowSynchronization } from './useProductListingWorkflowSynchronization'
import { useProductListingDraftPersistence } from './useProductListingDraftPersistence'
import { useProductListingReviewActions } from './useProductListingReviewActions'
import { useProductListingRecoveryActions } from './useProductListingRecoveryActions'
import { useProductListingSourcePrefill } from './useProductListingSourcePrefill'
import './ProductListingPage.css'
type ProductListingPageProps = {
  storeCode?: string
}
export function ProductListingPage({ storeCode }: ProductListingPageProps) {
  const [form] = Form.useForm<ProductListingMetadataFormValues>()
  const workflowState = useProductListingWorkflowState({ storeCode, form })
  const {
    listingDraft, setListingDraft, workflow,
    confirmationAwaitingWorkflow, setConfirmationAwaitingWorkflow,
    dangerousActionAwaitingWorkflow, setDangerousActionAwaitingWorkflow,
    workflowIntegrityError, listingDraftRef, workflowIdentityRef, workflowRequestSequenceRef,
    workflowPresentation, editSession, currentDraftId, workflowReadiness,
    updateEditorDraft, applySourcePrefill, applyWorkflow,
    identityMatches, refreshWorkflow
  } = workflowState
  const [saving, setSaving] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [workflowActionBusy, setWorkflowActionBusy] = useState(false)
  const [listingReviewOpen, setListingReviewOpen] = useState(false)
  const [listingReviewChanges, setListingReviewChanges] = useState<ProductListingChangeSummaryItem[]>([])
  const [listingPreparationError, setListingPreparationError] = useState('')
  const [draftSaveNotice, setDraftSaveNotice] = useState<ProductListingNotice>()
  const confirmCommandInFlightRef = useRef(false)
  const recoveryCommandInFlightRef = useRef(false)
  const {
    blocked: sourceHydrationBlocked,
    blockedMessage: hydrationBlockedMessage,
    error: sourceHydrationError,
    prefill: sourcePrefill
  } = useProductListingSourcePrefill({
    storeCode,
    onPrefill: applySourcePrefill
  })
  const reviewReopen = useProductListingReviewReopenController({
    workflow,
    draftId: currentDraftId,
    storeCode: listingDraft.storeCode,
    commandInFlightRef: recoveryCommandInFlightRef,
    reopenReview: reopenProductListingReview,
    refreshWorkflow,
    identityIsCurrent: identityMatches,
    applyReopenedWorkflow: reopenedWorkflow => {
      workflowRequestSequenceRef.current += 1
      return applyWorkflow(reopenedWorkflow)
    },
    onReady: intent =>
      completeProductListingReviewReopen(
        intent,
        () => setListingReviewOpen(false)
      )
  })
  const reauthentication = useProductListingReauthentication({
    workflow,
    draftId: currentDraftId,
    storeCode: listingDraft.storeCode,
    commandInFlightRef: recoveryCommandInFlightRef,
    identityIsCurrent: identityMatches,
    applyWorkflow
  })
  const confirmNotCreated = useProductListingConfirmNotCreated({
    workflow,
    commandInFlightRef: recoveryCommandInFlightRef,
    identityIsCurrent: identityMatches,
    refreshWorkflow, applyWorkflow
  })
  const dangerousActionPolling = useProductListingDangerousActionPolling({
    action: dangerousActionAwaitingWorkflow,
    draftId: currentDraftId,
    workflow,
    refreshWorkflow,
    getExpectedIdentity: () => workflowIdentityRef.current,
    clearAwaiting: () => setDangerousActionAwaitingWorkflow(undefined)
  })
  const validationIssues =
    workflow.dryRunTask?.validationIssues?.length
      ? workflow.dryRunTask.validationIssues
      : workflow.draft?.validationIssues ?? []
  const workflowActionBlockedMessage =
    workflowIntegrityError ||
    hydrationBlockedMessage ||
    (workflowReadiness.locked ? workflowReadiness.blockedMessage : undefined)
  const operationBusy =
    saving ||
    sourceHydrationBlocked ||
    workflowReadiness.locked ||
    preparing ||
    confirming ||
    confirmationAwaitingWorkflow ||
    Boolean(dangerousActionAwaitingWorkflow) ||
    reviewReopen.busy ||
    reauthentication.busy ||
    confirmNotCreated.busy ||
    workflowActionBusy
  const busy = operationBusy || Boolean(workflowIntegrityError)
  useProductListingWorkflowSynchronization({
    storeCode,
    listingDraft,
    workflow,
    currentDraftId,
    confirmationAwaitingWorkflow,
    listingDraftRef,
    workflowIdentityRef,
    updateEditorDraft,
    refreshWorkflow,
    identityMatches,
    markLoadError: workflowReadiness.markLoadError
  })

  const { currentListingDraftFromForm, saveDraftFromForm } =
    useProductListingDraftPersistence({
      form,
      storeCode,
      listingDraftRef,
      currentDraftId,
      workflowIntegrityError,
      sourceHydrationBlocked,
      hydrationBlockedMessage,
      workflowLocked: workflowReadiness.locked,
      workflowBlockedMessage: workflowReadiness.blockedMessage,
      canEditAndSave: editSession.canEditAndSave,
      updateEditorDraft,
      refreshWorkflow,
      setSaving,
      setDraftSaveNotice
    })

  const {
    handleOpenListingReview,
    handleConfirmPublish,
    closeListingReview,
    handleReturnToEdit
  } = useProductListingReviewActions({
    workflow,
    currentDraftId,
    confirming,
    setConfirming,
    confirmationAwaitingWorkflow,
    setConfirmationAwaitingWorkflow,
    sourceHydrationBlocked,
    hydrationBlockedMessage,
    workflowLocked: workflowReadiness.locked,
    workflowBlockedMessage: workflowReadiness.blockedMessage,
    workflowIntegrityError,
    allowPrepare: workflowPresentation.allowPrepare,
    allowCloseReview: workflowPresentation.allowCloseReview,
    canConfirm: editSession.canConfirm,
    canReturnToEdit: editSession.canReturnToEdit,
    reviewReopenBusy: reviewReopen.busy,
    reopenReview: reviewReopen.reopen,
    listingDraftRef,
    sourcePrefillDraft: sourcePrefill?.draft,
    currentListingDraftFromForm,
    saveDraftFromForm,
    refreshWorkflow,
    identityMatches,
    confirmCommandInFlightRef,
    setListingReviewOpen,
    setListingReviewChanges,
    setListingPreparationError,
    setPreparing
  })

  const { handleWorkflowAction } = useProductListingRecoveryActions({
    workflow,
    currentDraftId,
    workflowIntegrityError,
    sourceHydrationBlocked,
    hydrationBlockedMessage,
    workflowLocked: workflowReadiness.locked,
    workflowBlockedMessage: workflowReadiness.blockedMessage,
    dangerousActionAwaitingWorkflow,
    setDangerousActionAwaitingWorkflow,
    reviewReopenAwaiting: reviewReopen.awaiting,
    reopenReview: reviewReopen.reopen,
    openReauthentication: reauthentication.open,
    observeVerification: confirmNotCreated.observeVerification,
    resetDangerousPolling: dangerousActionPolling.reset,
    listingDraftRef,
    recoveryCommandInFlightRef,
    setWorkflowActionBusy,
    setListingReviewOpen,
    handleOpenListingReview,
    closeListingReview,
    refreshWorkflow,
    identityMatches
  })

  return (
    <div className="product-listing-page">
      <ProductListingPageStatus
        draftSaveNotice={draftSaveNotice}
        workflowIntegrityError={workflowIntegrityError}
        sourceHydrationError={sourceHydrationError}
        reauthenticationNotice={reauthentication.notice}
        dangerousActionAwaiting={Boolean(dangerousActionAwaitingWorkflow)}
        reopenAwaiting={reviewReopen.awaiting}
      />

      <Form
        form={form}
        initialValues={productListingEditorDraftToMetadataValues(listingDraft)}
        style={{ display: 'none' }}
      >
        <Form.Item name="sourceType" hidden><Input /></Form.Item>
        <Form.Item name="sourceRefId" hidden><Input /></Form.Item>
        <Form.Item name="storeCode" hidden><Input /></Form.Item>
      </Form>

      <fieldset
        className="product-listing-editor-fieldset"
        disabled={!editSession.canEditAndSave || busy}
        data-testid="product-listing-editor"
      >
        <Card className="product-listing-editor-card" variant="borderless">
          <ProductListingDetailEditor
            draft={listingDraft}
            tabBarExtraContent={
              <Space>
                <ProductListingSaveDraftButton saving={saving}
                  disabled={!editSession.canEditAndSave || busy} onSave={() => void saveDraftFromForm()} />
                <ProductListingWorkflowActionButton workflow={workflow} busy={operationBusy}
                  disabled={Boolean(workflowActionBlockedMessage)} onlyAction="REVIEW_DRAFT"
                  onAction={action => void handleWorkflowAction(action)} />
              </Space>
            }
            competitorMaterials={sourcePrefill?.competitorMaterials ?? listingDraft.competitorMaterials}
            ownerUserId={
              workflow.draft?.ownerUserId ??
              workflow.dryRunTask?.ownerUserId ??
              workflow.realRunTask?.ownerUserId
            }
            onDraftChange={updater => {
              setListingDraft(current => {
                const nextDraft = updater(current)
                listingDraftRef.current = nextDraft
                return nextDraft
              })
            }}
          />
        </Card>
      </fieldset>

      <ProductListingWorkflowPanel
        workflow={workflow}
        busy={operationBusy}
        actionDisabled={Boolean(workflowActionBlockedMessage)}
        actionBlockedMessage={workflowActionBlockedMessage}
        hidePrimaryAction={workflowPresentation.action?.kind === 'REVIEW_DRAFT'}
        canConfirmNotCreated={confirmNotCreated.canConfirm}
        notCreatedLookupAttemptCount={confirmNotCreated.lookupAttemptCount}
        onAction={action => void handleWorkflowAction(action)}
        onConfirmNotCreated={confirmNotCreated.open}
      />

      <ProductListingReviewModal
        open={listingReviewOpen}
        workflow={workflow}
        changes={listingReviewChanges}
        validationIssues={validationIssues}
        preparationError={listingPreparationError}
        preparing={preparing}
        confirming={confirming}
        confirmationAwaitingWorkflow={confirmationAwaitingWorkflow}
        returningToEdit={reviewReopen.busy}
        workflowIntegrityBlocked={Boolean(
          workflowIntegrityError ||
          sourceHydrationBlocked ||
          workflowReadiness.locked
        )}
        onClose={closeListingReview}
        onConfirm={() => void handleConfirmPublish()}
        onReturnToEdit={() => void handleReturnToEdit()}
      />
    </div>
  )
}
