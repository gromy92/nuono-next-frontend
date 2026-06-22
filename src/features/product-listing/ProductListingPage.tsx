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
import { useEffect, useMemo, useState } from 'react'
import { normalizeError } from '../../shared/api'
import { ProductListingDetailEditor } from './ProductListingDetailEditor'
import {
  confirmProductListingRealRun,
  fetchProductListingTask,
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
import { readProductListingSourcePrefill, type ProductListingSourcePrefill } from './sourcePrefill'
import type {
  ProductListingDraftView,
  ProductListingNoonWriteResult,
  ProductListingNoonWriteStepResult,
  ProductListingTaskView
} from './types'

const { Text } = Typography

const REAL_RUN_WRITE_STEPS = [
  'create_product',
  'sku_cache',
  'upsert_zsku_base',
  'upload_images',
  'upsert_zsku_content_en',
  'upsert_zsku_content_ar',
  'upsert_price',
  'verify_noon_readback'
] as const

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
  const [pollingRealRun, setPollingRealRun] = useState(false)
  const [realRunPollError, setRealRunPollError] = useState<string>()
  const [sourcePrefill, setSourcePrefill] = useState<ProductListingSourcePrefill>()

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
    setSourcePrefill(prefill)
    const nextDraft = normalizeProductListingEditorDraft(
      {
        ...listingDraft,
        ...prefill.draft,
        storeCode: prefill.draft.storeCode || listingDraft.storeCode || storeCode
      },
      storeCode
    )
    setListingDraft(nextDraft)
    form.setFieldsValue(productListingEditorDraftToMetadataValues(nextDraft))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, storeCode])

  const validationIssues = useMemo(() => {
    if (taskView?.validationIssues?.length) {
      return taskView.validationIssues
    }
    return draftView?.validationIssues ?? []
  }, [draftView?.validationIssues, taskView?.validationIssues])
  const realWriteAttemptLocked = hasRealWriteAttempt(realRunTaskView)
  const realRunReferences = useMemo(
    () => extractNoonWriteReferences(realRunTaskView?.noonResult),
    [realRunTaskView?.noonResult]
  )
  const realRunStepRows = useMemo(
    () => buildNoonWriteStepRows(realRunTaskView?.noonResult?.steps),
    [realRunTaskView?.noonResult?.steps]
  )

  useEffect(() => {
    const taskId = realRunTaskView?.taskId
    if (!taskId || !isActiveRealRunStatus(realRunTaskView.status)) {
      setPollingRealRun(false)
      return
    }
    let disposed = false
    setPollingRealRun(true)
    setRealRunPollError(undefined)

    const pollTask = async () => {
      try {
        const refreshed = await fetchProductListingTask(taskId)
        if (disposed) {
          return
        }
        setRealRunTaskView(refreshed)
        setRealRunPollError(undefined)
      } catch (error) {
        if (!disposed) {
          setRealRunPollError(normalizeError(error, '刷新真实上架任务失败'))
        }
      }
    }

    void pollTask()
    const timer = window.setInterval(() => {
      void pollTask()
    }, 3000)

    return () => {
      disposed = true
      window.clearInterval(timer)
      setPollingRealRun(false)
    }
  }, [realRunTaskView?.status, realRunTaskView?.taskId])

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
          message={`来源：${sourcePrefill.source === 'pre-order-profit' ? '选品池' : '人工采集'}`}
          description={
            <Space wrap size={[8, 4]}>
              <Text>
                {sourcePrefill.collectionNo || sourcePrefill.sourceCollectionId || sourcePrefill.sourceCandidateId}
              </Text>
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
        <ProductListingDetailEditor draft={listingDraft} onDraftChange={setListingDraft} />
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
            {realRunPollError ? <Alert type="warning" showIcon message={realRunPollError} /> : null}
            {realRunTaskView ? (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Descriptions size="small" column={{ xs: 1, md: 2 }}>
                  <Descriptions.Item label="任务号">{realRunTaskView.taskNo || realRunTaskView.taskId}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Space size={8}>
                      <Tag color={statusColor(realRunTaskView.status)}>{realRunTaskView.status}</Tag>
                      {pollingRealRun ? <Tag color="blue">polling</Tag> : null}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="来源任务">{realRunTaskView.sourceTaskId || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Partner SKU">{realRunTaskView.partnerSku || '-'}</Descriptions.Item>
                  <Descriptions.Item label="pskuCode">{realRunReferences.pskuCode || '-'}</Descriptions.Item>
                  <Descriptions.Item label="skuParent">{realRunReferences.skuParent || '-'}</Descriptions.Item>
                  <Descriptions.Item label="readback attempts">
                    {realRunReferences.readBackAttempts || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="失败分类">{realRunTaskView.failureCategory || '-'}</Descriptions.Item>
                  <Descriptions.Item label="失败代码">{realRunTaskView.failureCode || '-'}</Descriptions.Item>
                  <Descriptions.Item label="失败信息">{realRunTaskView.failureMessage || '-'}</Descriptions.Item>
                </Descriptions>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={realRunStepRows}
                  rowKey="rowKey"
                  columns={[
                    { title: '步骤', dataIndex: 'stepKey', width: 210 },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      width: 110,
                      render: (value: string) => <Tag color={statusColor(value)}>{value}</Tag>
                    },
                    {
                      title: '引用',
                      dataIndex: 'externalReference',
                      width: 260,
                      render: (value?: string) => value || '-'
                    },
                    {
                      title: '失败代码',
                      dataIndex: 'failureCode',
                      width: 170,
                      render: (value?: string) => value || '-'
                    },
                    {
                      title: 'Noon 错误',
                      dataIndex: 'failureMessage',
                      render: (value?: string) =>
                        value ? (
                          <Typography.Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 2, expandable: true }}>
                            {value}
                          </Typography.Paragraph>
                        ) : (
                          '-'
                        )
                    }
                  ]}
                  locale={{ emptyText: '暂无 Noon 写入步骤' }}
                />
              </Space>
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
        </Col>
      </Row>
    </Space>
  )
}

function statusColor(status: string) {
  if (status === 'validated' || status === 'ready_for_dry_run' || status === 'succeeded') {
    return 'green'
  }
  if (status === 'validation_failed' || status === 'failed') {
    return 'red'
  }
  if (status === 'draft' || status === 'submitted' || status === 'running') {
    return 'blue'
  }
  if (status === 'rejected') {
    return 'orange'
  }
  if (status === 'skipped' || status === 'not_started') {
    return 'default'
  }
  return 'default'
}

function hasRealWriteAttempt(task?: ProductListingTaskView) {
  if (!task) {
    return false
  }
  return (
    ['running', 'submitted', 'succeeded', 'failed'].includes(task.status) ||
    task.failureCode === 'real_run_already_active' ||
    task.failureCode === 'real_run_already_attempted'
  )
}

function isActiveRealRunStatus(status?: string) {
  return status === 'running' || status === 'submitted'
}

type ProductListingWriteStepRow = ProductListingNoonWriteStepResult & {
  rowKey: string
}

function buildNoonWriteStepRows(steps?: ProductListingNoonWriteStepResult[]): ProductListingWriteStepRow[] {
  const byStepKey = new Map((steps ?? []).map((step) => [step.stepKey, step]))
  const rows = REAL_RUN_WRITE_STEPS.map<ProductListingWriteStepRow>((stepKey) => {
    const step = byStepKey.get(stepKey)
    return {
      rowKey: stepKey,
      stepKey,
      status: step?.status ?? 'not_started',
      externalReference: step?.externalReference,
      failureCode: step?.failureCode,
      failureMessage: step?.failureMessage
    }
  })
  for (const step of steps ?? []) {
    if (!REAL_RUN_WRITE_STEPS.includes(step.stepKey as (typeof REAL_RUN_WRITE_STEPS)[number])) {
      rows.push({
        ...step,
        rowKey: `${step.stepKey}-${rows.length}`
      })
    }
  }
  return rows
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
