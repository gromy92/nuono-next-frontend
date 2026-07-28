import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const editorSource = readFileSync(new URL('./ProductListingDetailEditor.tsx', import.meta.url), 'utf8')
const tabsTypesSource = readFileSync(
  new URL('../product-editor/productDetailEditorTypes.ts', import.meta.url),
  'utf8'
)
const offerTabSource = readFileSync(new URL('../product-editor/ProductOfferTab.tsx', import.meta.url), 'utf8')
const contentTabSource = readFileSync(
  new URL('../product-management/components/ProductContentTab.tsx', import.meta.url),
  'utf8'
)
const officialTabsSource = readFileSync(
  new URL('../product-management/components/ProductDetailOfficialTabs.tsx', import.meta.url),
  'utf8'
)
const visibilitySource = readFileSync(
  new URL('../product-editor/ProductOfferVisibilitySection.tsx', import.meta.url),
  'utf8'
)
const pricingSource = readFileSync(
  new URL('../product-editor/ProductOfferPricingSection.tsx', import.meta.url),
  'utf8'
)
const pricingCssSource = readFileSync(
  new URL('../product-editor/ProductOfferPricingSection.css', import.meta.url),
  'utf8'
)
const adapterSource = readFileSync(new URL('./productDetailAdapter.ts', import.meta.url), 'utf8')
const metaSource = readFileSync(
  new URL('../product-editor/ProductOfferMetaSection.tsx', import.meta.url),
  'utf8'
)
const metaCssSource = readFileSync(
  new URL('../product-editor/ProductOfferMetaSection.css', import.meta.url),
  'utf8'
)
const listingPageCssSource = readFileSync(new URL('./ProductListingPage.css', import.meta.url), 'utf8')
const classificationFieldsSource = readFileSync(
  new URL('../product-management/components/ProductClassificationFields.tsx', import.meta.url),
  'utf8'
)
const classificationCssSource = readFileSync(
  new URL('../product-management/components/ProductClassificationFields.css', import.meta.url),
  'utf8'
)

assert(
  editorSource.includes('offerPresentation="listing-create"') &&
    tabsTypesSource.includes("offerPresentation?: 'default' | 'listing-create'"),
  'new product listing editor must opt into its compact Offer presentation without changing existing product details'
)

assert(
  offerTabSource.includes("offerPresentation === 'listing-create'") &&
    offerTabSource.includes("flex: '0 1 620px'") &&
    offerTabSource.includes('const showVisibilitySection = !compactListingOffer') &&
    offerTabSource.includes('{showVisibilitySection ? visibilitySection : null}'),
  'new listing must keep a compact PSKU row and omit the live-status control'
)

assert(
  visibilitySource.includes('hideLiveStatusText?: boolean') &&
    visibilitySource.includes('{hideLiveStatusText ? null : liveTag}'),
  'new listing presentation must hide the technical Live/Not Live tag while keeping the switch'
)

assert(
  pricingSource.includes('hidePricingSummary?: boolean') &&
    pricingSource.includes('horizontalPricingLayout?: boolean') &&
    pricingSource.includes("product-offer-pricing-horizontal") &&
    pricingSource.includes('{hidePricingSummary ? null : (') &&
    pricingCssSource.includes('grid-template-columns: 112px minmax(0, 1fr)'),
  'new listing pricing must hide summary rows and place every price label to the left of its input'
)

assert(
  metaSource.includes('hideHelperText?: boolean') &&
    metaSource.includes('horizontalBarcodeLayout?: boolean') &&
    metaSource.match(/hideHelperText \? null : \(/g)?.length === 1 &&
    metaSource.includes('Select warranty duration') &&
    metaSource.includes('hideHelperText ? null : <Text') &&
    metaSource.includes('Add offer note'),
  'new listing presentation must hide warranty and offer-note helper copy while retaining the controls'
)

assert(
  offerTabSource.includes('horizontalBarcodeLayout={compactListingOffer}') &&
    metaSource.includes('product-offer-barcode-horizontal') &&
    metaCssSource.includes('grid-template-columns: 112px minmax(0, 1fr)'),
  'existing and replacement Barcode controls must use left-label/right-content rows in listing mode'
)

assert(
  tabsTypesSource.includes('contentHeaderExtra?: ReactNode') &&
    editorSource.includes('contentHeaderExtra={aiPanel}') &&
    contentTabSource.includes('{contentHeaderExtra}') &&
    editorSource.includes('优化双语 Listing') &&
    !editorSource.includes('按标准生成双语 Listing'),
  'bilingual listing optimization must live inside Content with concise action copy'
)

assert(
  officialTabsSource.includes('if (!listingCreatePresentation)') &&
    officialTabsSource.indexOf("key: 'sizes'") > officialTabsSource.indexOf('if (!listingCreatePresentation)') &&
    officialTabsSource.indexOf("key: 'product-insights'") >
      officialTabsSource.indexOf('if (!listingCreatePresentation)'),
  'new listing flow must temporarily omit Sizes and Product Insights while retaining them for normal product details'
)

assert(
  tabsTypesSource.includes('tabBarExtraContent?: ReactNode') &&
    officialTabsSource.includes('tabBarExtraContent={props.tabBarExtraContent}') &&
    officialTabsSource.includes('product-listing-editor-tabs') &&
    editorSource.includes('tabBarExtraContent={tabBarExtraContent}') &&
    listingPageCssSource.includes('.product-listing-editor-tabs > .ant-tabs-nav') &&
    listingPageCssSource.includes('.product-listing-editor-card > .ant-card-body'),
  'listing actions must share a compact Offer/Content tab row'
)

assert(
  (adapterSource.match(/isActive: true/g)?.length ?? 0) >= 4 &&
    !adapterSource.includes('isActive: draft.isActive ?? true'),
  'new and edited listing payloads must always publish as active'
)

assert(
  contentTabSource.includes("horizontalLayout={offerPresentation === 'listing-create'}") &&
    classificationFieldsSource.includes('md={horizontalLayout ? 8 : 12}') &&
    classificationFieldsSource.includes('md={horizontalLayout ? 16 : 12}') &&
    classificationCssSource.includes('grid-template-columns: 180px minmax(0, 1fr)'),
  'listing brand and category fields must use left-right labels with a wider category column'
)
