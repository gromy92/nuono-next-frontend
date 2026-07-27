import { Button } from 'antd'
import { presentProductListingWorkflow } from './productListingWorkflowPresentation'
import type { ProductListingWorkflowNextAction, ProductListingWorkflowView } from './types'

export function ProductListingWorkflowActionButton(props: {
  workflow: ProductListingWorkflowView
  busy?: boolean
  disabled?: boolean
  onlyAction?: ProductListingWorkflowNextAction
  onAction: (action: ProductListingWorkflowNextAction) => void
}) {
  const action = presentProductListingWorkflow(props.workflow).action
  if (!action || (props.onlyAction && action.kind !== props.onlyAction)) {
    return null
  }
  return (
    <Button
      type="primary"
      danger={action.danger}
      loading={props.busy}
      disabled={props.busy || props.disabled}
      data-testid="product-listing-workflow-action"
      onClick={() => props.onAction(action.kind)}
    >
      {action.label}
    </Button>
  )
}
