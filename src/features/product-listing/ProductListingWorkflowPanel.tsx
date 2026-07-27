import { Alert, Button, Card, Space, Tag, Typography } from 'antd'
import { ProductListingPublishedActions } from './ProductListingPublishedActions'
import { ProductListingWorkflowActionButton } from './ProductListingWorkflowActionButton'
import {
  presentProductListingWorkflow,
  type ProductListingWorkflowPresentation
} from './productListingWorkflowPresentation'
import type {
  ProductListingWorkflowNextAction,
  ProductListingWorkflowView
} from './types'

const { Text } = Typography

type ProductListingWorkflowPanelProps = {
  workflow: ProductListingWorkflowView
  busy?: boolean
  actionDisabled?: boolean
  actionBlockedMessage?: string
  canConfirmNotCreated?: boolean
  notCreatedLookupAttemptCount?: number
  hidePrimaryAction?: boolean
  onAction: (action: ProductListingWorkflowNextAction) => void
  onConfirmNotCreated?: () => void
}

export function ProductListingWorkflowPanel({
  workflow,
  busy = false,
  actionDisabled = false,
  actionBlockedMessage,
  canConfirmNotCreated = false,
  notCreatedLookupAttemptCount,
  hidePrimaryAction = false,
  onAction,
  onConfirmNotCreated
}: ProductListingWorkflowPanelProps) {
  const presentation = presentProductListingWorkflow(workflow)
  const showConfirmNotCreated =
    canConfirmNotCreated &&
    workflow.phase === 'ACTION_REQUIRED' &&
    workflow.writeCertainty === 'UNKNOWN' &&
    workflow.nextAction === 'CHECK_CREATE_RESULT'
  return (
    <Card
      className="product-listing-workflow-card"
      data-testid="product-listing-workflow"
      title={
        <Space>
          <Text>上架状态</Text>
          <Tag
            color={phaseTagColor(presentation)}
            data-testid="product-listing-workflow-phase"
          >
            {presentation.phaseLabel}
          </Tag>
        </Space>
      }
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Alert
          type={workflow.phase === 'PUBLISHED' ? 'success' : workflow.phase === 'ACTION_REQUIRED' ? 'warning' : 'info'}
          showIcon
          message={presentation.message}
        />
        {actionBlockedMessage ? (
          <Alert type="warning" showIcon message={actionBlockedMessage} />
        ) : null}
        {hidePrimaryAction ? null : (
          <div className="product-listing-workflow-action">
            <ProductListingWorkflowActionButton
              workflow={workflow}
              busy={busy}
              disabled={actionDisabled}
              onAction={onAction}
            />
          </div>
        )}
        {showConfirmNotCreated && onConfirmNotCreated ? (
          <Space direction="vertical" size={4} align="start">
            <Button
              danger
              disabled={busy || actionDisabled}
              data-testid="product-listing-confirm-not-created"
              onClick={onConfirmNotCreated}
            >
              确认未创建并返回编辑
            </Button>
            <Text type="secondary">
              后端已完成 {notCreatedLookupAttemptCount ?? '-'} 次可靠查询并跨过安全等待时间。
            </Text>
          </Space>
        ) : null}
        <ProductListingPublishedActions workflow={workflow} />
      </Space>
    </Card>
  )
}

function phaseTagColor(presentation: ProductListingWorkflowPresentation) {
  switch (presentation.phaseTone) {
    case 'success':
      return 'green'
    case 'processing':
      return 'blue'
    case 'warning':
      return 'orange'
    default:
      return 'default'
  }
}
