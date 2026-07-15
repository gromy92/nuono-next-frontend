import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const apiSource = readFileSync(new URL('./api.ts', import.meta.url), 'utf8')
const editorSource = readFileSync(new URL('./ProductListingDetailEditor.tsx', import.meta.url), 'utf8')
const officialTabsTypesSource = readFileSync(
  new URL('../product-management/components/ProductDetailOfficialTabs.types.ts', import.meta.url),
  'utf8'
)
const offerTabSource = readFileSync(new URL('../product-management/components/ProductOfferTab.tsx', import.meta.url), 'utf8')
const offerMetaSource = readFileSync(
  new URL('../product-management/components/ProductOfferMetaSection.tsx', import.meta.url),
  'utf8'
)

assert(
  apiSource.includes('validateProductListingFields') &&
    apiSource.includes('/api/product-listing/field-validation'),
  'product listing frontend API must expose lightweight duplicate field validation'
)

assert(
  editorSource.includes('validateProductListingFields') &&
    editorSource.includes('fieldValidationIssues') &&
    editorSource.includes("issue.fieldKey === 'psku'") &&
    editorSource.includes("status={pskuValidationIssue ? 'error' : undefined}") &&
    editorSource.includes('barcodeValidationIssue'),
  'listing editor should validate PSKU/Barcode while editing and mark duplicate PSKU as an input error'
)

assert(
  officialTabsTypesSource.includes('barcodeValidationIssue?: ProductFieldValidationIssue') &&
    officialTabsTypesSource.includes('onBarcodeDraftChange?: (value: string) => void') &&
    offerTabSource.includes('barcodeValidationIssue={barcodeValidationIssue}') &&
    offerTabSource.includes('onBarcodeDraftChange={onBarcodeDraftChange}') &&
    offerMetaSource.includes("status={barcodeValidationIssue ? 'error' : undefined}") &&
    offerMetaSource.includes('onBarcodeDraftChange?.(nextValue)') &&
    offerMetaSource.includes('{showBarcodeValidationIssue ?'),
  'offer Barcode input should surface typed values for duplicate validation and render a red field-level message'
)
