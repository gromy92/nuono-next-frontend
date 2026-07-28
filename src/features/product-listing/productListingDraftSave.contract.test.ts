import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pageSource = readFileSync(new URL('./ProductListingPage.tsx', import.meta.url), 'utf8')
const adapterSource = readFileSync(new URL('./productDetailAdapter.ts', import.meta.url), 'utf8')
const workflowIdentitySource = readFileSync(
  new URL('./productListingWorkflowIdentity.ts', import.meta.url),
  'utf8'
)
const workflowReadinessSource = readFileSync(
  new URL('./useProductListingWorkflowReadiness.ts', import.meta.url),
  'utf8'
)
const pageStatusSource = readFileSync(
  new URL('./ProductListingPageStatus.tsx', import.meta.url),
  'utf8'
)
const sourcePrefillHookSource = readFileSync(
  new URL('./useProductListingSourcePrefill.ts', import.meta.url),
  'utf8'
)
const saveFeedbackSource = readFileSync(
  new URL('./useProductListingDraftSaveFeedback.ts', import.meta.url),
  'utf8'
)

assert(
  adapterSource.includes("sourceRefId: optionalInteger(draft.sourceRefId)"),
  'product listing payload should preserve sourceRefId from the editor draft'
)
assert(
  pageSource.includes('...listingDraftRef.current') && pageSource.includes('...form.getFieldsValue()'),
  'product listing save should merge hidden metadata form values over the current editor draft'
)
assert(
  pageSource.includes('productListingEditorDraftToPayload(currentDraft, currentDraftId)'),
  'product listing save should serialize the normalized editor draft payload'
)
assert(
  !adapterSource.includes('ensureProductListingEditorDraftPsku') &&
    !pageSource.includes('ensureProductListingEditorDraftPsku') &&
    pageSource.includes('PRODUCT_LISTING_REAL_RUN_PSKU_REQUIRED_MESSAGE'),
  'manual-selection listing should require an operator PSKU and must not keep a test-PSKU generator'
)
assert(
  pageSource.includes('useProductListingDraftSaveFeedback()') &&
    pageSource.includes('draftSaveNotice={draftSaveFeedback.notice}') &&
    saveFeedbackSource.includes("setNotice({ type: 'info'") &&
    saveFeedbackSource.includes('message.loading({') &&
    saveFeedbackSource.includes("setNotice({ type: 'success'") &&
    saveFeedbackSource.includes("setNotice({ type: 'error'") &&
    pageStatusSource.includes('product-listing-draft-save-feedback'),
  'manual listing draft save should show immediate saving, success and failure feedback instead of relying on a silent button click'
)
assert(
  pageSource.includes('refreshWorkflow: savedDraftId => refreshWorkflow(savedDraftId)') &&
    !pageSource.includes('setRealRunTaskView(undefined)'),
  'saving an existing draft should reload its durable workflow instead of clearing terminal task state locally'
)
assert(
  pageSource.includes('saveProductListingDraftWithWorkflowRefresh') &&
    pageSource.includes('if (!saveResult.workflow)') &&
    saveFeedbackSource.includes('草稿已保存，但暂时无法读取最新上架状态') &&
    !pageSource.includes('const savedWorkflow = await refreshWorkflow(saved.draftId)'),
  'a thrown, stale or unapplied workflow refresh after a successful POST must preserve saved success and report only refresh unavailability'
)
assert(
  workflowIdentitySource.includes(
    'isProductListingWorkflowLoadedForScope'
  ) &&
    workflowReadinessSource.includes('setLoadedScope({ draftId, storeCode })') &&
    workflowReadinessSource.includes('setLoadedScope(undefined)') &&
    pageSource.includes('workflowReadiness.locked') &&
    pageSource.includes('!editSession.canEditAndSave') &&
    pageSource.includes('!workflowPresentation.allowPrepare') &&
    workflowReadinessSource.includes(
      '正在读取后端上架流程，保存与检查暂时锁定。'
    ),
  'a persisted draft must keep save and review fail-closed until a valid same-scope workflow has been applied'
)
assert(
  sourcePrefillHookSource.includes(
    'useState<ProductListingSourcePrefill | undefined>('
  ) &&
    sourcePrefillHookSource.includes(
      'readProductListingSourcePrefill'
  ) &&
    sourcePrefillHookSource.includes('setHydrating(true)') &&
    sourcePrefillHookSource.includes('setError(errorMessage)') &&
    sourcePrefillHookSource.includes('setHydrating(false)') &&
    sourcePrefillHookSource.includes('setApplied(true)') &&
    sourcePrefillHookSource.includes(
      '!applied || hydrating || Boolean(error)'
    ) &&
    pageSource.includes('sourceHydrationBlocked ||') &&
    pageStatusSource.includes('product-listing-source-hydration-error'),
  'server source hydration must lock the first render and remain fail-closed after an error so persisted data cannot overwrite local edits'
)
