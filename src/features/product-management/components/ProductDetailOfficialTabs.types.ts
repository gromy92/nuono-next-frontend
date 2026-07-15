import type { ReactNode } from 'react';
import type { ColumnsType } from 'antd/es/table';
import type {
  ProductFieldDomainSurface,
  ProductListRowPayload,
  ProductMasterSnapshotPayload,
  ProductWorkbenchActionOptions,
  ProductSummarySurface
} from '../types';
import type { ProductCompetitorContentMaterial } from '../types/competitorContent';
import type { ProductImageRoleAssignment } from '../types/productImageRole';
import type { NoonImageAssetMetadata } from '../utils/noonImageRequirements';

export type ProductFieldValidationIssue = {
  fieldKey: string;
  severity?: string;
  code?: string;
  message: string;
};

export type ProductDetailOfficialTabsProps = {
  defaultActiveKey?: 'offer' | 'content' | 'sizes' | 'product-insights';
  productSiteDomain?: ProductFieldDomainSurface;
  productSharedDomainDirtyCount: number;
  productActionSubmitting: boolean;
  currentProductSummarySurface: ProductSummarySurface | null;
  productSnapshotView?: ProductMasterSnapshotPayload;
  activeProductSiteOffer?: Record<string, unknown>;
  activeSiteDirty: boolean;
  activeSiteOfferCode?: string;
  productWarehouseStockRows: Array<Record<string, unknown>>;
  siteOfferColumns: ColumnsType<Record<string, unknown>>;
  productPlatformSignals: Record<string, unknown>;
  productPlatformRejectionReasons: string[];
  productPlatformAffectingAttributes: string[];
  productContentDomain?: ProductFieldDomainSurface;
  productContentProgressDone: number;
  productContentProgressTotal: number;
  productCompetitorMaterials?: ProductCompetitorContentMaterial[];
  enableCompetitorContentMerge?: boolean;
  productMainDomain?: ProductFieldDomainSurface;
  productImageUrls: string[];
  productImageRoleAssignments?: ProductImageRoleAssignment[];
  productImageAssetMetadata?: NoonImageAssetMetadata[];
  productAttributesDomain?: ProductFieldDomainSurface;
  productRequiredAttributeCount: number;
  productFilledRequiredAttributeCount: number;
  productGroupingDomain?: ProductFieldDomainSurface;
  productGroupMembers: Array<Record<string, unknown>>;
  productCandidateGroups: Array<Record<string, unknown>>;
  productListSourceItems: ProductListRowPayload[];
  productInsightMetrics: Array<{ label: string; value: string | number }>;
  productLeadImage?: string;
  allowEmptyImages?: boolean;
  offerHeaderExtra?: ReactNode;
  barcodeValidationIssue?: ProductFieldValidationIssue;
  onBarcodeDraftChange?: (value: string) => void;
  previewProductAction: (action: 'save' | 'publish-current' | 'pull', options?: ProductWorkbenchActionOptions) => void | Promise<void>;
  updateSiteOfferField: (storeCode: string, field: string, value: unknown) => void;
  setActiveSiteOfferCode: (storeCode: string) => void;
  updateProductSectionField: (
    section: 'identity' | 'taxonomy' | 'content' | 'group',
    field: string,
    value: unknown
  ) => void;
  updateProductMultilineField: (field: 'highlightsEn' | 'highlightsAr' | 'images', value: string) => void;
  openCurrentProductGallery: (index: number) => void;
  addProductVariant: () => void;
  updateProductVariant: (index: number, field: 'childSku' | 'sizeEn' | 'sizeAr', value: string) => void;
  removeProductVariant: (index: number) => void;
  updateProductAxes: (value: string) => void;
  updateProductAttributeField: (code: string, field: string, value: string) => void;
};
