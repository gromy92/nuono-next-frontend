import { CheckCircleOutlined, PlayCircleOutlined, SaveOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeError } from '../../shared/api'
import { loadManualSelectionGroup, loadManualSelectionGroupProfitEstimate } from '../manual-selection/api'
import { ProductListingDetailEditor } from './ProductListingDetailEditor'
import {
  confirmProductListingRealRun,
  fetchProductListingTask,
  fetchRecentProductListingTasks,
  saveProductListingDraft,
  submitProductListingDryRun
} from './api'
import {
  createProductListingEditorDraft,
  normalizeProductListingEditorDraft,
  productListingEditorDraftToMetadataValues,
  productListingEditorDraftToPayload,
  type ProductListingEditorDraft,
  type ProductListingMetadataFormValues
} from './productDetailAdapter'
import {
  buildManualSelectionGroupListingPrefillFromGroup,
  readProductListingSourcePrefill,
  type ProductListingSourcePrefill
} from './sourcePrefill'
import { recoverProductListingTasksFromRecent } from './taskRecovery'
import {
  isProductListingRealWriteAttempt,
  isProductListingTaskPending,
  isProductListingTaskTerminal
} from './taskStatus'
import type { ManualSelectionGroupProfitEstimateSnapshot } from '../manual-selection/types'
import type { ProductListingDraftView, ProductListingTaskView } from './types'

const { Text } = Typography

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
  const [realRunConfirmOpen, setRealRunConfirmOpen] = useState(false)
  const [draftView, setDraftView] = useState<ProductListingDraftView>()
  const [taskView, setTaskView] = useState<ProductListingTaskView>()
  const [realRunTaskView, setRealRunTaskView] = useState<ProductListingTaskView>()
  const [recentTasks, setRecentTasks] = useState<ProductListingTaskView[]>([])
  const [loadingRecentTasks, setLoadingRecentTasks] = useState(false)
  const [sourcePrefill, setSourcePrefill] = useState<ProductListingSourcePrefill>()
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
    if (storeCode && !listingDraft.storeCode) {
      const nextDraft = normalizeProductListingEditorDraft({ ...listingDraft, storeCode }, storeCode)
      setListingDraft(nextDraft)
      form.setFieldsValue(productListingEditorDraftToMetadataValues(nextDraft))
    }
  }, [form, listingDraft, storeCode])

  useEffect(() => {
    const prefill = readProductListingSourcePrefill()
    if (!prefill) {
      return
    }
    let cancelled = false
    const applyPrefill = (nextPrefill: ProductListingSourcePrefill) => {
      if (cancelled) {
        return
      }
      setSourcePrefill(nextPrefill)
      const currentDraft = listingDraftRef.current
      const nextDraft = normalizeProductListingEditorDraft(
        {
          ...currentDraft,
          ...nextPrefill.draft,
          storeCode: nextPrefill.draft.storeCode || currentDraft.storeCode || storeCode
        },
        storeCode
      )
      listingDraftRef.current = nextDraft
      setListingDraft(nextDraft)
      form.setFieldsValue(productListingEditorDraftToMetadataValues(nextDraft))
    }

    if (prefill.pendingServerHydration && prefill.sourceGroupId) {
      setSourcePrefill(prefill)
      void loadManualSelectionGroupListingPrefill(prefill.sourceGroupId, storeCode)
        .then(applyPrefill)
        .catch((error) => {
          if (!cancelled) {
            message.warning(normalizeError(error, '读取选品组资料失败，请重新从人工选品进入上架'))
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
  const realWriteAttemptLocked = hasRealWriteAttempt(realRunTaskView)
  const recentTasksStoreCode = listingDraft.storeCode || storeCode || ''

  useEffect(() => {
    if (!recentTasksStoreCode) {
      return
    }
    let cancelled = false
    setLoadingRecentTasks(true)
    void fetchRecentProductListingTasks(recentTasksStoreCode, 10)
      .then((tasks) => {
        if (cancelled) {
          return
        }
        setRecentTasks(tasks)
        const recovered = recoverProductListingTasksFromRecent(tasks)
        if (!taskViewRef.current && recovered.dryRunTask) {
          setTaskView(recovered.dryRunTask)
        }
        if (!realRunTaskViewRef.current && recovered.realRunTask) {
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
  }, [recentTasksStoreCode])

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

  const saveDraftFromForm = async (options?: { silent?: boolean }) => {
    setSaving(true)
    try {
      const currentDraft = normalizeProductListingEditorDraft(
        {
          ...listingDraft,
          ...form.getFieldsValue()
        },
        storeCode
      )
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
        message.success('上架草稿已保存')
      }
      return saved
    } catch (error) {
      message.error(normalizeError(error, '保存上架草稿失败'))
      return undefined
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitDryRun = async () => {
    const saved = await saveDraftFromForm({ silent: true })
    if (!saved?.draftId) {
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
      message.success(submitted.status === 'validated' ? 'dry-run 已通过' : 'dry-run 已生成校验结果')
    } catch (error) {
      message.error(normalizeError(error, '提交上架 dry-run 失败'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmRealRun = () => {
    if (!taskView?.taskId || taskView.status !== 'validated' || realWriteAttemptLocked) {
      return
    }
    setRealRunConfirmOpen(true)
  }

  const handleConfirmRealRunOk = async () => {
    if (!taskView?.taskId || taskView.status !== 'validated' || realWriteAttemptLocked) {
      return
    }
    setConfirmingRealRun(true)
    try {
      const realRun = await confirmProductListingRealRun(taskView.taskId, {
        confirmRealNoonWrite: true,
        confirmationNote: 'confirmed from product listing page'
      })
      setRealRunTaskView(realRun)
      setRecentTasks((current) => mergeRecentTask(current, realRun))
      setRealRunConfirmOpen(false)
      if (realRun.status === 'succeeded') {
        message.success('真实上架任务已完成')
      } else if (realRun.failureCode === 'real_write_disabled') {
        message.warning('真实写入开关未开启，后端已记录拦截任务')
      } else if (realRun.status === 'rejected') {
        message.warning(realRun.failureMessage || '真实上架已被后端门禁拦截')
      } else if (realRun.status === 'failed') {
        message.error(realRun.failureMessage || '真实上架失败')
      } else {
        message.info('真实上架任务已提交')
      }
    } catch (error) {
      message.error(normalizeError(error, '确认真实上架失败'))
    } finally {
      setConfirmingRealRun(false)
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert type="info" showIcon message="保存草稿和 dry-run 不会写入 Noon；真实上架必须由人工确认，并通过后端开关和任务锁。" />

      {sourcePrefill ? (
        <Alert
          type="success"
          showIcon
          message="来源：人工采集"
          description={
            <Space wrap size={[8, 4]}>
              <Text>{sourcePrefillReference(sourcePrefill)}</Text>
              {sourcePrefill.pendingServerHydration ? <Text type="secondary">正在读取选品组资料...</Text> : null}
              {sourcePrefill.sourcePlatform ? <Tag>{sourcePrefill.sourcePlatform}</Tag> : null}
              {sourcePrefill.sourceTitleCn ? <Text type="secondary">{sourcePrefill.sourceTitleCn}</Text> : null}
              {sourcePrefill.sourceUrl ? (
                <Typography.Link href={sourcePrefill.sourceUrl} target="_blank" rel="noreferrer">
                  查看来源
                </Typography.Link>
              ) : null}
            </Space>
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

      <Card variant="borderless" style={{ border: '1px solid #dbe4ea' }}>
        <ProductListingDetailEditor
          competitorMaterials={sourcePrefill?.competitorMaterials}
          draft={listingDraft}
          onDraftChange={setListingDraft}
        />
      </Card>

      <Space>
        <Button icon={<SaveOutlined />} loading={saving} onClick={() => void saveDraftFromForm()}>
          保存草稿
        </Button>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={saving || submitting}
          onClick={() => void handleSubmitDryRun()}
        >
          提交 dry-run
        </Button>
      </Space>

      {taskView?.status === 'validated' ? (
        <Card title="真实上架确认" bordered={false} style={{ border: '1px solid #e5e7eb' }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">来源 dry-run：{taskView.taskNo || taskView.taskId}</Text>
              <Button
                danger
                icon={<CheckCircleOutlined />}
                loading={confirmingRealRun}
                disabled={realWriteAttemptLocked}
                onClick={() => void handleConfirmRealRun()}
              >
                确认真实上架
              </Button>
            </Space>
            {realRunTaskView?.failureCode === 'real_write_disabled' ? (
              <Alert type="warning" showIcon message="后端真实写入开关未开启，本次确认已记录为 rejected 任务。" />
            ) : null}
            {realRunTaskView?.failureCode === 'real_run_already_attempted' ? (
              <Alert type="warning" showIcon message="该 dry-run 已提交过真实上架尝试，请重新 dry-run 后再操作。" />
            ) : null}
            {realRunTaskView ? (
              <>
                <Descriptions size="small" column={{ xs: 1, md: 2 }}>
                  <Descriptions.Item label="任务号">{realRunTaskView.taskNo || realRunTaskView.taskId}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={statusColor(realRunTaskView.status)}>{realRunTaskView.status}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="PSKU">{realRunTaskView.partnerSku || '-'}</Descriptions.Item>
                  <Descriptions.Item label="来源任务">{realRunTaskView.sourceTaskId || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Noon 结果">{noonResultStatus(realRunTaskView)}</Descriptions.Item>
                  <Descriptions.Item label="失败分类">{realRunTaskView.failureCategory || '-'}</Descriptions.Item>
                  <Descriptions.Item label="失败代码">{realRunTaskView.failureCode || '-'}</Descriptions.Item>
                  <Descriptions.Item label="失败信息">{realRunTaskView.failureMessage || '-'}</Descriptions.Item>
                </Descriptions>
                {realRunTaskView.noonResult?.steps?.length ? (
                  <Space direction="vertical" size={4}>
                    {realRunTaskView.noonResult.steps.map((step, index) => (
                      <Space key={`${step.stepKey || 'step'}-${index}`} wrap size={[8, 4]}>
                        <Tag color={statusColor(step.status || '')}>{step.status || '-'}</Tag>
                        <Text>{step.stepKey || `step-${index + 1}`}</Text>
                        {step.externalReference ? <Text type="secondary">{step.externalReference}</Text> : null}
                        {step.failureCode ? <Text type="danger">{step.failureCode}</Text> : null}
                        {step.failureMessage ? <Text type="danger">{step.failureMessage}</Text> : null}
                      </Space>
                    ))}
                  </Space>
                ) : null}
              </>
            ) : (
              <Text type="secondary">尚未提交真实上架确认</Text>
            )}
          </Space>
        </Card>
      ) : null}

      <Modal
        title="确认真实上架到 Noon"
        open={realRunConfirmOpen}
        okText="确认上架"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={confirmingRealRun}
        maskClosable={!confirmingRealRun}
        onOk={() => void handleConfirmRealRunOk()}
        onCancel={() => {
          if (!confirmingRealRun) {
            setRealRunConfirmOpen(false)
          }
        }}
      >
        将使用当前 validated dry-run 快照写入 Noon，执行前仍由后端开关和任务锁校验。
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
                { title: '字段', dataIndex: 'fieldKey', width: 170 },
                {
                  title: '级别',
                  dataIndex: 'severity',
                  width: 110,
                  render: (value: string) => <Tag color={value === 'warning' ? 'gold' : 'red'}>{value}</Tag>
                },
                { title: '代码', dataIndex: 'code', width: 160 },
                { title: '信息', dataIndex: 'message' }
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
                  <Descriptions.Item label="失败信息">{taskView.failureMessage || '-'}</Descriptions.Item>
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
    </Space>
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

function noonResultStatus(task: ProductListingTaskView) {
  if (!task.noonResult) {
    return '-'
  }
  if (task.noonResult.success) {
    return <Tag color="green">success</Tag>
  }
  return <Tag color="red">{task.noonResult.failureCode || 'failed'}</Tag>
}

function notifyRealRunTaskCompletion(task: ProductListingTaskView) {
  if (task.status === 'succeeded') {
    message.success('真实上架任务已完成')
  } else if (task.status === 'failed' || task.status === 'written_verify_failed') {
    message.error(task.failureMessage || task.noonResult?.failureMessage || '真实上架失败')
  } else if (task.status === 'rejected') {
    message.warning(task.failureMessage || '真实上架已被后端门禁拦截')
  }
}

async function loadManualSelectionGroupListingPrefill(sourceGroupId: string, storeCode?: string) {
  const group = await loadManualSelectionGroup(sourceGroupId)
  let profitEstimate: ManualSelectionGroupProfitEstimateSnapshot | null = null
  try {
    profitEstimate = await loadManualSelectionGroupProfitEstimate(sourceGroupId)
  } catch {
    profitEstimate = null
  }
  return buildManualSelectionGroupListingPrefillFromGroup(group, storeCode, profitEstimate)
}

function sourcePrefillReference(sourcePrefill: ProductListingSourcePrefill) {
  return (
    sourcePrefill.collectionNo
    || sourcePrefill.sourceGroupNo
    || sourcePrefill.sourceGroupId
    || sourcePrefill.sourceCollectionId
    || sourcePrefill.sourceCandidateId
    || '-'
  )
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

function hasRealWriteAttempt(task?: ProductListingTaskView) {
  return isProductListingRealWriteAttempt(task)
}
