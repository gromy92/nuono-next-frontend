import { Alert, Button, Card, Modal, Space, Table, Tag, Typography } from 'antd'
import type { ProductListingChangeSummaryItem } from './productListingChangeSummary'
import { resolveProductListingWorkflowEditSession } from './productListingWorkflowEditSession'
import { isProductListingReviewInteractionLocked } from './productListingReviewInteraction'
import { presentProductListingWorkflow } from './productListingWorkflowPresentation'
import type {
  ProductListingValidationIssue,
  ProductListingWorkflowView
} from './types'

const { Text } = Typography

const PRODUCT_LISTING_VALIDATION_FIELD_LABELS: Record<string, string> = {
  psku: 'PSKU',
  barcode: 'Barcode',
  productFullType: '商品类目',
  productBrand: '品牌',
  productTitleEn: '英文标题',
  productTitleAr: '阿语标题',
  productDescriptionEn: '英文详情',
  productDescriptionAr: '阿语详情',
  productHighlightsEn: '英文卖点',
  productHighlightsAr: '阿语卖点',
  imageUrls: '商品图片',
  salePrice: '售价',
  purchasePrice: '采购成本',
  idWarranty: 'Warranty'
}

type ProductListingReviewModalProps = {
  open: boolean
  workflow: ProductListingWorkflowView
  changes: ProductListingChangeSummaryItem[]
  validationIssues: ProductListingValidationIssue[]
  preparationError?: string
  preparing?: boolean
  confirming?: boolean
  confirmationAwaitingWorkflow?: boolean
  returningToEdit?: boolean
  workflowIntegrityBlocked?: boolean
  onClose: () => void
  onConfirm: () => void
  onReturnToEdit: () => void
}

export function ProductListingReviewModal({
  open,
  workflow,
  changes,
  validationIssues,
  preparationError,
  preparing = false,
  confirming = false,
  confirmationAwaitingWorkflow = false,
  returningToEdit = false,
  workflowIntegrityBlocked = false,
  onClose,
  onConfirm,
  onReturnToEdit
}: ProductListingReviewModalProps) {
  const presentation = presentProductListingWorkflow(workflow)
  const editSession = resolveProductListingWorkflowEditSession(workflow)
  const interactionLocked = isProductListingReviewInteractionLocked({
    phase: workflow.phase,
    preparing,
    confirming,
    confirmationAwaitingWorkflow,
    returningToEdit,
    integrityBlocked: workflowIntegrityBlocked
  })
  const footer = [
    <Button
      key="close"
      disabled={!presentation.allowCloseReview || interactionLocked}
      data-testid="product-listing-review-close"
      onClick={onClose}
    >
      关闭
    </Button>,
    ...(editSession.canReturnToEdit
      ? [
          <Button
            key="return-to-edit"
            loading={returningToEdit}
            disabled={interactionLocked}
            data-testid="product-listing-return-to-edit"
            onClick={onReturnToEdit}
          >
            返回修改
          </Button>
        ]
      : []),
    ...(editSession.canConfirm
      ? [
          <Button
            key="confirm"
            type="primary"
            danger
            loading={confirming || confirmationAwaitingWorkflow}
            disabled={interactionLocked}
            data-testid="product-listing-confirm-publish"
            onClick={onConfirm}
          >
            确认写入 Noon
          </Button>
        ]
      : [])
  ]

  return (
    <Modal
      title="上架确认"
      open={open}
      width={920}
      footer={footer}
      closable={!interactionLocked}
      maskClosable={presentation.allowCloseReview && !interactionLocked}
      keyboard={presentation.allowCloseReview && !interactionLocked}
      onCancel={onClose}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Alert
          type={workflow.phase === 'PUBLISHED' ? 'success' : workflow.phase === 'ACTION_REQUIRED' ? 'warning' : 'info'}
          showIcon
          message={`${presentation.phaseLabel}：${presentation.message}`}
        />
        {preparing ? <Alert type="info" showIcon message="正在保存草稿并执行上架检查..." /> : null}
        {confirmationAwaitingWorkflow ? (
          <Alert type="info" showIcon message="确认已提交，正在等待后端返回最新上架流程..." />
        ) : null}
        {preparationError ? <Alert type="error" showIcon message={preparationError} /> : null}
        <Card title="本次修改点" bordered={false} style={{ border: '1px solid #e5e7eb' }}>
          <Table
            size="small"
            pagination={false}
            dataSource={changes}
            rowKey={(record) => record.fieldKey}
            columns={[
              { title: '字段', dataIndex: 'label', width: 140 },
              { title: '修改前', dataIndex: 'before', render: value => <Text>{value}</Text> },
              { title: '修改后', dataIndex: 'after', render: value => <Text>{value}</Text> }
            ]}
            locale={{ emptyText: '未检测到相对上次草稿或来源预填的字段变更' }}
          />
        </Card>
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
                width: 150,
                render: value => PRODUCT_LISTING_VALIDATION_FIELD_LABELS[String(value)] || value
              },
              {
                title: '级别',
                dataIndex: 'severity',
                width: 96,
                render: value => <Tag color={value === 'warning' ? 'gold' : 'red'}>{value}</Tag>
              },
              { title: '信息', dataIndex: 'message' }
            ]}
            locale={{ emptyText: '暂无校验问题' }}
          />
        </Card>
      </Space>
    </Modal>
  )
}
