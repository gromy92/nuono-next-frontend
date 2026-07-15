import { parseOptionalNumber } from '../product-management/utils/common'
import { collectOfferPricingValidationIssues } from '../product-management/utils/offerPricingValidation'
import type { ProductFieldDomainKey } from '../product-management/types'
import type { ProductListingEditorDraft } from './productDetailAdapter'

export type ProductListingDraftCompletenessIssue = {
  fieldKey: string
  domainKey: ProductFieldDomainKey
  severity: 'error' | 'warning'
  code: string
  message: string
}

type TextRequirement = {
  fieldKey: keyof ProductListingEditorDraft
  domainKey: ProductFieldDomainKey
  message: string
  kind: 'text'
}

type AmountRequirement = {
  fieldKey: keyof ProductListingEditorDraft
  domainKey: ProductFieldDomainKey
  message: string
  kind: 'amount'
}

type OptionalPositiveIntegerRequirement = {
  fieldKey: keyof ProductListingEditorDraft
  domainKey: ProductFieldDomainKey
  message: string
  kind: 'optionalPositiveInteger'
}

type ProductListingDraftRequirement =
  | TextRequirement
  | AmountRequirement
  | OptionalPositiveIntegerRequirement

const REQUIRED_REQUIREMENTS = [
  textRequirement('storeCode', 'main', '上架信息缺少逻辑店铺。'),
  textRequirement('psku', 'main', '商品主档缺少 PSKU。'),
  textRequirement('productFullType', 'main', '商品主档缺少 Fulltype。'),
  textRequirement('productTitleEn', 'content', '商品图文缺少标题 EN。'),
  amountRequirement('price', 'site', '当前站点缺少有效售价。'),
  amountRequirement('purchasePrice', 'site', '当前站点缺少有效采购成本。'),
  textRequirement('supplyEvidenceType', 'site', '当前站点缺少供货证据。')
] satisfies ProductListingDraftRequirement[]

const OPTIONAL_POSITIVE_REQUIREMENTS = [
  optionalPositiveIntegerRequirement('quantity', 'site', '当前站点数量必须大于 0。')
] satisfies ProductListingDraftRequirement[]

export const PRODUCT_LISTING_DRAFT_REQUIRED_FIELD_KEYS: string[] = REQUIRED_REQUIREMENTS.map((item) => item.fieldKey)

export const PRODUCT_LISTING_DRAFT_OPTIONAL_POSITIVE_FIELD_KEYS: string[] = OPTIONAL_POSITIVE_REQUIREMENTS.map(
  (item) => item.fieldKey
)

export function collectProductListingDraftCompletenessIssues(
  draft: ProductListingEditorDraft
): ProductListingDraftCompletenessIssue[] {
  const requirementIssues = [...REQUIRED_REQUIREMENTS, ...OPTIONAL_POSITIVE_REQUIREMENTS]
    .map((requirement) => validateRequirement(draft, requirement))
    .filter((issue): issue is ProductListingDraftCompletenessIssue => Boolean(issue))
  const pricingIssues = collectOfferPricingValidationIssues(draft, '当前站点').map((item) => ({
    fieldKey: item.fieldKey,
    domainKey: 'site' as const,
    severity: 'error' as const,
    code: item.code,
    message: item.message
  }))
  return [...requirementIssues, ...pricingIssues]
}

export function productListingDraftProgress(draft: ProductListingEditorDraft) {
  const requiredIssues = collectProductListingDraftCompletenessIssues(draft).filter((item) =>
    PRODUCT_LISTING_DRAFT_REQUIRED_FIELD_KEYS.includes(item.fieldKey)
  )
  return {
    done: PRODUCT_LISTING_DRAFT_REQUIRED_FIELD_KEYS.length - requiredIssues.length,
    total: PRODUCT_LISTING_DRAFT_REQUIRED_FIELD_KEYS.length
  }
}

function validateRequirement(
  draft: ProductListingEditorDraft,
  requirement: ProductListingDraftRequirement
): ProductListingDraftCompletenessIssue | null {
  const value = draft[requirement.fieldKey]
  if (requirement.kind === 'text' && !text(value)) {
    return issue(requirement, 'required')
  }
  if (requirement.kind === 'amount') {
    const amount = parseOptionalNumber(value)
    if (amount === null || amount <= 0) {
      return issue(requirement, amount === null ? 'required' : 'invalid_number')
    }
  }
  if (requirement.kind === 'optionalPositiveInteger') {
    const amount = parseOptionalNumber(value)
    if (amount !== null && Math.trunc(amount) <= 0) {
      return issue(requirement, 'invalid_number')
    }
  }
  return null
}

function issue(
  requirement: ProductListingDraftRequirement,
  code: ProductListingDraftCompletenessIssue['code']
): ProductListingDraftCompletenessIssue {
  return {
    fieldKey: requirement.fieldKey,
    domainKey: requirement.domainKey,
    severity: 'error',
    code,
    message: requirement.message
  }
}

function textRequirement(
  fieldKey: keyof ProductListingEditorDraft,
  domainKey: ProductFieldDomainKey,
  message: string
): TextRequirement {
  return { fieldKey, domainKey, message, kind: 'text' }
}

function amountRequirement(
  fieldKey: keyof ProductListingEditorDraft,
  domainKey: ProductFieldDomainKey,
  message: string
): AmountRequirement {
  return { fieldKey, domainKey, message, kind: 'amount' }
}

function optionalPositiveIntegerRequirement(
  fieldKey: keyof ProductListingEditorDraft,
  domainKey: ProductFieldDomainKey,
  message: string
): OptionalPositiveIntegerRequirement {
  return { fieldKey, domainKey, message, kind: 'optionalPositiveInteger' }
}

function text(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
}
