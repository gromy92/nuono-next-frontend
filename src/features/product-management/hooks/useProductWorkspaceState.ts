import { useRef, useState } from 'react';
import { Form } from 'antd';
import { defaultProductListFilters } from '../config';
import type {
  ProductListDatasetState,
  ProductListUiState,
  ProductVariantSpecModalState,
  ProductSiteCompareModalState,
  ProductSummarySurface,
  ProductWorkbenchSurfaceState,
  StoreInitializationState
} from '../types';
import { closedProductSiteCompareModalState } from '../utils';

export function useProductWorkspaceState() {
  const [storeInitializationForm] = Form.useForm();
  const [storeInitializationSubmitting, setStoreInitializationSubmitting] = useState(false);
  const [selectedInitializationStoreCodeOverride, setSelectedInitializationStoreCodeOverride] = useState<string>();
  const [storeInitializationState, setStoreInitializationState] = useState<StoreInitializationState>({ status: 'idle' });
  const [productListDatasetState, setProductListDatasetState] = useState<ProductListDatasetState>({ status: 'idle' });
  const [productListDraftFilters, setProductListDraftFilters] = useState({ ...defaultProductListFilters });
  const [productListFilters, setProductListFilters] = useState({ ...defaultProductListFilters });
  const [productListAdvancedFiltersOpen, setProductListAdvancedFiltersOpen] = useState(false);
  const [productListSortKey, setProductListSortKey] = useState('lastSync');
  const [selectedProductRowKeys, setSelectedProductRowKeys] = useState<string[]>([]);
  const [productWorkbenchSurfaceState, setProductWorkbenchSurfaceState] = useState<ProductWorkbenchSurfaceState>({
    status: 'idle'
  });
  const [productListUiStates, setProductListUiStates] = useState<Record<string, ProductListUiState>>({});
  const [productSnapshotSubmitting, setProductSnapshotSubmitting] = useState(false);
  const [productActionSubmitting, setProductActionSubmitting] = useState(false);
  const [activeSiteOfferCode, setActiveSiteOfferCode] = useState<string>();
  const [productGalleryOpen, setProductGalleryOpen] = useState(false);
  const [productGalleryImages, setProductGalleryImages] = useState<string[]>([]);
  const [productGalleryIndex, setProductGalleryIndex] = useState(0);
  const [productGalleryTitle, setProductGalleryTitle] = useState<string>();
  const [productGallerySubtitle, setProductGallerySubtitle] = useState<string>();
  const [productHistoryModalOpen, setProductHistoryModalOpen] = useState(false);
  const [productHistoryModalTitle, setProductHistoryModalTitle] = useState<string>();
  const [productHistoryModalSummary, setProductHistoryModalSummary] = useState<ProductSummarySurface | null>(null);
  const [productHistoryModalEntryLabel, setProductHistoryModalEntryLabel] = useState<string>();
  const [productHistoryModalEntryColor, setProductHistoryModalEntryColor] =
    useState<'success' | 'processing' | 'warning' | 'error' | 'default'>('default');
  const [productHistoryModalItems, setProductHistoryModalItems] = useState<Array<Record<string, unknown>>>([]);
  const [productHistoryModalNote, setProductHistoryModalNote] = useState<string>();
  const [productHistoryModalLoading, setProductHistoryModalLoading] = useState(false);
  const [productHistoryModalHistoryMetaReady, setProductHistoryModalHistoryMetaReady] = useState(false);
  const [productHistoryModalVisibleHistoryCount, setProductHistoryModalVisibleHistoryCount] = useState(0);
  const [productHistoryModalPendingCount, setProductHistoryModalPendingCount] = useState(0);
  const [productHistoryModalPendingVisibleAfter, setProductHistoryModalPendingVisibleAfter] = useState<string>();
  const [productSiteCompareModalState, setProductSiteCompareModalState] = useState<ProductSiteCompareModalState>(
    closedProductSiteCompareModalState()
  );
  const [productVariantSpecModalState, setProductVariantSpecModalState] = useState<ProductVariantSpecModalState>({
    open: false
  });
  const [showInitializationDiagnostics, setShowInitializationDiagnostics] = useState(false);
  const [productSnapshotForm] = Form.useForm();
  const productWorkbenchRef = useRef<HTMLDivElement | null>(null);
  const productDetailTabHandledRef = useRef<string | null>(null);
  const lastInitializationStoreCodeRef = useRef<string | undefined>(undefined);

  return {
    storeInitializationForm,
    storeInitializationSubmitting,
    setStoreInitializationSubmitting,
    selectedInitializationStoreCodeOverride,
    setSelectedInitializationStoreCodeOverride,
    storeInitializationState,
    setStoreInitializationState,
    productListDatasetState,
    setProductListDatasetState,
    productListDraftFilters,
    setProductListDraftFilters,
    productListFilters,
    setProductListFilters,
    productListAdvancedFiltersOpen,
    setProductListAdvancedFiltersOpen,
    productListSortKey,
    setProductListSortKey,
    selectedProductRowKeys,
    setSelectedProductRowKeys,
    productWorkbenchSurfaceState,
    setProductWorkbenchSurfaceState,
    productListUiStates,
    setProductListUiStates,
    productSnapshotSubmitting,
    setProductSnapshotSubmitting,
    productActionSubmitting,
    setProductActionSubmitting,
    activeSiteOfferCode,
    setActiveSiteOfferCode,
    productGalleryOpen,
    setProductGalleryOpen,
    productGalleryImages,
    setProductGalleryImages,
    productGalleryIndex,
    setProductGalleryIndex,
    productGalleryTitle,
    setProductGalleryTitle,
    productGallerySubtitle,
    setProductGallerySubtitle,
    productHistoryModalOpen,
    setProductHistoryModalOpen,
    productHistoryModalTitle,
    setProductHistoryModalTitle,
    productHistoryModalSummary,
    setProductHistoryModalSummary,
    productHistoryModalEntryLabel,
    setProductHistoryModalEntryLabel,
    productHistoryModalEntryColor,
    setProductHistoryModalEntryColor,
    productHistoryModalItems,
    setProductHistoryModalItems,
    productHistoryModalNote,
    setProductHistoryModalNote,
    productHistoryModalLoading,
    setProductHistoryModalLoading,
    productHistoryModalHistoryMetaReady,
    setProductHistoryModalHistoryMetaReady,
    productHistoryModalVisibleHistoryCount,
    setProductHistoryModalVisibleHistoryCount,
    productHistoryModalPendingCount,
    setProductHistoryModalPendingCount,
    productHistoryModalPendingVisibleAfter,
    setProductHistoryModalPendingVisibleAfter,
    productSiteCompareModalState,
    setProductSiteCompareModalState,
    productVariantSpecModalState,
    setProductVariantSpecModalState,
    showInitializationDiagnostics,
    setShowInitializationDiagnostics,
    productSnapshotForm,
    productWorkbenchRef,
    productDetailTabHandledRef,
    lastInitializationStoreCodeRef
  };
}
