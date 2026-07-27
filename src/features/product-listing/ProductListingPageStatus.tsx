import { SaveOutlined } from '@ant-design/icons'
import { Alert, Button } from 'antd'
import type { ProductListingReauthenticationNotice } from './productListingReauthentication'

export type ProductListingNotice = {
  type: 'success' | 'info' | 'warning' | 'error'
  message: string
}

type ProductListingPageStatusProps = {
  draftSaveNotice?: ProductListingNotice
  workflowIntegrityError?: string
  sourceHydrationError?: string
  reauthenticationNotice?: ProductListingReauthenticationNotice
  dangerousActionAwaiting: boolean
  reopenAwaiting: boolean
}

export function ProductListingPageStatus({
  draftSaveNotice,
  workflowIntegrityError,
  sourceHydrationError,
  reauthenticationNotice,
  dangerousActionAwaiting,
  reopenAwaiting
}: ProductListingPageStatusProps) {
  return (
    <>
      {draftSaveNotice ? (
        <Alert
          className="product-listing-draft-save-feedback"
          type={draftSaveNotice.type}
          showIcon
          message={draftSaveNotice.message}
        />
      ) : null}

      {workflowIntegrityError ? (
        <Alert
          type="error"
          showIcon
          data-testid="product-listing-workflow-integrity-error"
          message={workflowIntegrityError}
        />
      ) : null}
      {sourceHydrationError ? (
        <Alert
          type="error"
          showIcon
          data-testid="product-listing-source-hydration-error"
          message={sourceHydrationError}
        />
      ) : null}
      {reauthenticationNotice ? (
        <Alert
          type={reauthenticationNotice.type}
          showIcon
          data-testid="product-listing-reauthentication-notice"
          message={reauthenticationNotice.message}
        />
      ) : null}
      {dangerousActionAwaiting ? (
        <Alert
          type="warning"
          showIcon
          data-testid="product-listing-dangerous-action-awaiting"
          message="恢复写入结果仍在确认中，系统已锁定重复操作并持续刷新后端流程。"
        />
      ) : null}
      {reopenAwaiting ? (
        <Alert
          type="warning"
          showIcon
          data-testid="product-listing-reopen-awaiting"
          message="解除旧上架检查的结果仍在确认中，系统已锁定重复操作并持续刷新后端流程。"
        />
      ) : null}
    </>
  )
}

export function ProductListingSaveDraftButton(props: {
  saving: boolean
  disabled: boolean
  onSave: () => void
}) {
  return (
    <Button
      icon={<SaveOutlined />}
      loading={props.saving}
      disabled={props.disabled}
      data-testid="product-listing-save-draft"
      onClick={props.onSave}
    >
      保存草稿
    </Button>
  )
}
