import { CheckCircleOutlined, PlayCircleOutlined, SaveOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { normalizeError } from '../../shared/api'
import { confirmProductListingRealRun, saveProductListingDraft, submitProductListingDryRun } from './api'
import type {
  ProductListingDraftPayload,
  ProductListingDraftView,
  ProductListingTaskView
} from './types'

const { Text, Title } = Typography

type ProductListingPageProps = {
  storeCode?: string
}

type ProductListingFormValues = {
  draftId?: number
  storeCode?: string
  psku?: string
  idProductFullType?: number
  productFullType?: string
  family?: string
  productType?: string
  productSubType?: string
  productBrand?: string
  productBrandCode?: string
  productTitleEn?: string
  productTitleAr?: string
  imageUrlsText?: string
  price?: number
  purchasePrice?: number
  supplyEvidenceType?: string
  supplyEvidenceRefId?: number
  optionalPurchaseOrderId?: number
  fbp?: boolean
  warehouseId?: string
  quantity?: number
  idWarranty?: number
  barcode?: string
}

const SUPPLY_EVIDENCE_OPTIONS = [
  { label: '1688 报价', value: '1688_OFFER' },
  { label: '人工报价', value: 'MANUAL_QUOTE' },
  { label: '历史采购', value: 'PURCHASE_HISTORY' },
  { label: '其他凭证', value: 'OTHER' }
]

export function ProductListingPage({ storeCode }: ProductListingPageProps) {
  const [form] = Form.useForm<ProductListingFormValues>()
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmingRealRun, setConfirmingRealRun] = useState(false)
  const [realRunConfirmOpen, setRealRunConfirmOpen] = useState(false)
  const [draftView, setDraftView] = useState<ProductListingDraftView>()
  const [taskView, setTaskView] = useState<ProductListingTaskView>()
  const [realRunTaskView, setRealRunTaskView] = useState<ProductListingTaskView>()

  useEffect(() => {
    if (storeCode && !form.getFieldValue('storeCode')) {
      form.setFieldValue('storeCode', storeCode)
    }
  }, [form, storeCode])

  const validationIssues = useMemo(() => {
    if (taskView?.validationIssues?.length) {
      return taskView.validationIssues
    }
    return draftView?.validationIssues ?? []
  }, [draftView?.validationIssues, taskView?.validationIssues])

  const saveDraftFromForm = async (options?: { silent?: boolean }) => {
    setSaving(true)
    try {
      const payload = formValuesToPayload(form.getFieldsValue(), draftView?.draftId)
      const saved = await saveProductListingDraft(payload)
      setDraftView(saved)
      setTaskView(undefined)
      setRealRunTaskView(undefined)
      applyDraftToForm(form, saved.draft ?? payload)
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
    if (!taskView?.taskId || taskView.status !== 'validated') {
      return
    }
    setRealRunConfirmOpen(true)
  }

  const handleConfirmRealRunOk = async () => {
    if (!taskView?.taskId || taskView.status !== 'validated') {
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
      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            商品上架
          </Title>
          <Text type="secondary">{draftView?.draftNo || '未保存草稿'}</Text>
        </div>
        <Space>
          {draftView?.status ? <Tag color={statusColor(draftView.status)}>{draftView.status}</Tag> : null}
          {taskView?.status ? <Tag color={statusColor(taskView.status)}>{taskView.status}</Tag> : null}
        </Space>
      </Space>

      <Alert type="info" showIcon message="保存草稿和 dry-run 不会写入 Noon；真实上架必须由人工确认，并通过后端开关和任务锁。" />

      <Form form={form} layout="vertical" initialValues={{ fbp: true, storeCode }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card title="基础信息" bordered={false} style={{ border: '1px solid #e5e7eb' }}>
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item label="店铺编码" name="storeCode">
                    <Input placeholder="STR245027-NAE" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="PSKU" name="psku">
                    <Input placeholder="NN-PSKU-001" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="采购单 ID（可选）" name="optionalPurchaseOrderId">
                    <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="条码" name="barcode">
                    <Input placeholder="6290000000001" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} xl={12}>
            <Card title="Noon 内容" bordered={false} style={{ border: '1px solid #e5e7eb' }}>
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item label="品牌" name="productBrand">
                    <Input placeholder="Generic" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="品牌编码" name="productBrandCode">
                    <Input placeholder="generic" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Fulltype ID" name="idProductFullType">
                    <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Fulltype" name="productFullType">
                    <Input placeholder="family-type-subtype" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Family" name="family">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="Type" name="productType">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label="SubType" name="productSubType">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="英文标题" name="productTitleEn">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="阿文标题" name="productTitleAr">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="图片 URL" name="imageUrlsText">
                    <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="每行一个 URL" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} xl={12}>
            <Card title="成本与供应" bordered={false} style={{ border: '1px solid #e5e7eb' }}>
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item label="销售价" name="price">
                    <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="采购价" name="purchasePrice">
                    <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="供应凭证" name="supplyEvidenceType">
                    <Select options={SUPPLY_EVIDENCE_OPTIONS} allowClear />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="供应凭证 ID" name="supplyEvidenceRefId">
                    <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} xl={12}>
            <Card title="履约" bordered={false} style={{ border: '1px solid #e5e7eb' }}>
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item label="FBP" name="fbp" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="仓库 ID" name="warehouseId">
                    <Input placeholder="W00752151SA" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="数量" name="quantity">
                    <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="质保 ID" name="idWarranty">
                    <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>

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
                onClick={() => void handleConfirmRealRun()}
              >
                确认真实上架
              </Button>
            </Space>
            {realRunTaskView?.failureCode === 'real_write_disabled' ? (
              <Alert type="warning" showIcon message="后端真实写入开关未开启，本次确认已记录为 rejected 任务。" />
            ) : null}
            {realRunTaskView ? (
              <Descriptions size="small" column={{ xs: 1, md: 2 }}>
                <Descriptions.Item label="任务号">{realRunTaskView.taskNo || realRunTaskView.taskId}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusColor(realRunTaskView.status)}>{realRunTaskView.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="来源任务">{realRunTaskView.sourceTaskId || '-'}</Descriptions.Item>
                <Descriptions.Item label="失败分类">{realRunTaskView.failureCategory || '-'}</Descriptions.Item>
                <Descriptions.Item label="失败代码">{realRunTaskView.failureCode || '-'}</Descriptions.Item>
                <Descriptions.Item label="失败信息">{realRunTaskView.failureMessage || '-'}</Descriptions.Item>
              </Descriptions>
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

function formValuesToPayload(values: ProductListingFormValues, currentDraftId?: number): ProductListingDraftPayload {
  return {
    draftId: values.draftId ?? currentDraftId,
    storeCode: text(values.storeCode),
    psku: text(values.psku),
    idProductFullType: values.idProductFullType,
    productFullType: optionalText(values.productFullType),
    family: optionalText(values.family),
    productType: optionalText(values.productType),
    productSubType: optionalText(values.productSubType),
    productBrand: optionalText(values.productBrand),
    productBrandCode: optionalText(values.productBrandCode),
    productTitleEn: optionalText(values.productTitleEn),
    productTitleAr: optionalText(values.productTitleAr),
    imageUrls: parseImageUrls(values.imageUrlsText),
    price: values.price,
    purchasePrice: values.purchasePrice,
    supplyEvidenceType: optionalText(values.supplyEvidenceType),
    supplyEvidenceRefId: values.supplyEvidenceRefId,
    optionalPurchaseOrderId: values.optionalPurchaseOrderId,
    fbp: values.fbp,
    warehouseId: optionalText(values.warehouseId),
    quantity: values.quantity,
    idWarranty: values.idWarranty,
    barcode: optionalText(values.barcode)
  }
}

function applyDraftToForm(form: ReturnType<typeof Form.useForm<ProductListingFormValues>>[0], draft: ProductListingDraftPayload) {
  form.setFieldsValue({
    ...draft,
    imageUrlsText: draft.imageUrls?.join('\n') ?? ''
  })
}

function parseImageUrls(value?: string) {
  return (value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function text(value?: string) {
  return (value || '').trim()
}

function optionalText(value?: string) {
  const trimmed = text(value)
  return trimmed || undefined
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
  return 'default'
}
