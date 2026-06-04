import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { message } from 'antd';
import type { AuthSession } from '../../auth/session';
import { fetchStoreInitializationStatus, startStoreInitializationRequest } from '../api';
import { findProductStoreByCode, pickPreferredBoundStore, resolveProductApiStoreCode } from '../workspaceHelpers';
import {
  buildAuthorizedStoreOptions,
  resolvePreferredInitializationStoreCode,
  resolveSelectedInitializationStoreCode,
  toInitializationStoreOption,
  toProductStoreOption
} from '../utils/storeInitialization';
import type { StoreSyncOverviewState } from '../workspaceContracts';
import type { ProductListDatasetState, StoreInitializationPayload, StoreInitializationState } from '../types';
type UseProductStoreInitializationParams = {
  activeOwnerId?: number;
  enableProductBootDataset: boolean;
  enableProductBootInitStatus: boolean;
  enableProductBootStoreSelection: boolean;
  lastInitializationStoreCodeRef: MutableRefObject<string | undefined>;
  loadProductListDataset: (storeCode: string, ownerUserId?: number) => Promise<void>;
  selectedInitializationStoreCodeOverride?: string;
  session: AuthSession | null;
  setProductListDatasetState: Dispatch<SetStateAction<ProductListDatasetState>>;
  setSelectedInitializationStoreCodeOverride: Dispatch<SetStateAction<string | undefined>>;
  setSelectedProductRowKeys: Dispatch<SetStateAction<string[]>>;
  setStoreInitializationState: Dispatch<SetStateAction<StoreInitializationState>>;
  setStoreInitializationSubmitting: Dispatch<SetStateAction<boolean>>;
  storeInitializationState: StoreInitializationState;
  storeSyncOwnerId?: number;
  storeSyncState: StoreSyncOverviewState;
};

export function useProductStoreInitialization({
  activeOwnerId,
  enableProductBootDataset,
  enableProductBootInitStatus,
  enableProductBootStoreSelection,
  lastInitializationStoreCodeRef,
  loadProductListDataset,
  selectedInitializationStoreCodeOverride,
  session,
  setProductListDatasetState,
  setSelectedInitializationStoreCodeOverride,
  setSelectedProductRowKeys,
  setStoreInitializationState,
  setStoreInitializationSubmitting,
  storeInitializationState,
  storeSyncOwnerId,
  storeSyncState
}: UseProductStoreInitializationParams) {
  const storeInitializationRequestSeqRef = useRef(0);

  useEffect(() => {
    if (!session?.currentStore?.storeCode) {
      return;
    }
    setSelectedInitializationStoreCodeOverride((currentValue) => currentValue || session.currentStore?.storeCode);
  }, [session?.currentStore?.storeCode, setSelectedInitializationStoreCodeOverride]);

  const loadStoreInitializationStatus = useCallback(
    async (storeCode: string, ownerUserId?: number) => {
      const effectiveOwnerUserId = ownerUserId ?? storeSyncOwnerId ?? session?.defaultOwnerUserId;
      if (!effectiveOwnerUserId || !storeCode) {
        storeInitializationRequestSeqRef.current += 1;
        setStoreInitializationState({ status: 'idle' });
        return;
      }

      const requestSeq = (storeInitializationRequestSeqRef.current += 1);
      const isLatestRequest = () => storeInitializationRequestSeqRef.current === requestSeq;
      setStoreInitializationState({ status: 'loading' });
      try {
        const payload = await fetchStoreInitializationStatus({
          ownerUserId: effectiveOwnerUserId,
          storeCode
        });
        if (!isLatestRequest()) {
          return;
        }
        setStoreInitializationState({ status: 'success', data: payload });
      } catch (error) {
        if (!isLatestRequest()) {
          return;
        }
        const errorMessage = error instanceof Error ? error.message : '店铺初始化状态暂时不可用';
        if (
          errorMessage.includes('当前店铺不在选中的老板名下') ||
          errorMessage.includes('当前店铺还没有完成绑定')
        ) {
          const fallbackStore =
            storeSyncState.status === 'success' ? pickPreferredBoundStore(storeSyncState.data.stores) : null;
          const fallbackStoreCode = resolveProductApiStoreCode(fallbackStore, session?.currentStore?.storeCode);

          if (fallbackStoreCode && fallbackStoreCode !== storeCode) {
            setSelectedInitializationStoreCodeOverride(fallbackStoreCode);
            setSelectedProductRowKeys([]);
            setStoreInitializationState({ status: 'idle' });
            return;
          }
        }
        setStoreInitializationState({ status: 'error', message: errorMessage });
      }
    },
    [
      session,
      setSelectedInitializationStoreCodeOverride,
      setSelectedProductRowKeys,
      setStoreInitializationState,
      storeSyncOwnerId,
      storeSyncState
    ]
  );

  const preferredInitializationStoreCode = useMemo(
    () => resolvePreferredInitializationStoreCode(storeSyncState, session?.currentStore?.storeCode),
    [session?.currentStore?.storeCode, storeSyncState]
  );

  const selectedInitializationStoreCode = useMemo(
    () =>
      resolveSelectedInitializationStoreCode({
        currentStoreCode: session?.currentStore?.storeCode,
        enableStoreSelection: enableProductBootStoreSelection,
        preferredStoreCode: preferredInitializationStoreCode,
        selectedStoreCodeOverride: selectedInitializationStoreCodeOverride,
        storeSyncState
      }),
    [
      enableProductBootStoreSelection,
      preferredInitializationStoreCode,
      selectedInitializationStoreCodeOverride,
      session?.currentStore?.storeCode,
      storeSyncState
    ]
  );

  useEffect(() => {
    if (!enableProductBootStoreSelection || storeSyncState.status !== 'success' || !selectedInitializationStoreCodeOverride) {
      return;
    }
    if (findProductStoreByCode(storeSyncState.data.stores, selectedInitializationStoreCodeOverride)) {
      return;
    }

    setSelectedInitializationStoreCodeOverride(preferredInitializationStoreCode);
    setSelectedProductRowKeys([]);
  }, [
    enableProductBootStoreSelection,
    preferredInitializationStoreCode,
    selectedInitializationStoreCodeOverride,
    setSelectedInitializationStoreCodeOverride,
    setSelectedProductRowKeys,
    storeSyncState
  ]);

  useEffect(() => {
    if (lastInitializationStoreCodeRef.current === selectedInitializationStoreCode) {
      return;
    }

    lastInitializationStoreCodeRef.current = selectedInitializationStoreCode;
    storeInitializationRequestSeqRef.current += 1;
    setSelectedProductRowKeys([]);
    setStoreInitializationState({ status: 'idle' });
    setProductListDatasetState({ status: 'idle' });
  }, [lastInitializationStoreCodeRef, selectedInitializationStoreCode, setProductListDatasetState, setSelectedProductRowKeys, setStoreInitializationState]);

  useEffect(() => {
    if (!enableProductBootInitStatus) {
      return;
    }
    const effectiveOwnerId =
      storeSyncState.status === 'success'
        ? storeSyncOwnerId ?? storeSyncState.data.selectedOwnerId
        : storeSyncOwnerId ?? session?.defaultOwnerUserId;

    if (!session || !selectedInitializationStoreCode || !effectiveOwnerId) {
      return;
    }
    void loadStoreInitializationStatus(selectedInitializationStoreCode, effectiveOwnerId);
  }, [enableProductBootInitStatus, loadStoreInitializationStatus, selectedInitializationStoreCode, session, storeSyncOwnerId, storeSyncState]);

  useEffect(() => {
    if (!enableProductBootInitStatus) {
      return;
    }
    const effectiveOwnerId =
      storeSyncState.status === 'success'
        ? storeSyncOwnerId ?? storeSyncState.data.selectedOwnerId
        : storeSyncOwnerId ?? session?.defaultOwnerUserId;

    if (storeInitializationState.status !== 'success') {
      return;
    }
    if (storeInitializationState.data.status !== 'RUNNING') {
      return;
    }
    if (!selectedInitializationStoreCode || !effectiveOwnerId) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadStoreInitializationStatus(selectedInitializationStoreCode, effectiveOwnerId);
    }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [enableProductBootInitStatus, loadStoreInitializationStatus, selectedInitializationStoreCode, session, storeInitializationState, storeSyncOwnerId, storeSyncState]);

  const productStoreOptions = buildAuthorizedStoreOptions(
    storeSyncState,
    session?.currentStore?.storeCode,
    toProductStoreOption
  );

  const initializationStoreOptions = buildAuthorizedStoreOptions(
    storeSyncState,
    session?.currentStore?.storeCode,
    toInitializationStoreOption
  );

  const selectedInitializationStore =
    storeSyncState.status === 'success'
      ? findProductStoreByCode(storeSyncState.data.stores, selectedInitializationStoreCode)
      : null;

  const startStoreInitialization = useCallback(
    async (storeCode: string | undefined, options?: { silent?: boolean }) => {
      if (!activeOwnerId || !storeCode) {
        return;
      }

      try {
        setStoreInitializationSubmitting(true);
        const payload = await startStoreInitializationRequest({
          ownerUserId: activeOwnerId,
          storeCode
        });
        setStoreInitializationState({ status: 'success', data: payload });
        void loadProductListDataset(storeCode, activeOwnerId);
        if (!options?.silent) {
          message.success('正在后台准备当前店铺的商品列表。');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '启动店铺初始化失败';
        setStoreInitializationState({ status: 'error', message: errorMessage });
        message.error(errorMessage);
      } finally {
        setStoreInitializationSubmitting(false);
      }
    },
    [activeOwnerId, loadProductListDataset, setStoreInitializationState, setStoreInitializationSubmitting]
  );

  const refreshProductWorkspaceSurface = useCallback(() => {
    if (!selectedInitializationStoreCode || !activeOwnerId) {
      return;
    }
    void loadProductListDataset(selectedInitializationStoreCode, activeOwnerId);
    void loadStoreInitializationStatus(selectedInitializationStoreCode, activeOwnerId);
  }, [activeOwnerId, loadProductListDataset, loadStoreInitializationStatus, selectedInitializationStoreCode]);

  useEffect(() => {
    if (!enableProductBootDataset) {
      return;
    }
    if (!selectedInitializationStoreCode || !activeOwnerId) {
      setProductListDatasetState({ status: 'idle' });
      return;
    }
    void loadProductListDataset(selectedInitializationStoreCode, activeOwnerId);
  }, [activeOwnerId, enableProductBootDataset, loadProductListDataset, selectedInitializationStoreCode, setProductListDatasetState]);

  useEffect(() => {
    if (!enableProductBootDataset) {
      return;
    }
    if (!selectedInitializationStoreCode || !activeOwnerId) {
      return;
    }
    if (storeInitializationState.status !== 'success') {
      return;
    }
    void loadProductListDataset(selectedInitializationStoreCode, activeOwnerId);
  }, [activeOwnerId, enableProductBootDataset, loadProductListDataset, selectedInitializationStoreCode, storeInitializationState]);

  return {
    loadStoreInitializationStatus,
    preferredInitializationStoreCode,
    selectedInitializationStoreCode,
    productStoreOptions,
    initializationStoreOptions,
    selectedInitializationStore,
    startStoreInitialization,
    refreshProductWorkspaceSurface
  };
}
