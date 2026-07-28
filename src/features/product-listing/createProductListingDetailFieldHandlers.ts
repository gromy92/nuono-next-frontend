import {
  normalizeProductListingEditorDraft,
  updateProductListingKeyAttributeField,
  type ProductListingEditorDraft
} from './productDetailAdapter'
import {
  listingEditorImageAssetMetadataList,
  listingEditorImageRoleAssignmentList,
  listingEditorMultilineList,
  listingEditorStringList,
  listingEditorText
} from './productListingDetailValueAdapters'

type FieldHandlerInput = {
  imageUrls: string[]
  onDraftChange: (updater: (currentDraft: ProductListingEditorDraft) => ProductListingEditorDraft) => void
}

export function createProductListingDetailFieldHandlers({
  imageUrls,
  onDraftChange
}: FieldHandlerInput) {
  const patchDraft = (patch: Partial<ProductListingEditorDraft>) => {
    onDraftChange((currentDraft) => normalizeProductListingEditorDraft({ ...currentDraft, ...patch }))
  }

  const updateProductSectionField = (
    section: 'identity' | 'taxonomy' | 'content' | 'group',
    field: string,
    value: unknown
  ) => {
    if (section === 'identity') {
      if (field === 'brand') patchDraft({ productBrand: listingEditorText(value) })
      else if (field === 'brandCode') patchDraft({ productBrandCode: listingEditorText(value) })
      else if (field === 'barcode') patchDraft({ barcode: listingEditorText(value) })
      else if (field === 'barcodes' && Array.isArray(value)) patchDraft({ barcode: listingEditorText(value[0]) })
      else if (field === 'partnerSku' || field === 'pskuCode' || field === 'skuParent') patchDraft({ psku: listingEditorText(value) })
      return
    }

    if (section === 'taxonomy') {
      if (field === 'productFulltype') patchDraft({ productFullType: listingEditorText(value) })
      else if (field === 'family') patchDraft({ family: listingEditorText(value) })
      else if (field === 'productType') patchDraft({ productType: listingEditorText(value) })
      else if (field === 'productSubtype') patchDraft({ productSubType: listingEditorText(value) })
      return
    }

    if (section === 'content') {
      if (field === 'titleCn') patchDraft({ productTitleCn: listingEditorText(value) })
      else if (field === 'titleEn') patchDraft({ productTitleEn: listingEditorText(value) })
      else if (field === 'titleAr') patchDraft({ productTitleAr: listingEditorText(value) })
      else if (field === 'descriptionCn' || field === 'descriptionZh') patchDraft({ productDescriptionCn: listingEditorText(value) })
      else if (field === 'descriptionEn') patchDraft({ productDescriptionEn: listingEditorText(value) })
      else if (field === 'descriptionAr') patchDraft({ productDescriptionAr: listingEditorText(value) })
      else if (field === 'highlightsZh') patchDraft({ productHighlightsCn: listingEditorStringList(value) })
      else if (field === 'highlightsEn') patchDraft({ productHighlightsEn: listingEditorStringList(value) })
      else if (field === 'highlightsAr') patchDraft({ productHighlightsAr: listingEditorStringList(value) })
      else if (field === 'images') patchDraft({ imageUrls: listingEditorStringList(value) })
      else if (field === 'imageRoleAssignments') patchDraft({ imageRoleAssignments: listingEditorImageRoleAssignmentList(value) })
      else if (field === 'imageAssetMetadata') patchDraft({ imageAssetMetadata: listingEditorImageAssetMetadataList(value) })
    }
  }

  const updateProductMultilineField = (field: 'highlightsEn' | 'highlightsAr' | 'images', value: string) => {
    if (field === 'images') patchDraft({ imageUrls: listingEditorMultilineList(value) })
    else if (field === 'highlightsEn') patchDraft({ productHighlightsEn: listingEditorMultilineList(value) })
    else patchDraft({ productHighlightsAr: listingEditorMultilineList(value) })
  }

  const updateSiteOfferField = (_storeCode: string, field: string, value: unknown) => {
    if (field === 'price') patchDraft({ price: listingEditorText(value) })
    else if (field === 'priceMin') patchDraft({ priceMin: listingEditorText(value) })
    else if (field === 'priceMax') patchDraft({ priceMax: listingEditorText(value) })
    else if (field === 'salePrice') patchDraft({ salePrice: listingEditorText(value) })
    else if (field === 'saleStart') patchDraft({ saleStart: listingEditorText(value) })
    else if (field === 'saleEnd') patchDraft({ saleEnd: listingEditorText(value) })
    else if (field === 'idWarranty') patchDraft({ idWarranty: listingEditorText(value) })
    else if (field === 'offerNote') patchDraft({ offerNote: listingEditorText(value) })
  }

  const updateProductVariant = (index: number, field: 'childSku' | 'sizeEn' | 'sizeAr', value: string) => {
    if (index !== 0) return
    if (field === 'sizeEn') patchDraft({ sizeEn: value })
    else if (field === 'sizeAr') patchDraft({ sizeAr: value })
  }

  const updateProductAttributeField = (code: string, field: string, value: string) => {
    if (['barcode', 'barcodes', 'ean', 'gtin', 'upc'].includes(code.toLowerCase())) {
      patchDraft({ barcode: value })
      return
    }
    onDraftChange((currentDraft) =>
      normalizeProductListingEditorDraft({
        ...currentDraft,
        keyAttributes: updateProductListingKeyAttributeField(currentDraft.keyAttributes, code, field, value)
      })
    )
  }

  const openCurrentProductGallery = (index: number) => {
    const imageUrl = imageUrls[index]
    if (imageUrl) window.open(imageUrl, '_blank', 'noopener,noreferrer')
  }

  return {
    openCurrentProductGallery,
    patchDraft,
    updateProductAttributeField,
    updateProductMultilineField,
    updateProductSectionField,
    updateProductVariant,
    updateSiteOfferField
  }
}
