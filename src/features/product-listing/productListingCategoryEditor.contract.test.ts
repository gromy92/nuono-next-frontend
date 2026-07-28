import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { preferredCompetitorCategoryLabel } from '../product-domain/productCompetitorContent'

const classificationEditorSource = readFileSync(
  new URL('../product-editor/ProductClassificationEditor.tsx', import.meta.url),
  'utf8'
)
const classificationFieldsSource = readFileSync(
  new URL('../product-editor/ProductClassificationFields.tsx', import.meta.url),
  'utf8'
)
const competitorCategoryModalSource = readFileSync(
  new URL('../product-editor/ProductCompetitorCategoryModal.tsx', import.meta.url),
  'utf8'
)
const classificationUiSource = `${classificationEditorSource}\n${classificationFieldsSource}\n${competitorCategoryModalSource}`
const contentTabSource = readFileSync(
  new URL('../product-editor/ProductContentTab.tsx', import.meta.url),
  'utf8'
)
const competitorContentTypeSource = readFileSync(
  new URL('../product-domain/productCompetitorContent.ts', import.meta.url),
  'utf8'
)
const sourcePrefillSource = [
  './sourcePrefill.ts',
  './sourcePrefillModel.ts'
].map((fileName) => readFileSync(new URL(fileName, import.meta.url), 'utf8')).join('\n')
const categoryPresentationSource = readFileSync(
  new URL('../product-domain/productCompetitorContent.ts', import.meta.url),
  'utf8'
)

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
  classificationUiSource.includes('data-testid="product-listing-category-editor-button"') &&
    classificationUiSource.includes('编辑类目') &&
    competitorCategoryModalSource.includes('data-testid="product-listing-competitor-category-table"') &&
    competitorCategoryModalSource.includes('竞品类目') &&
    competitorCategoryModalSource.includes('buildProductCompetitorCategoryRows') &&
    competitorCategoryModalSource.includes('preferredCompetitorCategoryLabel') &&
    categoryPresentationSource.includes('containsArabicScript') &&
    categoryPresentationSource.includes('englishCategoryPathFromUrl') &&
    categoryPresentationSource.includes('material.categoryName') &&
    competitorCategoryModalSource.includes('categoryLinks') &&
    competitorCategoryModalSource.includes('onUseFulltype(record.categoryValue)') &&
    classificationEditorSource.includes('isOfficialNoonFulltypeCode') &&
    competitorCategoryModalSource.includes('当前上架资料暂无竞品类目'),
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

assert.equal(
  preferredCompetitorCategoryLabel('الرئيسية < الإلكترونيات والموبايلات', {
    id: 'noon-1',
    categoryName: 'Phone Cases'
  }),
  'Phone Cases',
  '阿语竞品面包屑必须优先回退到已采集的英文类目名'
)

assert.equal(
  preferredCompetitorCategoryLabel(
    'الرئيسية < الإلكترونيات والموبايلات',
    { id: 'noon-2' },
    'https://www.noon.com/saudi-en/electronics-and-mobiles/mobiles-and-accessories/accessories-16176/cases-and-covers/'
  ),
  'Electronics And Mobiles > Mobiles And Accessories > Accessories > Cases And Covers',
  '没有英文采集字段时必须从 Noon 英文类目链接生成可读路径'
)
