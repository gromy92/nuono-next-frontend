import { PlayCircleOutlined, SaveOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Result,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeError } from '../../shared/api'
import {
  PRODUCT_MANUAL_SELECTION_PATH,
  PRODUCT_WORKSPACE_PATH,
  withCurrentWorkspaceDevQuery
} from '../app-shell/WorkspaceRouting'
import { ProductListingDetailEditor } from './ProductListingDetailEditor'
import {
  continueProductListingRealRunAfterCreate,
  confirmProductListingRealRun,
  fetchProductListingTask,
  fetchRecentProductListingTasks,
  saveProductListingDraft,
  submitProductListingDryRun,
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
import {
  buildProductListingChangeSummary,
  type ProductListingChangeSummaryItem
} from './productListingChangeSummary'
import {
  PRODUCT_LISTING_REAL_RUN_SUBMITTED_NOTICE,
  saveProductListingReturnNotice
} from './productListingReturnNotice'
import {
  readProductListingSourcePrefill,
  type ProductListingSourcePrefill
} from './sourcePrefill'
import { hydrateProductListingSourcePrefill } from './sourcePrefillHydration'
import { recoverProductListingTasksFromRecent } from './taskRecovery'
import {
  isProductListingRealWriteAttemptForDryRun,
  isProductListingTaskPending,
  isProductListingTaskTerminal,
  productListingDryRunFailureSummary,
  productListingTaskFailureMessage,
  productListingValidationIssueLabel,
  productListingValidationIssueMessage
} from './taskStatus'
import type {
  ProductListingDraftView,
  ProductListingNoonWriteResult,
  ProductListingNoonWriteStepResult,
  ProductListingTaskView
} from './types'
import './ProductListingPage.css'

const { Paragraph, Text } = Typography

const PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY = 'product-listing-draft-save'
const PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE = '请先填写正式 PSKU，再点击上架。'

type ProductListingNotice = {
  type: 'success' | 'info' | 'warning' | 'error'
  message: string
}

type ProductListingPageProps = {
  storeCode?: string
}

export function ProductListingPage({ storeCode }: ProductListingPageProps) {
  const [form] = Form.useForm<ProductListingMetadataFormValues>()
  const [listingDraft, setListingDraft] = useState<ProductListingEditorDraft>(() =>
    createProductListingEditorDraft(storeCode)
  )
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmingRealRun, setConfirmingRealRun] = useState(false)
  const [verifyingReadBack, setVerifyingReadBack] = useState(false)
  const [continuingAfterCreate, setContinuingAfterCreate] = useState(false)
  const [listingReviewOpen, setListingReviewOpen] = useState(false)
  const [listingReviewChanges, setListingReviewChanges] = useState<ProductListingChangeSummaryItem[]>([])
  const [listingPreparationError, setListingPreparationError] = useState('')
  const [draftSaveNotice, setDraftSaveNotice] = useState<ProductListingNotice>()
  const [realRunNotice, setRealRunNotice] = useState<ProductListingNotice>()
  const [draftView, setDraftView] = useState<ProductListingDraftView>()
  const [taskView, setTaskView] = useState<ProductListingTaskView>()
  const [realRunTaskView, setRealRunTaskView] = useState<ProductListingTaskView>()
  const [recentTasks, setRecentTasks] = useState<ProductListingTaskView[]>([])
  const [loadingRecentTasks, setLoadingRecentTasks] = useState(false)
  const [sourcePrefill, setSourcePrefill] = useState<ProductListingSourcePrefill>()
  const [sourcePrefillResolved, setSourcePrefillResolved] = useState(false)
  const listingDraftRef = useRef(listingDraft)
  const taskViewRef = useRef<ProductListingTaskView | undefined>(undefined)
  const realRunTaskViewRef = useRef<ProductListingTaskView | undefined>(undefined)

  useEffect(() => {
    listingDraftRef.current = listingDraft
  }, [listingDraft])

  useEffect(() => {
    taskViewRef.current = taskView
  }, [taskView])

  useEffect(() => {
    realRunTaskViewRef.current = realRunTaskView
  }, [realRunTaskView])

  useEffect(() => {
    if (!realRunTaskView || isProductListingTaskPending(realRunTaskView.status)) {
      return
    }
    const notice = realRunTaskCompletionNotice(realRunTaskView)
    if (notice) {
      setRealRunNotice(notice)
    }
  }, [realRunTaskView])

  useEffect(() => {
    if (storeCode && !listingDraft.storeCode) {
      const nextDraft = normalizeProductListingEditorDraft({ ...listingDraft, storeCode }, storeCode)
      setListingDraft(nextDraft)
      form.setFieldsValue(productListingEditorDraftToMetadataValues(nextDraft))
    }
  }, [form, listingDraft, storeCode])

  useEffect(() => {
    const prefill = readProductListingSourcePrefill()
    if (!prefill) {
      setSourcePrefill(undefined)
      setSourcePrefillResolved(true)
      return
    }
    let cancelled = false
    const applyPrefill = (nextPrefill: ProductListingSourcePrefill) => {
      if (cancelled) {
        return
      }
      setSourcePrefill(nextPrefill)
      const currentDraft = listingDraftRef.current
      const prefillCompetitorMaterials =
        nextPrefill.competitorMaterials ?? nextPrefill.draft.competitorMaterials ?? currentDraft.competitorMaterials
      const nextDraft = normalizeProductListingEditorDraft(
        {
          ...mergeProductListingPrefillDraft(currentDraft, nextPrefill.draft),
          competitorMaterials: prefillCompetitorMaterials,
          storeCode: nextPrefill.draft.storeCode || currentDraft.storeCode || storeCode
        },
        storeCode
      )
      listingDraftRef.current = nextDraft
      setListingDraft(nextDraft)
      form.setFieldsValue(productListingEditorDraftToMetadataValues(nextDraft))
      setSourcePrefillResolved(true)
    }

    if (prefill.pendingServerHydration) {
      setSourcePrefill(prefill)
      setSourcePrefillResolved(false)
      void hydrateProductListingSourcePrefill(prefill, storeCode)
        .then(applyPrefill)
        .catch((error) => {
          if (!cancelled) {
            setSourcePrefill(undefined)
            setSourcePrefillResolved(true)
            message.warning(normalizeError(error, '读取上架来源资料失败，请重新从入口进入上架'))
          }
        })
      return () => {
        cancelled = true
      }
    }

    applyPrefill(prefill)
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, storeCode])

  const validationIssues = useMemo(() => {
    if (taskView?.validationIssues?.length) {
      return taskView.validationIssues
    }
    return draftView?.validationIssues ?? []
  }, [draftView?.validationIssues, taskView?.validationIssues])
  const realWriteAttemptLocked = isProductListingRealWriteAttemptForDryRun(realRunTaskView, taskView)
  const realRunReferences = useMemo(
    () => extractNoonWriteReferences(realRunTaskView?.noonResult),
    [realRunTaskView?.noonResult]
  )
  const canContinueAfterCreate = canContinueRealRunAfterCreate(realRunTaskView, realRunReferences)
  const realRunPending = isProductListingTaskPending(realRunTaskView?.status)
  const realRunTerminal = Boolean(
    realRunTaskView?.mode === 'REAL_RUN' &&
      realRunTaskView.status &&
      isProductListingTaskTerminal(realRunTaskView.status)
  )
  const listingReviewBusy = saving || submitting || confirmingRealRun
  const recentTasksStoreCode = sourcePrefillResolved && sourcePrefill
    ? listingDraft.storeCode || storeCode || ''
    : ''
  const currentDraftId = listingDraft.draftId ?? draftView?.draftId
  const closeListingReview = () => {
    if (!listingReviewBusy) {
      setListingReviewOpen(false)
    }
  }
  const listingReviewFooter = realRunTerminal
    ? [
        <Button key="close-real-run-terminal" onClick={closeListingReview}>
          关闭
        </Button>
      ]
    : undefined
  const realRunConfirmationBlocked = Boolean(realRunConfirmationBlockedReason({
    realRunTaskView,
    realWriteAttemptLocked,
    saving,
    submitting,
    taskView
  }))

  useEffect(() => {
    if (!recentTasksStoreCode) {
      return
    }
    let cancelled = false
    setLoadingRecentTasks(true)
    void fetchRecentProductListingTasks(recentTasksStoreCode, 10, currentDraftId)
      .then((tasks) => {
        if (cancelled) {
          return
        }
        setRecentTasks(tasks)
        const recovered = recoverProductListingTasksFromRecent(tasks, currentDraftId)
        if ((!taskViewRef.current || taskViewRef.current.draftId !== currentDraftId) && recovered.dryRunTask) {
          setTaskView(recovered.dryRunTask)
        }
        if ((!realRunTaskViewRef.current || realRunTaskViewRef.current.draftId !== currentDraftId) && recovered.realRunTask) {
          setRealRunTaskView(recovered.realRunTask)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          message.warning(normalizeError(error, '读取最近上架任务失败'))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRecentTasks(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [currentDraftId, recentTasksStoreCode])

  useEffect(() => {
    if (!realRunTaskView?.taskId || !isProductListingTaskPending(realRunTaskView.status)) {
      return
    }
    let cancelled = false
    let failureNotified = false
    const pollTask = async () => {
      try {
        const nextTask = await fetchProductListingTask(realRunTaskView.taskId)
        if (cancelled) {
          return
        }
        setRealRunTaskView(nextTask)
        setRecentTasks((current) => mergeRecentTask(current, nextTask))
        if (isProductListingTaskTerminal(nextTask.status)) {
          notifyRealRunTaskCompletion(nextTask)
        }
      } catch (error) {
        if (!cancelled && !failureNotified) {
          failureNotified = true
          message.warning(normalizeError(error, '刷新真实上架任务状态失败'))
        }
      }
    }
    void pollTask()
    const intervalId = window.setInterval(() => void pollTask(), 3000)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [realRunTaskView?.taskId, realRunTaskView?.status])

  const currentListingDraftFromForm = () =>
    normalizeProductListingEditorDraft(
      {
        ...listingDraftRef.current,
        ...form.getFieldsValue()
      },
      storeCode
    )

  const saveDraftFromForm = async (options?: { silent?: boolean; draftOverride?: ProductListingEditorDraft }) => {
    if (!options?.silent) {
      setDraftSaveNotice({ type: 'info', message: '正在保存上架草稿...' })
      message.loading({
        key: PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY,
        content: '正在保存上架草稿...',
        duration: 0
      })
    }
    setSaving(true)
    try {
      const currentDraft = options?.draftOverride
        ? normalizeProductListingEditorDraft(options.draftOverride, storeCode)
        : currentListingDraftFromForm()
      setListingDraft(currentDraft)
      const payload = productListingEditorDraftToPayload(currentDraft, draftView?.draftId)
      const saved = await saveProductListingDraft(payload)
      setDraftView(saved)
      setTaskView(undefined)
      setRealRunTaskView(undefined)
      const nextDraft = normalizeProductListingEditorDraft(
        {
          ...currentDraft,
          ...(saved.draft ?? payload),
          draftId: saved.draftId
        },
        storeCode
      )
      setListingDraft(nextDraft)
      form.setFieldsValue(productListingEditorDraftToMetadataValues(nextDraft))
      if (!options?.silent) {
        const successMessage = saved.draftNo ? `上架草稿已保存：${saved.draftNo}` : '上架草稿已保存'
        setDraftSaveNotice({ type: 'success', message: successMessage })
        message.success({
          key: PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY,
          content: successMessage
        })
      }
      return saved
    } catch (error) {
      const errorMessage = normalizeError(error, '保存上架草稿失败')
      if (!options?.silent) {
        setDraftSaveNotice({ type: 'error', message: errorMessage })
        message.error({
          key: PRODUCT_LISTING_DRAFT_SAVE_MESSAGE_KEY,
          content: errorMessage
        })
      } else {
        message.error(errorMessage)
      }
      return undefined
    } finally {
      setSaving(false)
    }
  }

  const handleOpenListingReview = async () => {
    const baseDraft = currentListingDraftFromForm()
    if (!baseDraft.psku.trim()) {
      setListingPreparationError(PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE)
      message.warning(PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE)
      return
    }
    const currentDraft = baseDraft
    const previewPayload = productListingEditorDraftToPayload(currentDraft, draftView?.draftId)
    setListingReviewChanges(buildProductListingChangeSummary(previewPayload, draftView?.draft ?? sourcePrefill?.draft))
    setListingPreparationError('')
    setTaskView(undefined)
    setRealRunTaskView(undefined)
    setRealRunNotice(undefined)
    setListingReviewOpen(true)

    const saved = await saveDraftFromForm({ silent: true, draftOverride: currentDraft })
    if (!saved?.draftId) {
      setListingPreparationError('自动保存草稿失败，请处理页面提示后重试。')
      return
    }
    setSubmitting(true)
    try {
      const submitted = await submitProductListingDryRun({
        draftId: saved.draftId,
        storeCode: saved.storeCode
      })
      setTaskView(submitted)
      setRealRunTaskView(undefined)
      setRecentTasks((current) => mergeRecentTask(current, submitted))
      if (submitted.status === 'validated') {
        message.success('dry-run 已通过，可以在弹窗内确认上架')
      } else {
        message.warning('dry-run 已生成校验结果，请先处理弹窗内的问题')
      }
    } catch (error) {
      const errorMessage = normalizeError(error, '提交上架 dry-run 失败')
      setListingPreparationError(errorMessage)
      message.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmRealRunOk = async () => {
    if (confirmingRealRun) {
      return
    }
    const dryRunTaskId = taskView?.taskId
    const blockedReason = realRunConfirmationBlockedReason({
      realRunTaskView,
      realWriteAttemptLocked,
      saving,
      submitting,
      taskView
    })
    if (blockedReason) {
      setRealRunNotice({ type: 'warning', message: blockedReason })
      message.warning(blockedReason)
      return
    }
    setRealRunNotice(undefined)
    setConfirmingRealRun(true)
    try {
      const realRun = await confirmProductListingRealRun(dryRunTaskId as number, {
        confirmRealNoonWrite: true,
        confirmationNote: 'confirmed from product listing page'
      })
      setRealRunTaskView(realRun)
      setRecentTasks((current) => mergeRecentTask(current, realRun))
      setListingReviewOpen(false)
      saveProductListingReturnNotice(PRODUCT_LISTING_REAL_RUN_SUBMITTED_NOTICE)
      window.location.assign(withCurrentWorkspaceDevQuery(PRODUCT_WORKSPACE_PATH))
    } catch (error) {
      const errorMessage = normalizeError(error, '确认真实上架失败')
      setRealRunNotice({ type: 'error', message: errorMessage })
      message.error(errorMessage)
    } finally {
      setConfirmingRealRun(false)
    }
  }

  const handleContinueAfterCreate = async () => {
    if (!realRunTaskView?.taskId || !canContinueAfterCreate) {
      return
    }
    setContinuingAfterCreate(true)
    try {
      const continued = await continueProductListingRealRunAfterCreate(realRunTaskView.taskId)
      setRealRunTaskView(continued)
      setRecentTasks((current) => mergeRecentTask(current, continued))
      if (continued.status === 'succeeded') {
        message.success('Noon 后续写入已完成')
      } else if (continued.status === 'written_verify_failed') {
        message.warning('Noon 已继续写入，仍需按 pskuCode / skuParent 复核')
      } else {
        message.info('Noon 后续写入已刷新')
      }
    } catch (error) {
      message.error(normalizeError(error, '继续写后续步骤失败'))
    } finally {
      setContinuingAfterCreate(false)
    }
  }

  const handleVerifyReadBack = async () => {
    if (!realRunTaskView?.taskId || realRunTaskView.status !== 'written_verify_failed') {
      return
    }
    setVerifyingReadBack(true)
    try {
      const verified = await verifyProductListingRealRunReadBack(realRunTaskView.taskId)
      setRealRunTaskView(verified)
      setRecentTasks((current) => mergeRecentTask(current, verified))
      if (verified.status === 'succeeded') {
        message.success('Noon 回读校验已通过')
      } else if (verified.status === 'written_verify_failed') {
        message.warning('Noon 回读校验仍未通过，请继续按 pskuCode / skuParent 复核')
      } else {
        message.info('Noon 回读校验已刷新')
      }
    } catch (error) {
      message.error(normalizeError(error, '重新回读校验失败'))
    } finally {
      setVerifyingReadBack(false)
    }
  }

  if (!sourcePrefillResolved) {
    return (
      <div className="product-listing-page">
        <Card loading variant="borderless" />
      </div>
    )
  }

  if (sourcePrefillResolved && !sourcePrefill) {
    return (
      <div className="product-listing-page">
        <Card variant="borderless">
          <Result
            status="info"
            title="请先选择要上架的商品"
            subTitle="商品上架需要采购来源、采购成本和供应凭证。请从人工选品发起，或到商品列表恢复已有上架草稿。"
            extra={[
              <Button
                key="manual-selection"
                type="primary"
                onClick={() => window.location.assign(withCurrentWorkspaceDevQuery(PRODUCT_MANUAL_SELECTION_PATH))}
              >
                去人工选品
              </Button>,
              <Button
                key="listing-drafts"
                onClick={() => window.location.assign(withCurrentWorkspaceDevQuery(`${PRODUCT_WORKSPACE_PATH}?listingDrafts=1`))}
              >
                查看上架草稿
              </Button>
            ]}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="product-listing-page">
      <div className="product-listing-page-actions">
        {draftSaveNotice ? (
          <Alert
            className="product-listing-draft-save-feedback"
            type={draftSaveNotice.type}
            showIcon
            message={draftSaveNotice.message}
          />
        ) : null}
        <Button icon={<SaveOutlined />} loading={saving} onClick={() => void saveDraftFromForm()}>
          保存草稿
        </Button>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={saving || submitting}
          onClick={() => void handleOpenListingReview()}
        >
          上架
        </Button>
      </div>

      {canContinueAfterCreate ? (
        <Alert
          className="product-listing-recovery-alert"
          type="warning"
          showIcon
          message={`上架任务 ${realRunTaskView?.taskNo || realRunTaskView?.taskId || ''} 需要安全恢复`}
          description={realRunRecoveryDescription(realRunTaskView, realRunReferences)}
          action={
            <Button
              danger
              loading={continuingAfterCreate}
              onClick={() => void handleContinueAfterCreate()}
            >
              查询 Noon 并继续
            </Button>
          }
        />
      ) : null}

      <Form
        form={form}
        initialValues={productListingEditorDraftToMetadataValues(listingDraft)}
        style={{ display: 'none' }}
      >
        <Form.Item name="sourceType" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="sourceRefId" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="storeCode" hidden>
          <Input />
        </Form.Item>
      </Form>

      <Card className="product-listing-editor-card" variant="borderless">
        <ProductListingDetailEditor
          draft={listingDraft}
          competitorMaterials={sourcePrefill?.competitorMaterials ?? listingDraft.competitorMaterials}
          ownerUserId={draftView?.ownerUserId ?? taskView?.ownerUserId ?? realRunTaskView?.ownerUserId}
          onDraftChange={setListingDraft}
        />
      </Card>

      <Modal
        title="上架确认"
        open={listingReviewOpen}
        width={920}
        okText={realRunPending ? '上架执行中' : '确认上架'}
        cancelText="关闭"
        okButtonProps={{ danger: !realRunPending, disabled: realRunConfirmationBlocked }}
        confirmLoading={confirmingRealRun || realRunPending}
        footer={listingReviewFooter}
        maskClosable={!listingReviewBusy}
        onOk={() => void handleConfirmRealRunOk()}
        onCancel={closeListingReview}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {!realWriteAttemptLocked ? (
            <Alert
              type="warning"
              showIcon
              message="确认上架会写入 Noon。系统已先保存草稿并执行 dry-run，真实写入仍会经过后端开关和任务锁。"
            />
          ) : null}
          {saving || submitting ? (
            <Alert type="info" showIcon message="正在自动保存草稿并提交 dry-run..." />
          ) : null}
          {listingPreparationError ? (
            <Alert type="error" showIcon message={listingPreparationError} />
          ) : null}
          {realRunPending ? (
            <Alert
              type="info"
              showIcon
              message={`真实上架任务 ${realRunTaskView?.taskNo || realRunTaskView?.taskId || ''} 正在写入 Noon，请等待执行结果。`}
            />
          ) : realRunNotice ? (
            <Alert type={realRunNotice.type} showIcon message={realRunNotice.message} />
          ) : taskView ? (
            <Alert
              type={taskView.status === 'validated' && !realWriteAttemptLocked ? 'success' : 'warning'}
              showIcon
              message={dryRunReviewNotice(taskView, realWriteAttemptLocked, realRunTaskView)}
            />
          ) : null}
          {realRunTaskView?.failureCode === 'real_write_disabled' ? (
            <Alert type="warning" showIcon message="后端真实写入开关未开启，本次确认已记录为 rejected 任务。" />
          ) : null}
          {realRunTaskView?.failureCode === 'real_run_already_attempted' ? (
            <Alert type="warning" showIcon message="该 dry-run 已提交过真实上架尝试，请重新点击上架生成新的 dry-run。" />
          ) : null}
          {canContinueAfterCreate ? (
            <Alert
              type="warning"
              showIcon
              message={realRunReferences.skuParent && realRunReferences.pskuCode
                ? 'Noon 商品创建已返回 pskuCode / skuParent，但后续写入未完成。'
                : 'Noon 创建结果需要核对；继续时会先按 PSKU 查询 Noon，确认已创建后再写后续步骤，不会重复创建。'}
              action={
                <Button
                  danger
                  loading={continuingAfterCreate}
                  size="small"
                  onClick={() => void handleContinueAfterCreate()}
                >
                  继续写后续步骤
                </Button>
              }
            />
          ) : null}
          {realRunTaskView?.status === 'written_verify_failed' && realRunReferences.skuParent ? (
            <Alert
              type="warning"
              showIcon
              message="Noon 写入步骤已返回外部引用，但回读校验未通过；请按 pskuCode / skuParent 在 Noon 后台复核。"
              action={
                <Button loading={verifyingReadBack} size="small" onClick={() => void handleVerifyReadBack()}>
                  重新回读校验
                </Button>
              }
            />
          ) : null}

          <Card title="本次修改点" bordered={false} style={{ border: '1px solid #e5e7eb' }}>
            <Table
              size="small"
              pagination={false}
              dataSource={listingReviewChanges}
              rowKey={(record) => record.fieldKey}
              columns={[
                { title: '字段', dataIndex: 'label', width: 140 },
                {
                  title: '修改前',
                  dataIndex: 'before',
                  render: (value: string) => <Text style={{ wordBreak: 'break-word' }}>{value}</Text>
                },
                {
                  title: '修改后',
                  dataIndex: 'after',
                  render: (value: string) => <Text style={{ wordBreak: 'break-word' }}>{value}</Text>
                }
              ]}
              locale={{ emptyText: '未检测到相对上次草稿或来源预填的字段变更' }}
            />
          </Card>

          <Card title="Dry-run 结果" bordered={false} style={{ border: '1px solid #e5e7eb' }}>
            {taskView ? (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Descriptions size="small" column={{ xs: 1, md: 2 }}>
                  <Descriptions.Item label="任务号">{taskView.taskNo || taskView.taskId}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={statusColor(taskView.status)}>{taskView.status}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="PSKU">{taskView.partnerSku || '-'}</Descriptions.Item>
                  <Descriptions.Item label="失败代码">{taskView.failureCode || '-'}</Descriptions.Item>
                  <Descriptions.Item label="失败信息">{productListingTaskFailureMessage(taskView)}</Descriptions.Item>
                </Descriptions>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={taskView.validationIssues || []}
                  rowKey={(record, index) => `${record.fieldKey}-${record.code}-${index ?? 0}`}
                  columns={[
                    {
                      title: '字段',
                      dataIndex: 'fieldKey',
                      width: 150,
                      render: (value: string) => productListingValidationIssueLabel(value)
                    },
                    {
                      title: '级别',
                      dataIndex: 'severity',
                      width: 96,
                      render: (value: string) => <Tag color={value === 'warning' ? 'gold' : 'red'}>{value}</Tag>
                    },
                    {
                      title: '信息',
                      dataIndex: 'message',
                      render: (_: string, record) => productListingValidationIssueMessage(record)
                    }
                  ]}
                  locale={{ emptyText: '暂无校验问题' }}
                />
              </Space>
            ) : (
              <Text type="secondary">等待自动 dry-run 结果...</Text>
            )}
          </Card>

          {realRunTaskView ? (
            <Card title="真实上架任务" bordered={false} style={{ border: '1px solid #e5e7eb' }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Descriptions size="small" column={{ xs: 1, md: 3 }}>
                  <Descriptions.Item label="任务号">{realRunTaskView.taskNo || realRunTaskView.taskId}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={statusColor(realRunTaskView.status)}>{realRunTaskView.status}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="PSKU">{realRunTaskView.partnerSku || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Noon 结果">{realRunTaskView.failureCode || realRunTaskView.noonResult?.failureCode || '-'}</Descriptions.Item>
                  <Descriptions.Item label="失败信息">{realRunTaskView.failureMessage || realRunTaskView.noonResult?.failureMessage || '-'}</Descriptions.Item>
                </Descriptions>
                <Table<ProductListingNoonWriteStepResult>
                  className="product-listing-real-run-steps-table"
                  size="small"
                  tableLayout="fixed"
                  pagination={false}
                  dataSource={realRunTaskView.noonResult?.steps || []}
                  rowKey={(record, index) => `${record.stepKey || 'step'}-${index ?? 0}`}
                  columns={[
                    { title: '步骤', dataIndex: 'stepKey', width: 180 },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      width: 120,
                      render: (value: string) => <Tag color={statusColor(value)}>{value || '-'}</Tag>
                    },
                    {
                      title: '引用',
                      dataIndex: 'externalReference',
                      render: (value: string) => (
                        <Paragraph
                          className="product-listing-real-run-step-reference"
                          copyable={{ text: value || '' }}
                          ellipsis={{ rows: 3, expandable: true }}
                        >
                          {value || '-'}
                        </Paragraph>
                      )
                    },
                    { title: '失败代码', dataIndex: 'failureCode', width: 160 },
                    { title: 'Noon 错误', dataIndex: 'failureMessage', width: 180 }
                  ]}
                  locale={{ emptyText: '暂无真实上架步骤' }}
                />
              </Space>
            </Card>
          ) : null}

        </Space>
      </Modal>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="校验问题" bordered={false} style={{ border: '1px solid #e5e7eb' }}>
            <Table
              size="small"
              pagination={false}
              dataSource={validationIssues}
              rowKey={(record, index) => `${record.fieldKey}-${record.code}-${index ?? 0}`}
              columns={[
                {
                  title: '字段',
                  dataIndex: 'fieldKey',
                  width: 170,
                  render: (value: string) => productListingValidationIssueLabel(value)
                },
                {
                  title: '级别',
                  dataIndex: 'severity',
                  width: 110,
                  render: (value: string) => <Tag color={value === 'warning' ? 'gold' : 'red'}>{value}</Tag>
                },
                { title: '代码', dataIndex: 'code', width: 160 },
                {
                  title: '信息',
                  dataIndex: 'message',
                  render: (_: string, record) => productListingValidationIssueMessage(record)
                }
              ]}
              locale={{ emptyText: '暂无校验问题' }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card title="最近一次 dry-run" bordered={false} style={{ border: '1px solid #e5e7eb' }}>
              {taskView ? (
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="任务号">{taskView.taskNo || taskView.taskId}</Descriptions.Item>
                  <Descriptions.Item label="模式">{taskView.mode}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={statusColor(taskView.status)}>{taskView.status}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="失败代码">{taskView.failureCode || '-'}</Descriptions.Item>
                  <Descriptions.Item label="失败信息">{productListingTaskFailureMessage(taskView)}</Descriptions.Item>
                </Descriptions>
              ) : (
                <Text type="secondary">暂无 dry-run 结果</Text>
              )}
            </Card>
            <Card title="最近上架任务" bordered={false} style={{ border: '1px solid #e5e7eb' }}>
              <Table
                size="small"
                pagination={false}
                loading={loadingRecentTasks}
                dataSource={recentTasks.slice(0, 5)}
                rowKey={(record) => String(record.taskId)}
                columns={[
                  {
                    title: '任务',
                    dataIndex: 'taskNo',
                    render: (value: string | undefined, record: ProductListingTaskView) => value || record.taskId
                  },
                  { title: '模式', dataIndex: 'mode', width: 92 },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    width: 130,
                    render: (value: string) => <Tag color={statusColor(value)}>{value}</Tag>
                  }
                ]}
                locale={{ emptyText: '暂无上架任务' }}
              />
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  )
}

function statusColor(status: string) {
  if (status === 'validated' || status === 'ready_for_dry_run' || status === 'succeeded') {
    return 'green'
  }
  if (status === 'validation_failed' || status === 'failed' || status === 'written_verify_failed') {
    return 'red'
  }
  if (status === 'draft' || status === 'submitted' || status === 'running') {
    return 'blue'
  }
  if (status === 'rejected') {
    return 'orange'
  }
  return 'default'
}

function realRunConfirmationBlockedReason(params: {
  saving: boolean
  submitting: boolean
  taskView?: ProductListingTaskView
  realRunTaskView?: ProductListingTaskView
  realWriteAttemptLocked: boolean
}) {
  const { realRunTaskView, realWriteAttemptLocked, saving, submitting, taskView } = params
  if (saving || submitting) {
    return '当前不能确认上架：正在自动保存草稿并提交 dry-run，请等待 dry-run 通过后再确认上架。'
  }
  if (!taskView?.taskId) {
    return '当前不能确认上架：还没有可确认的 dry-run 任务，请先点击上架生成 dry-run。'
  }
  if (taskView.status !== 'validated') {
    const dryRunFailureSummary = productListingDryRunFailureSummary(taskView)
    return dryRunFailureSummary
      ? `当前不能确认上架：${dryRunFailureSummary}`
      : '当前不能确认上架：dry-run 未通过，请先处理校验问题后重新点击上架。'
  }
  if (isProductListingTaskPending(realRunTaskView?.status)) {
    return '真实上架任务正在执行，请等待执行结果。'
  }
  if (!realWriteAttemptLocked) {
    return ''
  }
  if (realRunTaskView?.failureCode === 'real_write_disabled') {
    return '当前不能确认上架：后端真实写入开关未开启，本次确认已记录为拦截任务；请重新点击上架生成新的 dry-run 后再重试。'
  }
  if (realRunTaskView?.failureCode === 'real_run_already_attempted') {
    return '当前不能确认上架：该 dry-run 已提交过真实上架尝试，请重新点击上架生成新的 dry-run。'
  }
  if (realRunTaskView?.status === 'succeeded') {
    return '该 dry-run 已完成真实上架，不能重复提交。请重新点击上架生成新的 dry-run。'
  }
  return '当前不能确认上架：该 dry-run 已有真实上架尝试，请重新点击上架生成新的 dry-run。'
}

function dryRunReviewNotice(
  task: ProductListingTaskView,
  realWriteAttemptLocked: boolean,
  realRunTask?: ProductListingTaskView
) {
  if (task.status !== 'validated') {
    const issueSummary = productListingDryRunFailureSummary(task)
    return issueSummary
      ? `dry-run 未通过：${issueSummary}`
      : 'dry-run 未通过，请先处理校验问题后重新点击上架。'
  }
  if (!realWriteAttemptLocked) {
    return 'dry-run 已通过，可以确认上架。'
  }
  if (isProductListingTaskPending(realRunTask?.status)) {
    return `真实上架任务 ${realRunTask?.taskNo || realRunTask?.taskId || ''} 正在写入 Noon，请等待执行结果。`
  }
  if (realRunTask?.status === 'succeeded') {
    return '该 dry-run 已完成真实上架，不能重复提交。需要再次测试请重新点击上架生成新的 dry-run。'
  }
  return '该 dry-run 已有真实上架尝试，不能重复提交。请重新点击上架生成新的 dry-run。'
}

function notifyRealRunTaskCompletion(task: ProductListingTaskView) {
  if (task.status === 'succeeded') {
    message.success('真实上架成功，Noon 回读已通过')
  } else if (task.status === 'failed' || task.status === 'written_verify_failed') {
    message.error(task.failureMessage || task.noonResult?.failureMessage || '真实上架失败')
  } else if (task.status === 'rejected') {
    message.warning(task.failureMessage || '真实上架已被后端门禁拦截')
  }
}

function realRunTaskCompletionNotice(task: ProductListingTaskView): ProductListingNotice | undefined {
  if (task.status === 'succeeded') {
    return { type: 'success', message: '真实上架成功，Noon 回读已通过。需要再次测试请重新点击上架生成新的 dry-run。' }
  }
  if (task.status === 'written_verify_failed') {
    if (task.failureCode === 'noon_create_outcome_unknown') {
      return { type: 'warning', message: 'Noon 创建结果未知，尚不能确认是否已写入；请使用安全恢复查询 Noon 后继续。' }
    }
    if (task.failureCode === 'real_run_interrupted') {
      return { type: 'warning', message: '真实上架执行被中断，尚不能确认完整写入；请使用安全恢复查询 Noon 后继续。' }
    }
    return { type: 'warning', message: 'Noon 已返回写入结果，但回读校验未通过，请按 pskuCode / skuParent 复核。' }
  }
  if (task.failureCode === 'real_write_disabled') {
    return { type: 'warning', message: '后端真实写入开关未开启，本次确认已记录为 rejected 任务。' }
  }
  if (task.status === 'rejected') {
    return { type: 'warning', message: task.failureMessage || '真实上架已被后端门禁拦截。' }
  }
  if (task.status === 'failed') {
    return { type: 'error', message: task.failureMessage || task.noonResult?.failureMessage || '真实上架失败。' }
  }
  return undefined
}

function realRunRecoveryDescription(
  task: ProductListingTaskView | undefined,
  references: ReturnType<typeof extractNoonWriteReferences>
) {
  if (references.skuParent && references.pskuCode) {
    return '已取得 Noon 商品引用，将直接继续未完成步骤，不会重复创建商品。'
  }
  if (task?.failureCode === 'real_run_interrupted') {
    return '任务执行曾中断。系统会先按 PSKU 查询 Noon，确认创建结果后再继续，不会重复创建商品。'
  }
  return 'Noon 创建结果未知。系统会先按 PSKU 查询 Noon，确认创建结果后再继续，不会重复创建商品。'
}

function canContinueRealRunAfterCreate(
  task: ProductListingTaskView | undefined,
  references: ReturnType<typeof extractNoonWriteReferences>
) {
  if (!task || task.status === 'succeeded' || isProductListingTaskPending(task.status)) {
    return false
  }
  const needsCreateReferenceRecovery = task.status === 'written_verify_failed' && (
    task.failureCode === 'noon_create_outcome_unknown' || task.failureCode === 'real_run_interrupted'
  )
  return needsCreateReferenceRecovery || Boolean(
    references.skuParent && references.pskuCode && task.noonResult?.success === false
  )
}

function extractNoonWriteReferences(result?: ProductListingNoonWriteResult) {
  const references = {
    skuParent: '',
    pskuCode: '',
    readBackAttempts: ''
  }
  for (const step of result?.steps ?? []) {
    const parsed = parseExternalReference(step.externalReference)
    if (!references.skuParent && parsed.skuParent) {
      references.skuParent = parsed.skuParent
    }
    if (!references.pskuCode && parsed.pskuCode) {
      references.pskuCode = parsed.pskuCode
    }
    if (step.stepKey === 'verify_noon_readback' && parsed.readBackAttempts) {
      references.readBackAttempts = parsed.readBackAttempts
    }
  }
  return references
}

function parseExternalReference(value?: string) {
  const result: Record<string, string> = {}
  for (const part of value?.split(';') ?? []) {
    const separatorIndex = part.indexOf('=')
    if (separatorIndex <= 0) {
      continue
    }
    const key = part.slice(0, separatorIndex).trim()
    const referenceValue = part.slice(separatorIndex + 1).trim()
    if (key && referenceValue) {
      result[key] = referenceValue
    }
  }
  return result
}

function mergeRecentTask(tasks: ProductListingTaskView[], task: ProductListingTaskView) {
  return [task, ...tasks.filter((item) => item.taskId !== task.taskId)]
    .sort((left, right) => {
      const leftTime = Date.parse(left.submittedAt || '')
      const rightTime = Date.parse(right.submittedAt || '')
      if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
        return rightTime - leftTime
      }
      return right.taskId - left.taskId
    })
    .slice(0, 10)
}
