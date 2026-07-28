import type { ProductFieldDomainKey, ProductFieldDomainSurface } from '../product-editor/productFieldDomain'
import {
  collectProductListingDraftCompletenessIssues,
  productListingDraftProgress,
  type ProductListingDraftCompletenessIssue
} from './productListingDraftCompleteness'
import type { ProductListingEditorDraft } from './productDetailAdapterTypes'
import {
  attributeCodeKey,
  hasAttributeValue,
  normalizeProductListingKeyAttributes,
  normalizeStringList,
  siteFromStoreCode,
  text,
  valueText
} from './productDetailAdapterNormalization'

export function productListingEditorDraftDomains(draft: ProductListingEditorDraft) {
  const completenessIssues = collectProductListingDraftCompletenessIssues(draft)
  const issuesFor = (domainKey: ProductFieldDomainKey) =>
    completenessIssues.filter((item) => item.domainKey === domainKey)

  const domain = (
    key: ProductFieldDomainSurface['key'],
    label: string,
    scopeLabel: string,
    issues: ProductListingDraftCompletenessIssue[],
    metrics: ProductFieldDomainSurface['metrics']
  ): ProductFieldDomainSurface => ({
    key,
    label,
    scopeLabel,
    status: issues.length ? 'attention' : 'draft',
    dirty: true,
    note: issues.length ? '上架前仍需补齐字段。' : '当前字段将进入商品上架草稿。',
    metrics,
    issues: issues.map((item) => item.message),
    blockingIssueCount: issues.filter((item) => item.severity === 'error').length
  })

  return {
    main: domain('main', '商品主档', '新建 PSKU', issuesFor('main'), [
      { label: 'PSKU', value: text(draft.psku) || '-' },
      { label: '品牌', value: text(draft.productBrand) || '-' },
      { label: 'Fulltype', value: text(draft.productFullType) || '-' }
    ]),
    content: domain('content', '图文内容', '新建 PSKU', issuesFor('content'), [
      { label: '图片', value: normalizeStringList(draft.imageUrls).length },
      { label: 'EN 标题', value: text(draft.productTitleEn) ? '已填' : '待补' }
    ]),
    grouping: domain('grouping', 'Group 与变体', '单变体', issuesFor('grouping'), [
      { label: '变体', value: 1 }
    ]),
    attributes: domain('attributes', '关键属性', '官方模板', issuesFor('attributes'), [
      {
        label: '属性项',
        value: normalizeProductListingKeyAttributes(draft.keyAttributes, draft.barcode).filter(hasAttributeValue).length
      }
    ]),
    site: domain('site', '当前站点经营', siteFromStoreCode(draft.storeCode) || '当前站点', issuesFor('site'), [
      { label: '价格', value: valueText(draft.price) || '-' },
      { label: '采购成本', value: valueText(draft.purchasePrice) || '-' },
      { label: '供货证据', value: text(draft.supplyEvidenceType) ? '已填' : '待补' },
      { label: '运营状态', value: draft.isActive === false ? '停用' : '启用' }
    ])
  }
}

export function productListingContentProgress(draft: ProductListingEditorDraft) {
  return productListingDraftProgress(draft)
}

export function updateProductListingKeyAttributeField(
  attributes: unknown,
  code: string,
  field: string,
  value: string
) {
  const normalizedCode = attributeCodeKey(code)
  if (!normalizedCode) {
    return normalizeProductListingKeyAttributes(attributes)
  }
  let updated = false
  const nextAttributes = normalizeProductListingKeyAttributes(attributes).map((attribute) => {
    if (attributeCodeKey(attribute.code) !== normalizedCode) {
      return attribute
    }
    updated = true
    return {
      ...attribute,
      [field]: value
    }
  })
  if (!updated) {
    nextAttributes.push({
      code,
      [field]: value
    })
  }
  return nextAttributes
}

