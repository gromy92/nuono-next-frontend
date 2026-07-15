import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const listingPageSource = readFileSync(new URL('./ProductListingPage.tsx', import.meta.url), 'utf8')
const detailEditorSource = readFileSync(new URL('./ProductListingDetailEditor.tsx', import.meta.url), 'utf8')
const contentPanelSource = readFileSync(
  new URL('../product-management/components/ProductBasicContentPanel.tsx', import.meta.url),
  'utf8'
)
const contentTabSource = readFileSync(
  new URL('../product-management/components/ProductContentTab.tsx', import.meta.url),
  'utf8'
)
const bilingualContentEditorSource = readFileSync(
  new URL('../product-management/components/ProductBilingualContentEditor.tsx', import.meta.url),
  'utf8'
)
const translationHelperSource = readFileSync(
  new URL('../product-management/components/ProductContentTranslationEditor.helpers.ts', import.meta.url),
  'utf8'
)
const officialTabsTypeSource = readFileSync(
  new URL('../product-management/components/ProductDetailOfficialTabs.types.ts', import.meta.url),
  'utf8'
)

assert(
  contentPanelSource.includes("import { ProductBilingualContentEditor } from './ProductBilingualContentEditor'") ||
    contentPanelSource.includes("import { ProductBilingualContentEditor } from './ProductBilingualContentEditor';"),
  'Content panel should use the bilingual editor with Chinese-source translation modal support'
)
assert(
  !contentPanelSource.includes('<ProductContentTranslationEditor'),
  'Content panel should not render the older inline translation editor'
)
assert(
  contentTabSource.includes('productCompetitorMaterials') &&
    officialTabsTypeSource.includes('productCompetitorMaterials?: ProductCompetitorContentMaterial[]'),
  'Official content tab should accept competitor content materials'
)
assert(
  detailEditorSource.includes('competitorMaterials?: ProductCompetitorContentMaterial[]') &&
    detailEditorSource.includes('enableCompetitorContentMerge'),
  'Listing detail editor should expose competitor merge support'
)
assert(
  listingPageSource.includes('competitorMaterials={sourcePrefill?.competitorMaterials') &&
    listingPageSource.includes('listingDraft.competitorMaterials'),
  'Listing page should pass manual-selection competitor materials into the shared content editor'
)
assert(
  bilingualContentEditorSource.includes('generateCompetitorTranslation') &&
    bilingualContentEditorSource.includes('competitor-translation-${item.key}') &&
    bilingualContentEditorSource.includes('selectedCompetitorTexts.length') &&
    bilingualContentEditorSource.includes('全选'),
  'Bilingual content editor should restore per-competitor translation and selected-material AI merge controls'
)
assert(
  !bilingualContentEditorSource.includes('collectCompetitorTexts('),
  'Bilingual content editor should not fall back to the older plain competitor text list'
)
assert(
    bilingualContentEditorSource.includes('extractSharedProductTitleKeywords') &&
    bilingualContentEditorSource.includes('product-competitor-shared-keywords') &&
    bilingualContentEditorSource.includes('共用关键词') &&
    bilingualContentEditorSource.includes('extractSharedProductTitleKeywords(mergedText, selectedCompetitorTexts)') &&
    bilingualContentEditorSource.includes("fieldType === 'title'") &&
    bilingualContentEditorSource.includes('setTitleKeywords(sharedKeywords)') &&
    !bilingualContentEditorSource.includes('setKeywordInputRows(sharedKeywords.map'),
  'Bilingual content editor should show AI shared keywords for titles without automatically turning them into keyword input rows'
)
assert(
  bilingualContentEditorSource.includes('saveKeywordRowsToManagement') &&
    bilingualContentEditorSource.includes('addProductCompetitorKeywords') &&
    bilingualContentEditorSource.includes('fetchProductKeywordProduct') &&
    bilingualContentEditorSource.includes('updateProductKeyword') &&
    bilingualContentEditorSource.includes('openCompetitorPickerForKeywordRow') &&
    bilingualContentEditorSource.includes('requestProductContentSave') &&
    bilingualContentEditorSource.includes('saveConfirmDetail') &&
    bilingualContentEditorSource.includes('ProductContentSaveConfirmModal') &&
    bilingualContentEditorSource.includes('确认保存本次修改') &&
    bilingualContentEditorSource.includes('修改前') &&
    bilingualContentEditorSource.includes('修改后') &&
    bilingualContentEditorSource.includes('关键词变更') &&
    bilingualContentEditorSource.includes('竞品变更') &&
    bilingualContentEditorSource.includes('返回修改') &&
    bilingualContentEditorSource.includes('确认保存') &&
    bilingualContentEditorSource.includes('editableKeywordRowsFromPanel') &&
    bilingualContentEditorSource.includes('selectedCompetitorKeywordEvidenceItems') &&
    bilingualContentEditorSource.includes('keywordInputRows') &&
    bilingualContentEditorSource.includes('parseProductTitleKeywordInputList') &&
    bilingualContentEditorSource.includes('product-competitor-keyword-row-input') &&
    bilingualContentEditorSource.includes('添加关键词') &&
    bilingualContentEditorSource.includes('PlusOutlined') &&
    bilingualContentEditorSource.includes('添加到竞品') &&
    bilingualContentEditorSource.includes('aria-label=\"删除关键词\"') &&
    bilingualContentEditorSource.includes('competitorSources') &&
    bilingualContentEditorSource.includes('copyTitleKeywordToClipboard') &&
    bilingualContentEditorSource.includes('navigator.clipboard.writeText') &&
    bilingualContentEditorSource.includes('product-competitor-keyword-chip') &&
    !bilingualContentEditorSource.includes('CheckableTag') &&
    !bilingualContentEditorSource.includes('selectedTitleKeywordKeys') &&
    !bilingualContentEditorSource.includes('Modal.confirm') &&
    !bilingualContentEditorSource.includes('加入关键词管理') &&
    !bilingualContentEditorSource.includes('appendProductTitleKeywords') &&
    !bilingualContentEditorSource.includes('加入标题'),
  'Bilingual content editor should let operators copy AI keywords, edit existing title keywords, choose Noon competitor evidence, and confirm changes before saving'
)
assert(
  bilingualContentEditorSource.includes('splitProductTitleKeywordHighlights') &&
    bilingualContentEditorSource.includes('product-competitor-generated-title-keyword') &&
    bilingualContentEditorSource.includes('product-competitor-source-title-keyword'),
  'Bilingual content editor should highlight AI shared keywords in generated and competitor titles with separate render targets'
)
assert(
  bilingualContentEditorSource.includes("data-testid=\"product-content-left-panel\"") &&
    bilingualContentEditorSource.includes("data-testid=\"product-content-keyword-panel\"") &&
    bilingualContentEditorSource.includes("width={fieldType === 'title' ? 1180 : 820}") &&
    bilingualContentEditorSource.includes("{fieldType === 'title' ? (") &&
    !bilingualContentEditorSource.includes('width={1120}'),
  'Title edit modal should be wider with a right keyword panel, while description/highlight modals should not render keyword controls'
)
assert(
  bilingualContentEditorSource.includes('product-content-translation-draft-preview') &&
    bilingualContentEditorSource.includes('{translationSection}') &&
    bilingualContentEditorSource.includes('点击生成翻译后在这里显示结果') &&
    !bilingualContentEditorSource.includes('点击生成翻译后在这里预览结果') &&
    !bilingualContentEditorSource.includes("border: '1px solid var(--pm-border-subtle, #d9d9d9)'") &&
    !bilingualContentEditorSource.includes('应用翻译') &&
    !bilingualContentEditorSource.includes('setDraftValue(translationDraft)'),
  'Translation should render directly in the edit modal, including title editing, without an input-like box or a separate apply action'
)

const contentLeftPanelStart = bilingualContentEditorSource.indexOf('data-testid="product-content-left-panel"')
const contentKeywordPanelStart = bilingualContentEditorSource.indexOf(
  'data-testid="product-content-keyword-panel"',
  contentLeftPanelStart
)
assert(contentLeftPanelStart > 0 && contentKeywordPanelStart > contentLeftPanelStart, 'Content modal panels should be present')
const contentLeftPanelSource = bilingualContentEditorSource.slice(contentLeftPanelStart, contentKeywordPanelStart)
assert(contentLeftPanelSource.includes('{translationSection}'), 'Title edit modal should include translation controls')
assert(
  contentLeftPanelSource.indexOf('{fieldEditor}') > 0 &&
    contentLeftPanelSource.indexOf('{translationSection}') > contentLeftPanelSource.indexOf('{fieldEditor}') &&
    contentLeftPanelSource.indexOf('{competitorSection}') > contentLeftPanelSource.indexOf('{translationSection}') &&
    !contentLeftPanelSource.includes('{aiDraftPreview}') &&
    !bilingualContentEditorSource.includes('product-competitor-ai-draft-preview') &&
    !bilingualContentEditorSource.includes('setCompetitorDraft(mergedText)') &&
    !bilingualContentEditorSource.includes('const [competitorDraft'),
  'AI integration should write title, description and highlight results into the editor only, without repeating the same content below it'
)

assert(
  bilingualContentEditorSource.includes("const supportsTitleKeywords = fieldType === 'title'") &&
    bilingualContentEditorSource.includes('titleKeywordPanel') &&
    bilingualContentEditorSource.includes('titleKeywordTranslations') &&
    bilingualContentEditorSource.includes('translateTitleKeywordsToChinese(sharedKeywords)') &&
    bilingualContentEditorSource.includes("sourceLang: 'AUTO'") &&
    bilingualContentEditorSource.includes("sourceLang: 'AR'") &&
    bilingualContentEditorSource.includes('titleKeywordChineseTranslations') &&
    bilingualContentEditorSource.includes('hasChineseText') &&
    bilingualContentEditorSource.includes("loading['title-keyword-translation']") &&
    bilingualContentEditorSource.includes('dedupeProductCompetitorContentTextItems') &&
    bilingualContentEditorSource.includes('noonCompetitorTextItems') &&
    bilingualContentEditorSource.includes('ProductKeywordCompetitorPickerModal'),
  'Keyword controls should be restricted to title editing, and Arabic AI keywords should translate to Chinese in the chips'
)

assert(
  translationHelperSource.includes('translatedTextMatchesTargetLang(translatedText, targetLang)') &&
    translationHelperSource.includes('targetLanguageMismatchMessage(targetLang)') &&
    translationHelperSource.includes('translateProductContentText({ text, sourceLang, targetLang })'),
  'Translation helper should pass source language and reject AI translations that do not match the requested target language'
)

const translationSourceStart = bilingualContentEditorSource.indexOf('const translationSource = (fieldType: EditableFieldType, lang: ContentLang) => {')
const updateFieldValueStart = bilingualContentEditorSource.indexOf('const updateFieldValue =', translationSourceStart)
const translationSourceBlock = bilingualContentEditorSource.slice(translationSourceStart, updateFieldValueStart)

assert(
  translationSourceBlock.includes("const fallbackLang = lang === 'EN' ? 'AR' : 'EN'") &&
    translationSourceBlock.includes("return fieldValue('title', fallbackLang)") &&
    translationSourceBlock.includes("return fieldValue('description', fallbackLang)") &&
    translationSourceBlock.includes("return normalizeStringList") &&
    !translationSourceBlock.includes('titleCn ||') &&
    !translationSourceBlock.includes('descriptionCn ||') &&
    !translationSourceBlock.includes('highlightsCn.join'),
  'Field translation fallback should use the opposite non-Chinese language instead of prioritizing existing Chinese text'
)

const generateTranslationStart = bilingualContentEditorSource.indexOf('const generateTranslation = async () => {')
const generateCompetitorTranslationStart = bilingualContentEditorSource.indexOf(
  'const generateCompetitorTranslation = async',
  generateTranslationStart
)
const generateTranslationBlock = bilingualContentEditorSource.slice(
  generateTranslationStart,
  generateCompetitorTranslationStart
)

assert(
  generateTranslationBlock.includes('fieldTranslationSource') &&
    generateTranslationBlock.includes("sourceLang: draftValue.trim() ? lang : 'AUTO'") &&
    generateTranslationBlock.includes("targetLang: 'ZH'") &&
    !generateTranslationBlock.includes('targetLang: lang'),
  'Title, description and highlight translation controls should translate the current field text to Chinese'
)
