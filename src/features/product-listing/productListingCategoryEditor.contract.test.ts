import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const classificationEditorSource = readFileSync(
  new URL('../product-management/components/ProductClassificationEditor.tsx', import.meta.url),
  'utf8'
)
const contentTabSource = readFileSync(
  new URL('../product-management/components/ProductContentTab.tsx', import.meta.url),
  'utf8'
)
const competitorContentTypeSource = readFileSync(
  new URL('../product-management/types/competitorContent.ts', import.meta.url),
  'utf8'
)
const sourcePrefillSource = readFileSync(new URL('./sourcePrefill.ts', import.meta.url), 'utf8')

assert(
  competitorContentTypeSource.includes('ProductCompetitorCategoryLink') &&
    competitorContentTypeSource.includes('categoryName?: string') &&
    competitorContentTypeSource.includes('categoryPath?: string') &&
    competitorContentTypeSource.includes('categoryUrl?: string') &&
    competitorContentTypeSource.includes('categoryLinks?: ProductCompetitorCategoryLink[]'),
  '竞品内容材料必须保留竞品类目字段'
)

assert(
  sourcePrefillSource.includes('fetchedCategoryName') &&
    sourcePrefillSource.includes('fetchedCategoryPath') &&
    sourcePrefillSource.includes('fetchedCategoryUrl') &&
    sourcePrefillSource.includes('fetchedCategoryLinks') &&
    sourcePrefillSource.includes('normalizeCompetitorCategoryLinks'),
  '人工选品进入上架时必须把竞品类目字段带入上架草稿'
)

assert(
  contentTabSource.includes('productCompetitorMaterials={productCompetitorMaterials}'),
  '上架 Content 类目编辑器必须接收竞品材料'
)

assert(
  classificationEditorSource.includes('data-testid="product-listing-category-editor-button"') &&
    classificationEditorSource.includes('编辑类目') &&
    classificationEditorSource.includes('data-testid="product-listing-competitor-category-table"') &&
    classificationEditorSource.includes('竞品类目') &&
    classificationEditorSource.includes('buildProductCompetitorCategoryRows') &&
    classificationEditorSource.includes('categoryLinks') &&
    classificationEditorSource.includes('updateFulltype(record.categoryValue)') &&
    classificationEditorSource.includes('isOfficialNoonFulltypeCode') &&
    classificationEditorSource.includes('当前上架资料暂无竞品类目'),
  '上架类目填写区必须提供编辑弹窗，并列出所有竞品类目供填入'
)

assert(
  sourcePrefillSource.includes('firstOfficialNoonFulltype') &&
    sourcePrefillSource.includes('officialNoonFulltypeOrEmpty') &&
    sourcePrefillSource.includes('sanitizeProductListingSourcePrefill') &&
    sourcePrefillSource.includes('isOfficialNoonFulltypeCode') &&
    sourcePrefillSource.includes('stringValue(selectedCategory?.label)'),
  '人工选品利润类目和草稿恢复只有 Noon 官方 fulltype code 才能预填到上架 Fulltype'
)
