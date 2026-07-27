import { Card, Form, Input, Space, message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeError } from '../../shared/api'
import { ProductListingDetailEditor } from './ProductListingDetailEditor'
import { ProductListingReviewModal } from './ProductListingReviewModal'
import { ProductListingPageStatus, ProductListingSaveDraftButton, type ProductListingNotice } from './ProductListingPageStatus'
import { ProductListingWorkflowPanel } from './ProductListingWorkflowPanel'
import { ProductListingWorkflowActionButton } from './ProductListingWorkflowActionButton'
import {
  confirmProductListingRealRun,
  continueProductListingRealRunAfterCreate,
  fetchProductListingWorkflow,
  replayProductListingProjection,
  reopenProductListingReview,
  saveProductListingDraft,
  submitProductListingDryRun,
  verifyProductListingCreateOutcome,
  verifyProductListingRealRunReadBack
} from './api'
import {
  createProductListingEditorDraft,
  mergeProductListingPrefillDraft,
  normalizeProductListingEditorDraft,
  productListingEditorDraftToMetadataValues,
  productListingEditorDraftToPayload,
  type ProductListingEditorDraft,
  type ProductListingMetadataFormValues
} from './productDetailAdapter'
import { buildProductListingChangeSummary, type ProductListingChangeSummaryItem } from './productListingChangeSummary'
import { createEditingProductListingWorkflow, presentProductListingWorkflow } from './productListingWorkflowPresentation'
import { completeProductListingReviewReopen, focusProductListingEditor } from './productListingReviewReopenCompletion'
import { applyProductListingWorkflowRefresh } from './productListingWorkflowClientState'
import { shouldAwaitProductListingConfirmationWorkflow } from './productListingConfirmationRefresh'
import {
  isAmbiguousProductListingCommandError,
  isDangerousProductListingRecoveryAction,
  type DangerousProductListingRecoveryAction
} from './productListingAmbiguousOutcome'
import { resolveProductListingWorkflowEditSession } from './productListingWorkflowEditSession'
import {
  canApplyProductListingWorkflowResponse,
  matchesProductListingPartnerSku,
  productListingWorkflowIdentity,
  sameProductListingWorkflowIdentity,
  validateProductListingWorkflowResponse,
  type ProductListingWorkflowIdentity
} from './productListingWorkflowIdentity'
import { subscribeProductListingWorkflowRefresh } from './productListingWorkflowRefreshEvents'
import { useProductListingReviewReopenController } from './useProductListingReviewReopen'
import { useProductListingReauthentication } from './useProductListingReauthentication'
import { useProductListingConfirmNotCreated } from './useProductListingConfirmNotCreated'
import { useProductListingWorkflowReadiness } from './useProductListingWorkflowReadiness'
import { useProductListingDangerousActionPolling } from './useProductListingDangerousActionPolling'
import type { ProductListingSourcePrefill } from './sourcePrefill'
import { useProductListingSourcePrefill } from './useProductListingSourcePrefill'
import type { ProductListingDraftView, ProductListingWorkflowNextAction, ProductListingWorkflowView } from './types'
import './ProductListingPage.css'
const PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY = 'product-listing-draft-save'
const PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE = '请先填写正式 PSKU，再点击上架。'
type ProductListingPageProps = {
  storeCode?: string
}
export function ProductListingPage({ storeCode }: ProductListingPageProps) {
  const [form] = Form.useForm<ProductListingMetadataFormValues>()
  const [listingDraft, setListingDraft] = useState<ProductListingEditorDraft>(() =>
    createProductListingEditorDraft(storeCode)
  )
  const [workflow, setWorkflow] = useState<ProductListingWorkflowView>(
    createEditingProductListingWorkflow
  )
  const [saving, setSaving] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmationAwaitingWorkflow, setConfirmationAwaitingWorkflow] = useState(false)
  const [workflowActionBusy, setWorkflowActionBusy] = useState(false)
  const [dangerousActionAwaitingWorkflow, setDangerousActionAwaitingWorkflow] = useState<DangerousProductListingRecoveryAction>()
  const [listingReviewOpen, setListingReviewOpen] = useState(false)
  const [listingReviewChanges, setListingReviewChanges] = useState<ProductListingChangeSummaryItem[]>([])
  const [listingPreparationError, setListingPreparationError] = useState('')
  const [draftSaveNotice, setDraftSaveNotice] = useState<ProductListingNotice>()
  const [workflowIntegrityError, setWorkflowIntegrityError] = useState('')
  const listingDraftRef = useRef(listingDraft)
  const workflowIdentityRef = useRef<ProductListingWorkflowIdentity>(
    productListingWorkflowIdentity(workflow, listingDraft.draftId, listingDraft.storeCode)
  )
  const workflowRequestSequenceRef = useRef(0)
  const confirmCommandInFlightRef = useRef(false)
  const recoveryCommandInFlightRef = useRef(false)
  const workflowPresentation = useMemo(() => presentProductListingWorkflow(workflow), [workflow])
  const editSession = useMemo(() => resolveProductListingWorkflowEditSession(workflow), [workflow])
  const currentDraftId = listingDraft.draftId ?? workflow.draft?.draftId
  const workflowReadiness = useProductListingWorkflowReadiness(currentDraftId, listingDraft.storeCode)
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
  useEffect(() => {
    listingDraftRef.current = listingDraft
    workflowIdentityRef.current = productListingWorkflowIdentity(
      workflow,
      listingDraft.draftId,
      listingDraft.storeCode
    )
  }, [listingDraft, workflow])

  useEffect(() => {
    if (!storeCode || listingDraft.storeCode) {
      return
    }
    updateEditorDraft(
      normalizeProductListingEditorDraft({ ...listingDraft, storeCode }, storeCode)
    )
    // The draft's persisted store becomes authoritative after hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, listingDraft, storeCode])

  useEffect(() => {
    if (!currentDraftId) {
      return
    }
    let cancelled = false
    void refreshWorkflow(currentDraftId)
      .catch(error => {
        if (!cancelled) {
          const errorMessage = normalizeError(error, '读取上架流程失败')
          workflowReadiness.markLoadError(errorMessage)
          message.warning(errorMessage)
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDraftId, listingDraft.storeCode])

  useEffect(() => {
    if (!currentDraftId) {
      return
    }
    return subscribeProductListingWorkflowRefresh(window, () => {
      const expectedIdentity = workflowIdentityRef.current
      if (expectedIdentity.draftId !== currentDraftId) {
        return
      }
      void refreshWorkflow(currentDraftId, expectedIdentity).catch(error => {
        message.warning(normalizeError(error, '恢复窗口后刷新上架流程失败'))
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDraftId, listingDraft.storeCode])

  useEffect(() => {
    if (workflow.phase !== 'PUBLISHING' || !currentDraftId) {
      return
    }
    let cancelled = false
    let timeoutId: number | undefined
    const expectedIdentity = productListingWorkflowIdentity(
      workflow,
      currentDraftId,
      listingDraftRef.current.storeCode
    )
    const pollWorkflow = async () => {
      try {
        const nextWorkflow = await refreshWorkflow(currentDraftId, expectedIdentity)
        if (
          !cancelled &&
          identityMatches(expectedIdentity) &&
          (!nextWorkflow || nextWorkflow.phase === 'PUBLISHING')
        ) {
          timeoutId = window.setTimeout(() => void pollWorkflow(), 3000)
        }
      } catch (error) {
        if (!cancelled) {
          message.warning(normalizeError(error, '刷新上架流程失败'))
          timeoutId = window.setTimeout(() => void pollWorkflow(), 3000)
        }
      }
    }
    timeoutId = window.setTimeout(() => void pollWorkflow(), 3000)
    return () => {
      cancelled = true
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDraftId, workflow.phase, workflow.realRunTask?.taskId])

  useEffect(() => {
    if (!confirmationAwaitingWorkflow || !currentDraftId) {
      return
    }
    let cancelled = false
    let timeoutId: number | undefined
    const retryWorkflow = async () => {
      const expectedIdentity = workflowIdentityRef.current
      try {
        const nextWorkflow = await refreshWorkflow(currentDraftId, expectedIdentity)
        if (!cancelled && shouldAwaitProductListingConfirmationWorkflow(nextWorkflow)) {
          timeoutId = window.setTimeout(() => void retryWorkflow(), 2500)
        }
      } catch {
        if (!cancelled) {
          timeoutId = window.setTimeout(() => void retryWorkflow(), 2500)
        }
      }
    }
    timeoutId = window.setTimeout(() => void retryWorkflow(), 1500)
    return () => {
      cancelled = true
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmationAwaitingWorkflow, currentDraftId])

  function applySourcePrefill(nextPrefill: ProductListingSourcePrefill) {
    const currentDraft = listingDraftRef.current
    const nextDraft = normalizeProductListingEditorDraft(
      {
        ...mergeProductListingPrefillDraft(currentDraft, nextPrefill.draft),
        competitorMaterials:
          nextPrefill.competitorMaterials ??
          nextPrefill.draft.competitorMaterials ??
          currentDraft.competitorMaterials,
        storeCode:
          nextPrefill.draft.storeCode || currentDraft.storeCode || storeCode
      },
      nextPrefill.draft.storeCode || currentDraft.storeCode || storeCode
    )
    if (nextDraft.draftId !== currentDraft.draftId) {
      const editingWorkflow = createEditingProductListingWorkflow()
      setWorkflow(editingWorkflow)
      workflowIdentityRef.current = productListingWorkflowIdentity(
        editingWorkflow,
        nextDraft.draftId,
        nextDraft.storeCode
      )
      workflowRequestSequenceRef.current += 1
      setDangerousActionAwaitingWorkflow(undefined)
    }
    updateEditorDraft(nextDraft)
  }

  function updateEditorDraft(nextDraft: ProductListingEditorDraft) {
    const currentDraft = listingDraftRef.current
    workflowReadiness.invalidateIfScopeChanged(
      currentDraft.draftId,
      currentDraft.storeCode,
      nextDraft.draftId,
      nextDraft.storeCode
    )
    listingDraftRef.current = nextDraft
    setListingDraft(nextDraft)
    form.setFieldsValue(productListingEditorDraftToMetadataValues(nextDraft))
  }

  function applyWorkflow(nextWorkflow: ProductListingWorkflowView) {
    const activeDraft = listingDraftRef.current
    if (!activeDraft.draftId || !activeDraft.storeCode) {
      setWorkflowIntegrityError('上架流程缺少当前草稿身份，已停止可执行操作。')
      return false
    }
    const validation = validateProductListingWorkflowResponse(nextWorkflow, {
      draftId: activeDraft.draftId,
      storeCode: activeDraft.storeCode
    })
    if (!validation.valid) {
      setWorkflowIntegrityError(
        `上架流程身份校验失败（${validation.reason || 'unknown'}），已停止可执行操作。`
      )
      return false
    }
    const nextState = applyProductListingWorkflowRefresh(
      { editorDraft: listingDraftRef.current, workflow },
      nextWorkflow
    )
    setWorkflowIntegrityError('')
    workflowReadiness.markLoaded(activeDraft.draftId, activeDraft.storeCode)
    setWorkflow(nextState.workflow)
    if (!shouldAwaitProductListingConfirmationWorkflow(nextState.workflow)) {
      setConfirmationAwaitingWorkflow(false)
    }
    workflowIdentityRef.current = productListingWorkflowIdentity(
      nextState.workflow,
      nextState.editorDraft.draftId,
      nextState.editorDraft.storeCode
    )
    return true
  }

  function identityMatches(expected: ProductListingWorkflowIdentity) {
    return sameProductListingWorkflowIdentity(workflowIdentityRef.current, expected)
  }

  async function refreshWorkflow(
    draftId: number,
    expected?: ProductListingWorkflowIdentity
  ) {
    const requestSequence = ++workflowRequestSequenceRef.current
    const nextWorkflow = await fetchProductListingWorkflow(draftId)
    const activeDraftId =
      listingDraftRef.current.draftId ?? workflowIdentityRef.current.draftId
    if (!canApplyProductListingWorkflowResponse({
      requestSequence,
      latestSequence: workflowRequestSequenceRef.current,
      requestedDraftId: draftId,
      activeDraftId,
      expectedIdentity: expected,
      currentIdentity: workflowIdentityRef.current
    })) {
      return undefined
    }
    return applyWorkflow(nextWorkflow) ? nextWorkflow : undefined
  }

  function currentListingDraftFromForm() {
    return normalizeProductListingEditorDraft(
      {
        ...listingDraftRef.current,
        ...form.getFieldsValue()
      },
      listingDraftRef.current.storeCode || storeCode
    )
  }

  async function saveDraftFromForm(options?: {
    silent?: boolean
    draftOverride?: ProductListingEditorDraft
  }) {
    if (
      workflowIntegrityError ||
      sourceHydrationBlocked ||
      workflowReadiness.locked ||
      !editSession.canEditAndSave
    ) {
      message.warning(
        sourceHydrationBlocked
          ? hydrationBlockedMessage
          : workflowReadiness.locked
          ? workflowReadiness.blockedMessage
          : '当前上架状态不允许保存草稿，请先完成当前动作。'
      )
      return undefined
    }
    showDraftSaveStart(options?.silent)
    setSaving(true)
    try {
      const currentDraft = options?.draftOverride
        ? normalizeProductListingEditorDraft(
            options.draftOverride,
            options.draftOverride.storeCode || storeCode
          )
        : currentListingDraftFromForm()
      updateEditorDraft(currentDraft)
      const saved = await saveProductListingDraft(
        productListingEditorDraftToPayload(currentDraft, currentDraftId)
      )
      updateEditorDraft(editorDraftFromSaved(currentDraft, saved))
      const savedWorkflow = await refreshWorkflow(saved.draftId)
      showDraftSaveSuccess(saved, options?.silent)
      return { saved, workflow: savedWorkflow }
    } catch (error) {
      showDraftSaveFailure(error, options?.silent)
      return undefined
    } finally {
      setSaving(false)
    }
  }

  function showDraftSaveStart(silent?: boolean) {
    if (silent) {
      return
    }
    setDraftSaveNotice({ type: 'info', message: '正在保存上架草稿...' })
    message.loading({
      key: PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY,
      content: '正在保存上架草稿...',
      duration: 0
    })
  }

  function showDraftSaveSuccess(saved: ProductListingDraftView, silent?: boolean) {
    if (silent) {
      return
    }
    const successMessage = saved.draftNo ? `上架草稿已保存：${saved.draftNo}` : '上架草稿已保存'
    setDraftSaveNotice({ type: 'success', message: successMessage })
    message.success({ key: PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY, content: successMessage })
  }

  function showDraftSaveFailure(error: unknown, silent?: boolean) {
    const errorMessage = normalizeError(error, '保存上架草稿失败')
    if (silent) {
      message.error(errorMessage)
      return
    }
    setDraftSaveNotice({ type: 'error', message: errorMessage })
    message.error({ key: PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY, content: errorMessage })
  }

  async function handleOpenListingReview() {
    if (
      workflowIntegrityError ||
      sourceHydrationBlocked ||
      workflowReadiness.locked ||
      !workflowPresentation.allowPrepare
    ) {
      message.warning(
        sourceHydrationBlocked
          ? hydrationBlockedMessage
          : workflowReadiness.locked
          ? workflowReadiness.blockedMessage
          : '当前上架状态不允许再次发起上架检查。'
      )
      return
    }
    const currentDraft = currentListingDraftFromForm()
    if (!currentDraft.psku.trim()) {
      setListingPreparationError(PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE)
      message.warning(PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE)
      return
    }
    const previewPayload = productListingEditorDraftToPayload(currentDraft, currentDraftId)
    setListingReviewChanges(
      buildProductListingChangeSummary(
        previewPayload,
        workflow.draft?.draft ?? sourcePrefill?.draft
      )
    )
    setListingPreparationError('')
    setListingReviewOpen(true)
    setPreparing(true)
    try {
      const saveResult = await saveDraftFromForm({ silent: true, draftOverride: currentDraft })
      if (!saveResult?.saved.draftId || !saveResult.workflow) {
        setListingPreparationError('自动保存草稿失败，请处理页面提示后重试。')
        return
      }
      const latestPresentation = presentProductListingWorkflow(saveResult.workflow)
      if (!latestPresentation.allowPrepare) {
        const blockedMessage = '上架状态已在其他窗口发生变化，本次未提交新的上架检查。'
        setListingPreparationError(blockedMessage)
        message.warning(blockedMessage)
        return
      }
      const expectedIdentity = productListingWorkflowIdentity(
        saveResult.workflow,
        saveResult.saved.draftId,
        saveResult.saved.storeCode
      )
      await submitProductListingDryRun({
        draftId: saveResult.saved.draftId,
        storeCode: saveResult.saved.storeCode
      })
      await refreshWorkflow(saveResult.saved.draftId, expectedIdentity)
    } catch (error) {
      const errorMessage = normalizeError(error, '提交上架检查失败')
      setListingPreparationError(errorMessage)
      message.error(errorMessage)
    } finally {
      setPreparing(false)
    }
  }

  async function handleConfirmPublish() {
    const dryRunTaskId = workflow.dryRunTask?.taskId
    const draftId = currentDraftId
    if (
      confirming ||
      confirmCommandInFlightRef.current ||
      confirmationAwaitingWorkflow ||
      reviewReopen.busy ||
      Boolean(workflowIntegrityError) ||
      sourceHydrationBlocked ||
      workflowReadiness.locked ||
      !editSession.canConfirm ||
      workflow.phase !== 'READY_TO_CONFIRM' ||
      workflow.nextAction !== 'CONFIRM_PUBLISH' ||
      !dryRunTaskId ||
      !draftId
    ) {
      message.warning('当前没有可以确认的上架检查，请刷新流程后重试。')
      return
    }
    const expectedIdentity = productListingWorkflowIdentity(
      workflow,
      draftId,
      listingDraftRef.current.storeCode
    )
    confirmCommandInFlightRef.current = true
    setConfirming(true)
    let commandAccepted = false
    try {
      await confirmProductListingRealRun(dryRunTaskId, {
        confirmRealNoonWrite: true,
        confirmationNote: 'confirmed from product listing workflow'
      })
      commandAccepted = true
      if (!identityMatches(expectedIdentity)) {
        message.warning('确认结果属于之前的草稿，未应用到当前上架流程。')
        return
      }
      setConfirmationAwaitingWorkflow(true)
      const nextWorkflow = await refreshWorkflow(draftId, expectedIdentity)
      if (!shouldAwaitProductListingConfirmationWorkflow(nextWorkflow)) {
        setConfirmationAwaitingWorkflow(false)
      }
    } catch (error) {
      const ambiguousOutcome =
        commandAccepted || isAmbiguousProductListingCommandError(error)
      if (identityMatches(expectedIdentity) && ambiguousOutcome) {
        setConfirmationAwaitingWorkflow(true)
        message.warning(
          '确认命令结果未知，已锁定当前操作并持续刷新后端上架流程。'
        )
      } else {
        setConfirmationAwaitingWorkflow(false)
        message.error(normalizeError(error, '确认真实上架失败'))
      }
    } finally {
      confirmCommandInFlightRef.current = false
      setConfirming(false)
    }
  }

  function closeListingReview() {
    if (
      workflowPresentation.allowCloseReview &&
      !confirming &&
      !confirmationAwaitingWorkflow &&
      !workflowIntegrityError &&
      !reviewReopen.busy
    ) {
      setListingReviewOpen(false)
    }
  }

  async function handleReturnToEdit() {
    if (
      workflowIntegrityError ||
      sourceHydrationBlocked ||
      workflowReadiness.locked ||
      !editSession.canReturnToEdit
    ) {
      message.warning('当前上架检查不能返回修改，请刷新流程后重试。')
      return
    }
    await reviewReopen.reopen({ kind: 'RETURN_TO_EDIT' })
  }

  async function handleWorkflowAction(action: ProductListingWorkflowNextAction) {
    if (sourceHydrationBlocked) {
      message.warning(hydrationBlockedMessage)
      return
    }
    if (workflowReadiness.locked) {
      message.warning(workflowReadiness.blockedMessage)
      return
    }
    if (dangerousActionAwaitingWorkflow || reviewReopen.awaiting) {
      message.warning('流程结果仍在确认中，请等待后端状态更新。')
      return
    }
    switch (action) {
      case 'REVIEW_DRAFT':
        if (workflow.phase === 'ACTION_REQUIRED') {
          await handleTerminalDraftAction(action)
          return
        }
        await handleOpenListingReview()
        return
      case 'EDIT_DRAFT':
        if (workflow.phase === 'ACTION_REQUIRED') {
          await handleTerminalDraftAction(action)
          return
        }
        closeListingReview()
        focusProductListingEditor()
        return
      case 'CONFIRM_PUBLISH':
        setListingReviewOpen(true)
        return
      case 'REAUTHENTICATE':
        reauthentication.open()
        return
      case 'CHECK_CREATE_RESULT':
      case 'CONTINUE_AFTER_CREATE':
      case 'VERIFY_READBACK':
      case 'REPLAY_PROJECTION':
        await executeRealRunRecoveryAction(action)
        return
      case 'WAIT':
      case 'WAIT_FOR_REAUTHENTICATION':
      case 'NONE':
        return
    }
  }

  async function handleTerminalDraftAction(
    action: 'EDIT_DRAFT' | 'REVIEW_DRAFT'
  ) {
    if (
      workflow.phase !== 'ACTION_REQUIRED' ||
      workflow.writeCertainty !== 'NOT_STARTED' ||
      workflow.nextAction !== action
    ) {
      message.warning('当前处理动作已经变化，请刷新流程后重试。')
      return
    }
    await reviewReopen.reopen({ kind: action })
  }

  async function executeRealRunRecoveryAction(action: ProductListingWorkflowNextAction) {
    const draftId = currentDraftId
    const taskId = workflow.realRunTask?.taskId
    if (
      workflowIntegrityError ||
      sourceHydrationBlocked ||
      workflowReadiness.locked ||
      dangerousActionAwaitingWorkflow ||
      !draftId ||
      !taskId ||
      workflow.nextAction !== action
    ) {
      message.warning('当前恢复动作已变化，请刷新流程后重试。')
      return
    }
    if (recoveryCommandInFlightRef.current) {
      message.warning('恢复动作正在执行，请勿重复提交。')
      return
    }
    const expectedIdentity = productListingWorkflowIdentity(
      workflow,
      draftId,
      listingDraftRef.current.storeCode
    )
    const dangerousAction = isDangerousProductListingRecoveryAction(action)
      ? action
      : undefined
    recoveryCommandInFlightRef.current = true
    setWorkflowActionBusy(true)
    try {
      if (action === 'CHECK_CREATE_RESULT') {
        const verification = await verifyProductListingCreateOutcome(taskId)
        if (
          verification.taskId !== taskId ||
          !matchesProductListingPartnerSku(
            verification.partnerSku,
            workflow.realRunTask?.partnerSku
          ) ||
          !identityMatches(expectedIdentity)
        ) {
          message.warning('核对结果已过期，未应用到当前上架任务。')
          return
        }
        if (verification.status === 'found') {
          message.success(verification.message || '已找到 Noon 商品，可以继续完成剩余写入。')
        } else if (verification.status === 'not_found') {
          message.warning(verification.message || 'Noon 暂未找到该商品，不能继续写入。')
        } else if (verification.status === 'reauthentication_required') {
          message.warning(
            verification.message ||
              'Noon 授权已失效，请重新授权后继续只读核对。'
          )
        } else {
          message.error(verification.message || '核对 Noon 创建结果失败。')
        }
        confirmNotCreated.observeVerification(verification, expectedIdentity)
      } else if (action === 'CONTINUE_AFTER_CREATE') {
        await continueProductListingRealRunAfterCreate(taskId)
      } else if (action === 'VERIFY_READBACK') {
        await verifyProductListingRealRunReadBack(taskId)
      } else {
        await replayProductListingProjection(taskId)
      }
      if (identityMatches(expectedIdentity)) {
        // A completed command followed by a successful workflow GET is
        // authoritative even when the backend intentionally returns the same
        // retryable action. Do not turn a normal provider failure into a
        // permanent client-side lock.
        await refreshWorkflow(draftId, expectedIdentity)
      }
    } catch (error) {
      if (
        dangerousAction &&
        identityMatches(expectedIdentity) &&
        isAmbiguousProductListingCommandError(error)
      ) {
        dangerousActionPolling.reset()
        setDangerousActionAwaitingWorkflow(dangerousAction)
        message.warning(
          '恢复写入命令结果未知，已锁定当前操作并持续刷新后端上架流程。'
        )
      } else {
        message.error(normalizeError(error, '执行上架恢复动作失败'))
      }
    } finally {
      recoveryCommandInFlightRef.current = false
      setWorkflowActionBusy(false)
    }
  }

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

function editorDraftFromSaved(
  currentDraft: ProductListingEditorDraft,
  saved: ProductListingDraftView
) {
  return normalizeProductListingEditorDraft(
    {
      ...currentDraft,
      ...(saved.draft ?? {}),
      draftId: saved.draftId,
      storeCode: saved.storeCode
    },
    saved.storeCode
  )
}
