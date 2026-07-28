import type { ReactNode } from 'react';
import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent';
import type { ProductMasterSnapshotPayload } from '../product-domain/productMasterSnapshot';
import type { ProductSummarySurface } from '../product-domain/productSummaryTypes';
import type { NoonImageAssetMetadata } from '../product-image-profile/noonListingImageRequirements';
import type { ProductImageRoleAssignment } from '../product-image-profile/productImageRole';
import type { ProductFieldDomainSurface } from './productFieldDomain';

export type ProductFieldValidationIssue = {
  fieldKey: string;
  severity?: string;
  code?: string;
  message: string;
};

export type ProductDetailEditorPresentationProps = {
  offerPresentation?: 'default' | 'listing-create';
};

type ProductDetailEditorHostChromeProps = ProductDetailEditorPresentationProps & {
  defaultActiveKey?: 'offer' | 'content' | 'sizes' | 'product-insights';
  productSiteDomain?: ProductFieldDomainSurface;
  productSharedDomainDirtyCount: number;
  tabBarExtraContent?: ReactNode;
};

export type ProductOfferEditorProps = ProductDetailEditorPresentationProps & {
  productSnapshotView?: ProductMasterSnapshotPayload;
  activeProductSiteOffer?: Record<string, unknown>;
  currentProductSummarySurface: ProductSummarySurface | null;
  productWarehouseStockRows: Array<Record<string, unknown>>;
  offerHeaderExtra?: ReactNode;
  hideOfferStockSection?: boolean;
  barcodeValidationIssue?: ProductFieldValidationIssue;
  onBarcodeDraftChange?: (value: string) => void;
  updateSiteOfferField: (storeCode: string, field: string, value: unknown) => void;
  updateProductSectionField: ProductSectionFieldUpdater;
  updateProductAttributeField: (code: string, field: string, value: string) => void;
};

export type ProductContentEditorProps = ProductDetailEditorPresentationProps & {
  productContentDomain?: ProductFieldDomainSurface;
  productContentProgressDone: number;
  productContentProgressTotal: number;
  contentHeaderExtra?: ReactNode;
  productCompetitorMaterials?: ProductCompetitorContentMaterial[];
  productListingKeywordSuggestions?: {
    EN?: string[];
    AR?: string[];
  };
  enableCompetitorContentMerge?: boolean;
  productMainDomain?: ProductFieldDomainSurface;
  productImageUrls: string[];
  productImageRoleAssignments?: ProductImageRoleAssignment[];
  productImageAssetMetadata?: NoonImageAssetMetadata[];
  productAttributesDomain?: ProductFieldDomainSurface;
  productSnapshotView?: ProductMasterSnapshotPayload;
  allowEmptyImages?: boolean;
  updateProductSectionField: ProductSectionFieldUpdater;
  updateProductMultilineField: (
    field: 'highlightsEn' | 'highlightsAr' | 'images',
    value: string
  ) => void;
  updateProductAttributeField: (code: string, field: string, value: string) => void;
  openCurrentProductGallery: (index: number) => void;
};

export type ProductSizesEditorProps = {
  productSnapshotView?: ProductMasterSnapshotPayload;
  productGroupingDomain?: ProductFieldDomainSurface;
  updateProductVariant: (
    index: number,
    field: 'childSku' | 'sizeEn' | 'sizeAr',
    value: string
  ) => void;
  removeProductVariant: (index: number) => void;
};

export type ProductInsightsEditorProps = {
  currentProductSummarySurface: ProductSummarySurface | null;
  productSnapshotView?: ProductMasterSnapshotPayload;
  productInsightMetrics: Array<{ label: string; value: string | number }>;
  productLeadImage?: string;
};

export type ProductDetailEditorHostProps =
  & ProductDetailEditorHostChromeProps
  & ProductOfferEditorProps
  & ProductContentEditorProps
  & ProductSizesEditorProps
  & ProductInsightsEditorProps;

type ProductSectionFieldUpdater = (
  section: 'identity' | 'taxonomy' | 'content' | 'group',
  field: string,
  value: unknown
) => void;
