import { message } from 'antd'
import { useMemo } from 'react'
import { ProductDetailOfficialTabs } from '../product-management/components/ProductDetailOfficialTabs'
import {
  productListingContentProgress,
  productListingEditorDraftDomains,
  productListingEditorDraftToSiteOffer,
  productListingEditorDraftToSnapshot,
  productListingEditorDraftToStockRows,
  productListingEditorDraftToSummary,
  normalizeProductListingEditorDraft,
  type ProductListingEditorDraft
} from './productDetailAdapter'

type ProductListingDetailEditorProps = {
  draft: ProductListingEditorDraft
  onDraftChange: (updater: (currentDraft: ProductListingEditorDraft) => ProductListingEditorDraft) => void
}

export function ProductListingDetailEditor({ draft, onDraftChange }: ProductListingDetailEditorProps) {
  const snapshot = useMemo(() => productListingEditorDraftToSnapshot(draft), [draft])
  const activeSiteOffer = useMemo(() => productListingEditorDraftToSiteOffer(draft), [draft])
  const summary = useMemo(() => productListingEditorDraftToSummary(draft), [draft])
  const domains = useMemo(() => productListingEditorDraftDomains(draft), [draft])
  const contentProgress = useMemo(() => productListingContentProgress(draft), [draft])
  const stockRows = useMemo(() => productListingEditorDraftToStockRows(draft), [draft])
  const imageUrls = useMemo(
    () => (Array.isArray(snapshot.content.images) ? snapshot.content.images.map(String).filter(Boolean) : []),
    [snapshot.content.images]
  )

  const patchDraft = (patch: Partial<ProductListingEditorDraft>) => {
    onDraftChange((currentDraft) => normalizeProductListingEditorDraft({ ...currentDraft, ...patch }))
  }

  const updateProductSectionField = (
    section: 'identity' | 'taxonomy' | 'content' | 'group',
    field: string,
    value: unknown
  ) => {
    if (section === 'identity') {
      if (field === 'brand') {
        patchDraft({ productBrand: text(value) })
      } else if (field === 'brandCode') {
        patchDraft({ productBrandCode: text(value) })
      } else if (field === 'barcode') {
        patchDraft({ barcode: text(value) })
      } else if (field === 'barcodes' && Array.isArray(value)) {
        patchDraft({ barcode: text(value[0]) })
      } else if (field === 'partnerSku' || field === 'pskuCode' || field === 'skuParent') {
        patchDraft({ psku: text(value) })
      }
      return
    }

    if (section === 'taxonomy') {
      if (field === 'productFulltype') {
        patchDraft({ productFullType: text(value) })
      } else if (field === 'family') {
        patchDraft({ family: text(value) })
      } else if (field === 'productType') {
        patchDraft({ productType: text(value) })
      } else if (field === 'productSubtype') {
        patchDraft({ productSubType: text(value) })
      }
      return
    }

    if (section === 'content') {
      if (field === 'titleCn') {
        patchDraft({ productTitleCn: text(value) })
      } else if (field === 'titleEn') {
        patchDraft({ productTitleEn: text(value) })
      } else if (field === 'titleAr') {
        patchDraft({ productTitleAr: text(value) })
      } else if (field === 'descriptionCn' || field === 'descriptionZh') {
        patchDraft({ productDescriptionCn: text(value) })
      } else if (field === 'descriptionEn') {
        patchDraft({ productDescriptionEn: text(value) })
      } else if (field === 'descriptionAr') {
        patchDraft({ productDescriptionAr: text(value) })
      } else if (field === 'highlightsZh') {
        patchDraft({ productHighlightsCn: stringList(value) })
      } else if (field === 'highlightsEn') {
        patchDraft({ productHighlightsEn: stringList(value) })
      } else if (field === 'highlightsAr') {
        patchDraft({ productHighlightsAr: stringList(value) })
      } else if (field === 'images') {
        patchDraft({ imageUrls: stringList(value) })
      }
    }
  }

  const updateProductMultilineField = (field: 'highlightsEn' | 'highlightsAr' | 'images', value: string) => {
    if (field === 'images') {
      patchDraft({ imageUrls: multilineList(value) })
    } else if (field === 'highlightsEn') {
      patchDraft({ productHighlightsEn: multilineList(value) })
    } else {
      patchDraft({ productHighlightsAr: multilineList(value) })
    }
  }

  const updateSiteOfferField = (_storeCode: string, field: string, value: unknown) => {
    if (field === 'price') {
      patchDraft({ price: text(value) })
    } else if (field === 'priceMin') {
      patchDraft({ priceMin: text(value) })
    } else if (field === 'priceMax') {
      patchDraft({ priceMax: text(value) })
    } else if (field === 'salePrice') {
      patchDraft({ salePrice: text(value) })
    } else if (field === 'saleStart') {
      patchDraft({ saleStart: text(value) })
    } else if (field === 'saleEnd') {
      patchDraft({ saleEnd: text(value) })
    } else if (field === 'isActive') {
      patchDraft({ isActive: Boolean(value) })
    } else if (field === 'idWarranty') {
      patchDraft({ idWarranty: text(value) })
    } else if (field === 'offerNote') {
      patchDraft({ offerNote: text(value) })
    }
  }

  const updateProductVariant = (index: number, field: 'childSku' | 'sizeEn' | 'sizeAr', value: string) => {
    if (index !== 0) {
      return
    }
    if (field === 'sizeEn') {
      patchDraft({ sizeEn: value })
    } else if (field === 'sizeAr') {
      patchDraft({ sizeAr: value })
    }
  }

  const updateProductAttributeField = (code: string, field: string, value: string) => {
    if (['barcode', 'barcodes', 'ean', 'gtin', 'upc'].includes(code.toLowerCase())) {
      patchDraft({ barcode: value })
      return
    }
    message.info(`${field} 暂只保留在当前页面草稿，后端上架草稿暂未接入该属性。`)
  }

  const openCurrentProductGallery = (index: number) => {
    const imageUrl = imageUrls[index]
    if (imageUrl) {
      window.open(imageUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <ProductDetailOfficialTabs
      defaultActiveKey="content"
      productSiteDomain={domains.site}
      productSharedDomainDirtyCount={0}
      productActionSubmitting={false}
      currentProductSummarySurface={summary}
      productSnapshotView={snapshot}
      activeProductSiteOffer={activeSiteOffer}
      activeSiteDirty
      activeSiteOfferCode={draft.storeCode}
      productWarehouseStockRows={stockRows}
      siteOfferColumns={[]}
      productPlatformSignals={{}}
      productPlatformRejectionReasons={[]}
      productPlatformAffectingAttributes={[]}
      productContentDomain={domains.content}
      productContentProgressDone={contentProgress.done}
      productContentProgressTotal={contentProgress.total}
      productMainDomain={domains.main}
      productImageUrls={imageUrls}
      productAttributesDomain={domains.attributes}
      productRequiredAttributeCount={0}
      productFilledRequiredAttributeCount={0}
      productGroupingDomain={domains.grouping}
      productGroupMembers={[]}
      productCandidateGroups={[]}
      productListSourceItems={[]}
      productInsightMetrics={[]}
      productLeadImage={imageUrls[0]}
      previewProductAction={() => undefined}
      updateSiteOfferField={updateSiteOfferField}
      setActiveSiteOfferCode={() => undefined}
      updateProductSectionField={updateProductSectionField}
      updateProductMultilineField={updateProductMultilineField}
      openCurrentProductGallery={openCurrentProductGallery}
      addProductVariant={() => undefined}
      updateProductVariant={updateProductVariant}
      removeProductVariant={() => undefined}
      updateProductAxes={() => undefined}
      updateProductAttributeField={updateProductAttributeField}
    />
  )
}

function text(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item).trim()).filter(Boolean)
  }
  return []
}

function multilineList(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
}
