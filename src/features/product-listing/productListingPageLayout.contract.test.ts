import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pageSource = readFileSync(new URL('./ProductListingPage.tsx', import.meta.url), 'utf8')
const pageStatusSource = readFileSync(
  new URL('./ProductListingPageStatus.tsx', import.meta.url),
  'utf8'
)
const reviewSource = readFileSync(new URL('./ProductListingReviewModal.tsx', import.meta.url), 'utf8')
const workflowPanelSource = readFileSync(
  new URL('./ProductListingWorkflowPanel.tsx', import.meta.url),
  'utf8'
)
const workflowActionSource = readFileSync(
  new URL('./ProductListingWorkflowActionButton.tsx', import.meta.url),
  'utf8'
)

assert(
  !pageSource.includes('点击上架会先自动保存草稿并提交 dry-run'),
  'listing page should not render the explanatory top alert'
)
assert(!pageSource.includes('message={`来源：'), 'listing page should not render the source prefill alert card')
assert(
  pageSource.includes('className="product-listing-page"'),
  'listing page should expose a stable page layout class'
)
assert(
  pageSource.includes('tabBarExtraContent={') &&
    pageSource.includes('<ProductListingSaveDraftButton') &&
    pageSource.includes('<ProductListingWorkflowActionButton') &&
    pageSource.includes('onlyAction="REVIEW_DRAFT"') &&
    pageSource.includes('hidePrimaryAction') &&
    pageStatusSource.includes('export function ProductListingSaveDraftButton'),
  'save and listing actions should share the Offer/Content tab row without a duplicate lower action'
)
assert(
  workflowActionSource.includes('data-testid="product-listing-workflow-action"') &&
    workflowPanelSource.includes('hidePrimaryAction ? null :'),
  'the workflow primary action should remain one shared implementation'
)
assert(
  pageSource.indexOf('<ProductListingPageStatus') <
    pageSource.indexOf('<ProductListingDetailEditor'),
  'draft save feedback should remain above the editor'
)
assert(
  pageSource.indexOf('<ProductListingWorkflowPanel') >
    pageSource.indexOf('<ProductListingDetailEditor'),
  'the user-facing listing action should be rendered after the editor instead of above it'
)
assert(
  !workflowPanelSource.includes('ProductListingWorkflowTechnicalDetails') &&
    !workflowPanelSource.includes('技术详情'),
  'internal workflow and task diagnostics must not be rendered to operators'
)
assert(
  reviewSource.includes("barcode: 'Barcode'"),
  'listing validation summary should render barcode issues with a readable field label'
)
