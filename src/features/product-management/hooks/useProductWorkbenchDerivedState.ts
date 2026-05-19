import { useEffect, useMemo } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import { isVisibleDetailedAttributeRecord } from '../productAttributeTemplate';
import { productSharedSnapshot } from '../workspaceHelpers';
import {
  areSnapshotPartsEqual,
  buildProductInsightMetrics,
  buildProductSiteSummary,
  buildProductFieldDomainSurface,
  buildProductSummarySurfaceFromWorkbench,
  buildProductWarehouseStockRows,
  countProductContentProgress,
  normalizeSnapshotTextList,
  normalizeStringList,
  pickAttributeValue,
  productHistoryEntryMeta,
  productSyncStatusMeta,
  siteOfferEditableFieldsEqual,
  siteOfferCode,
  textInputValue
} from '../utils';
import type {
  ProductDetailTabRequest,
  ProductListRowPayload,
  ProductMasterSnapshotState,
  ProductWorkbenchSurfaceState
} from '../types';

type UseProductWorkbenchDerivedStateParams = {
  activeSiteOfferCode?: string;
  productDetailTabRequest: ProductDetailTabRequest | null;
  productListItemBySkuParent: Map<string, ProductListRowPayload>;
  productWorkbenchRef: RefObject<HTMLDivElement | null>;
  productWorkbenchSurfaceState: ProductWorkbenchSurfaceState;
  setActiveSiteOfferCode: Dispatch<SetStateAction<string | undefined>>;
};

export function useProductWorkbenchDerivedState({
  activeSiteOfferCode,
  productDetailTabRequest,
  productListItemBySkuParent,
  productWorkbenchRef,
  productWorkbenchSurfaceState,
  setActiveSiteOfferCode
}: UseProductWorkbenchDerivedStateParams) {
  const productWorkbenchState =
    productWorkbenchSurfaceState.status === 'ready' ? productWorkbenchSurfaceState.workbench : null;
  const productWorkbenchContext =
    productWorkbenchSurfaceState.status === 'idle' ? null : productWorkbenchSurfaceState.context;
  const productWorkbenchSummaryPreview =
    productWorkbenchSurfaceState.status === 'ready'
      ? productWorkbenchSurfaceState.summary
      : productWorkbenchSurfaceState.status === 'idle'
        ? null
        : productWorkbenchSurfaceState.context?.summaryPreview ?? null;
  const productWorkbenchRecentActions =
    productWorkbenchSurfaceState.status === 'ready' ? productWorkbenchSurfaceState.recentActions : [];

  useEffect(() => {
    if (!productWorkbenchState) {
      return;
    }

    const siteOffers = productWorkbenchState.draft.siteOffers;
    if (!siteOffers.length) {
      setActiveSiteOfferCode(undefined);
      return;
    }

    const referenceSite =
      siteOffers.find((item) => Boolean(item.reference)) ??
      siteOffers.find((item) => typeof item.storeCode === 'string') ??
      siteOffers[0];

    const referenceCode =
      typeof referenceSite.storeCode === 'string' && referenceSite.storeCode
        ? referenceSite.storeCode
        : undefined;

    setActiveSiteOfferCode((currentValue) => {
      if (
        currentValue &&
        siteOffers.some((item) => typeof item.storeCode === 'string' && item.storeCode === currentValue)
      ) {
        return currentValue;
      }
      return referenceCode;
    });
  }, [productWorkbenchState, setActiveSiteOfferCode]);

  const productSnapshotState = useMemo<ProductMasterSnapshotState>(() => {
    if (productWorkbenchSurfaceState.status === 'idle') {
      return { status: 'idle' };
    }
    if (productWorkbenchSurfaceState.status === 'loading') {
      return { status: 'loading' };
    }
    if (productWorkbenchSurfaceState.status === 'error') {
      return { status: 'error', message: productWorkbenchSurfaceState.message };
    }
    return { status: 'success', data: productWorkbenchSurfaceState.payload };
  }, [productWorkbenchSurfaceState]);

  const productSnapshotView = productWorkbenchState?.draft;
  const currentProductSkuParent =
    productSnapshotView && typeof productSnapshotView.identity.skuParent === 'string'
      ? productSnapshotView.identity.skuParent
      : undefined;
  const currentProductSummarySurface = useMemo(
    () =>
      buildProductSummarySurfaceFromWorkbench(
        productWorkbenchState,
        currentProductSkuParent ? productListItemBySkuParent.get(currentProductSkuParent) : undefined
      ),
    [currentProductSkuParent, productListItemBySkuParent, productWorkbenchState]
  );
  const productDetailSummarySurface = currentProductSummarySurface ?? productWorkbenchSummaryPreview;
  const productWorkbenchSessionSkuParent =
    productWorkbenchContext?.skuParent || currentProductSkuParent || productDetailTabRequest?.skuParent;

  useEffect(() => {
    if (productSnapshotState.status === 'idle') {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      productWorkbenchRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [currentProductSkuParent, productSnapshotState.status, productWorkbenchRef]);

  const productDraftDirty = useMemo(() => {
    if (!productWorkbenchState) {
      return false;
    }
    return !areSnapshotPartsEqual(productWorkbenchState.draft, productWorkbenchState.baseline);
  }, [productWorkbenchState]);

  const sharedDraftDirty = useMemo(() => {
    if (!productWorkbenchState) {
      return false;
    }

    return !areSnapshotPartsEqual(
      productSharedSnapshot(productWorkbenchState.draft),
      productSharedSnapshot(productWorkbenchState.baseline)
    );
  }, [productWorkbenchState]);

  const dirtySiteOfferCodes = useMemo(() => {
    if (!productWorkbenchState) {
      return [];
    }

    const baselineByCode = new Map(
      productWorkbenchState.baseline.siteOffers.map((item) => [siteOfferCode(item), item] as const)
    );

    return productWorkbenchState.draft.siteOffers
      .filter((item) => !siteOfferEditableFieldsEqual(item, baselineByCode.get(siteOfferCode(item))))
      .map((item) => siteOfferCode(item));
  }, [productWorkbenchState]);

  const activeProductSiteOffer = productSnapshotView
    ? productSnapshotView.siteOffers.find((item) => siteOfferCode(item) === activeSiteOfferCode) ??
      productSnapshotView.siteOffers[0]
    : undefined;

  const activeSiteDirty = activeProductSiteOffer ? dirtySiteOfferCodes.includes(siteOfferCode(activeProductSiteOffer)) : false;
  const productWorkbenchFieldSurface = useMemo(
    () => buildProductFieldDomainSurface(productWorkbenchState, activeSiteOfferCode),
    [activeSiteOfferCode, productWorkbenchState]
  );
  const productWorkbenchHistoryMeta = useMemo(
    () =>
      productHistoryEntryMeta({
        usingMock: productWorkbenchSurfaceState.status === 'ready' ? productWorkbenchSurfaceState.context.mode === 'mock' : false,
        isCurrentWorkbench: Boolean(productWorkbenchState),
        pendingCount: productWorkbenchState?.pendingKeyContentHistoryCount,
        historyCount: productWorkbenchState?.keyContentHistory.length,
        historyMetaReady: Boolean(productWorkbenchState),
        pendingVisibleAfter: productWorkbenchState?.pendingKeyContentHistoryVisibleAfter
      }),
    [productWorkbenchState, productWorkbenchSurfaceState]
  );
  const productMainDomain = productWorkbenchFieldSurface?.domains.find((item) => item.key === 'main');
  const productContentDomain = productWorkbenchFieldSurface?.domains.find((item) => item.key === 'content');
  const productGroupingDomain = productWorkbenchFieldSurface?.domains.find((item) => item.key === 'grouping');
  const productAttributesDomain = productWorkbenchFieldSurface?.domains.find((item) => item.key === 'attributes');
  const productSiteDomain = productWorkbenchFieldSurface?.domains.find((item) => item.key === 'site');
  const productSharedDomainDirtyCount = [
    productMainDomain,
    productContentDomain,
    productGroupingDomain,
    productAttributesDomain
  ].filter((item) => Boolean(item?.dirty)).length;

  const productSyncMeta = productSyncStatusMeta(productWorkbenchState?.syncStatus ?? 'synced');
  const productImageUrls = normalizeStringList(productSnapshotView?.content.images);
  const productLeadImage = productImageUrls[0];
  const productSiteSummary = useMemo(
    () => buildProductSiteSummary(productSnapshotView, dirtySiteOfferCodes),
    [dirtySiteOfferCodes, productSnapshotView]
  );

  const productPlatformSignals = productSnapshotView?.platformSignals ?? {};
  const productPlatformRejectionReasons = normalizeSnapshotTextList(productPlatformSignals.rejectionReasons);
  const productPlatformAffectingAttributes = normalizeSnapshotTextList(productPlatformSignals.affectingAttributes);
  const productGroupMembers = Array.isArray(productSnapshotView?.group.members)
    ? (productSnapshotView?.group.members as Array<Record<string, unknown>>)
    : [];
  const productCandidateGroups = Array.isArray(productSnapshotView?.group.candidateGroups)
    ? (productSnapshotView?.group.candidateGroups as Array<Record<string, unknown>>)
    : [];
  const visibleProductAttributes = (productSnapshotView?.keyAttributes ?? []).filter(isVisibleDetailedAttributeRecord);
  const productRequiredAttributeCount = visibleProductAttributes.filter((item) => Boolean(item.required)).length;
  const productFilledRequiredAttributeCount = visibleProductAttributes.filter(
    (item) => Boolean(item.required) && Boolean(pickAttributeValue(item))
  ).length;
  const productContentProgressTotal = 6;
  const productContentProgressDone = countProductContentProgress(productSnapshotView);
  const productWarehouseStockRows = useMemo(
    () => buildProductWarehouseStockRows(productSnapshotView, activeProductSiteOffer),
    [activeProductSiteOffer, productSnapshotView]
  );
  const productInsightMetrics = buildProductInsightMetrics(productSnapshotView, productPlatformSignals);

  return {
    productWorkbenchState,
    productWorkbenchContext,
    productWorkbenchSummaryPreview,
    productWorkbenchRecentActions,
    productSnapshotState,
    productSnapshotView,
    currentProductSkuParent,
    currentProductSummarySurface,
    productDetailSummarySurface,
    productWorkbenchSessionSkuParent,
    productDraftDirty,
    sharedDraftDirty,
    dirtySiteOfferCodes,
    activeProductSiteOffer,
    activeSiteDirty,
    productWorkbenchFieldSurface,
    productWorkbenchHistoryMeta,
    productMainDomain,
    productContentDomain,
    productGroupingDomain,
    productAttributesDomain,
    productSiteDomain,
    productSharedDomainDirtyCount,
    productSyncMeta,
    productImageUrls,
    productLeadImage,
    productSiteSummary,
    productPlatformSignals,
    productPlatformRejectionReasons,
    productPlatformAffectingAttributes,
    productGroupMembers,
    productCandidateGroups,
    productRequiredAttributeCount,
    productFilledRequiredAttributeCount,
    productContentProgressTotal,
    productContentProgressDone,
    productWarehouseStockRows,
    productInsightMetrics
  };
}
