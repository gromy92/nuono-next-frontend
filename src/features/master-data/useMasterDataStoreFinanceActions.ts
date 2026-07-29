import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react';
import { Form } from 'antd';
import { firstFormValidationMessage, normalizeError } from '../../shared/api';
import { isAllStoresRole } from './display';
import {
  buildStoreTransferGroupsFromLinks,
  expandStoreGroupKeys as expandStoreTransferGroupKeys,
  mergeStoreTransferGroup,
  toTransferData,
  type StoreTransferGroup
} from './storeTransfer';
import {
  addMasterDataPayment,
  assignMasterDataStores,
  fetchMasterDataPayments,
  fetchMasterDataUserDetail,
  updateMasterDataQuota,
  updateMasterDataStoreQuota
} from './api';
import type {
  MasterDataAddPaymentPayload,
  MasterDataAssignStoresPayload,
  MasterDataMessageApi,
  MasterDataPaymentRecord,
  MasterDataPaymentFormValues,
  MasterDataQuotaFormValues,
  MasterDataUpdateQuotaPayload,
  MasterDataUser,
  MasterDataUserDetail,
  MasterDataUserDetailState
} from './types';

type MasterDataStoreLink = MasterDataUserDetail['storeLinks'][number];

type Options = {
  operatorUserId?: number;
  groupedOperatorStores: StoreTransferGroup[];
  loadBoard: () => Promise<void>;
  detailState: MasterDataUserDetailState;
  setDetailState: Dispatch<SetStateAction<MasterDataUserDetailState>>;
  onDataChanged?: () => void;
  expandedMerchantId: number | null;
  setExpandedMerchantDetail: Dispatch<SetStateAction<MasterDataUserDetail | null>>;
  messageApi: MasterDataMessageApi;
};

export function useMasterDataStoreFinanceActions({
  operatorUserId, groupedOperatorStores,
  loadBoard, detailState, setDetailState, onDataChanged,
  expandedMerchantId, setExpandedMerchantDetail, messageApi
}: Options) {
  const [storeAssignmentOpen, setStoreAssignmentOpen] = useState(false);
  const [storeAssignmentLoading, setStoreAssignmentLoading] = useState(false);
  const [storeAssignmentSubmitting, setStoreAssignmentSubmitting] = useState(false);
  const [storeAssignmentUser, setStoreAssignmentUser] = useState<MasterDataUser | null>(null);
  const [storeAssignmentGroupKeys, setStoreAssignmentGroupKeys] = useState<string[]>([]);
  const [storeAssignmentCurrentGroups, setStoreAssignmentCurrentGroups] = useState<StoreTransferGroup[]>([]);
  const [storeAssignmentError, setStoreAssignmentError] = useState<string | null>(null);
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);
  const [quotaSubmitting, setQuotaSubmitting] = useState(false);
  const [quotaTargetUser, setQuotaTargetUser] = useState<MasterDataUser | null>(null);
  const [quotaTargetStore, setQuotaTargetStore] = useState<MasterDataStoreLink | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalLoading, setPaymentModalLoading] = useState(false);
  const [paymentTargetUser, setPaymentTargetUser] = useState<MasterDataUser | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<MasterDataPaymentRecord[]>([]);
  const [paymentAddModalOpen, setPaymentAddModalOpen] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [quotaForm] = Form.useForm<MasterDataQuotaFormValues>();
  const [paymentForm] = Form.useForm<MasterDataPaymentFormValues>();

  const storeAssignmentTransferGroups = useMemo(() => {
    const map = new Map<string, StoreTransferGroup>();
    groupedOperatorStores.forEach((group) => mergeStoreTransferGroup(map, group));
    storeAssignmentCurrentGroups.forEach((group) => mergeStoreTransferGroup(map, group));
    return Array.from(map.values()).sort((left, right) => left.label.localeCompare(right.label, 'zh-CN'));
  }, [groupedOperatorStores, storeAssignmentCurrentGroups]);
  const storeAssignmentTransferData = useMemo(
    () => toTransferData(storeAssignmentTransferGroups),
    [storeAssignmentTransferGroups]
  );
  const allOperatorStoreGroupKeys = useMemo(
    () => groupedOperatorStores.map((group) => group.key),
    [groupedOperatorStores]
  );
  const expandStoreAssignmentGroupKeys = useCallback(
    (groupKeys: string[] = []) => expandStoreTransferGroupKeys(storeAssignmentTransferGroups, groupKeys),
    [storeAssignmentTransferGroups]
  );

  const openStoreAssignment = useCallback(
    async (user: MasterDataUser) => {
      setStoreAssignmentOpen(true);
      setStoreAssignmentUser(user);
      setStoreAssignmentCurrentGroups([]);
      setStoreAssignmentGroupKeys([]);
      setStoreAssignmentError(null);
      setStoreAssignmentLoading(true);
      try {
        const detail = await fetchMasterDataUserDetail(user.id);
        const currentGroups = buildStoreTransferGroupsFromLinks(detail.storeLinks);
        setStoreAssignmentCurrentGroups(currentGroups);
        if (isAllStoresRole(user)) {
          setStoreAssignmentGroupKeys(currentGroups.length ? currentGroups.map((group) => group.key) : allOperatorStoreGroupKeys);
          return;
        }
        setStoreAssignmentGroupKeys(currentGroups.map((group) => group.key));
      } catch (error) {
        messageApi.error(normalizeError(error, '读取用户店铺分配失败'));
      } finally {
        setStoreAssignmentLoading(false);
      }
    },
    [allOperatorStoreGroupKeys]
  );

  const submitStoreAssignment = useCallback(async () => {
    if (!storeAssignmentUser) {
      return;
    }
    setStoreAssignmentSubmitting(true);
    try {
      setStoreAssignmentError(null);
      const payload: MasterDataAssignStoresPayload = {
        operatorUserId,
        storeCodes: expandStoreAssignmentGroupKeys(storeAssignmentGroupKeys)
      };
      const result = await assignMasterDataStores(storeAssignmentUser.id, payload);
      messageApi.success(result.message || '负责店铺已更新');
      setStoreAssignmentOpen(false);
      setStoreAssignmentCurrentGroups([]);
      await loadBoard();
      if (detailState.status === 'success' && detailState.data.id === storeAssignmentUser.id) {
        const nextDetail = await fetchMasterDataUserDetail(storeAssignmentUser.id);
        setDetailState({ status: 'success', data: nextDetail });
      }
      onDataChanged?.();
    } catch (error) {
      const errorMessage = normalizeError(error, '分配店铺失败');
      setStoreAssignmentError(errorMessage);
      messageApi.error(errorMessage);
    } finally {
      setStoreAssignmentSubmitting(false);
    }
  }, [detailState, expandStoreAssignmentGroupKeys, loadBoard, onDataChanged, operatorUserId, storeAssignmentGroupKeys, storeAssignmentUser]);

  const openQuotaModal = useCallback((
    user: MasterDataUser,
    detail?: MasterDataUserDetail,
    store?: MasterDataStoreLink
  ) => {
    setQuotaTargetUser(user);
    setQuotaTargetStore(store ?? null);
    quotaForm.resetFields();
    const quotaSource = store ?? detail ?? user;
    quotaForm.setFieldsValue({
      listLimit: quotaSource.listLimit ?? 0,
      collectLimit: quotaSource.collectLimit ?? 0,
      whApLimit: quotaSource.whApLimit ?? 0,
      chatgptTranslateLimit: quotaSource.chatgptTranslateLimit ?? 0
    });
    setQuotaModalOpen(true);
  }, [quotaForm]);

  const submitQuota = useCallback(async () => {
    if (!quotaTargetUser) {
      return;
    }
    try {
      const values = await quotaForm.validateFields();
      setQuotaSubmitting(true);
      const payload: MasterDataUpdateQuotaPayload = {
        ...values,
        operatorUserId
      };
      const result = quotaTargetStore
        ? await updateMasterDataStoreQuota(quotaTargetUser.id, quotaTargetStore.id, payload)
        : await updateMasterDataQuota(quotaTargetUser.id, payload);
      messageApi.success(result.message || '额度已更新');
      setQuotaModalOpen(false);
      setQuotaTargetStore(null);
      await loadBoard();
      if (detailState.status === 'success' && detailState.data.id === quotaTargetUser.id) {
        const nextDetail = await fetchMasterDataUserDetail(quotaTargetUser.id);
        setDetailState({ status: 'success', data: nextDetail });
      }
      if (expandedMerchantId === quotaTargetUser.id) {
        const nextDetail = await fetchMasterDataUserDetail(quotaTargetUser.id);
        setExpandedMerchantDetail(nextDetail);
      }
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error);
      if (validationMessage) {
        messageApi.warning(validationMessage);
        return;
      }
      messageApi.error(normalizeError(error, '更新额度失败'));
    } finally {
      setQuotaSubmitting(false);
    }
  }, [detailState, expandedMerchantId, loadBoard, operatorUserId, quotaForm, quotaTargetStore, quotaTargetUser]);

  const openPaymentModal = useCallback(async (user: MasterDataUser) => {
    setPaymentTargetUser(user);
    setPaymentModalOpen(true);
    setPaymentModalLoading(true);
    try {
      const payload = await fetchMasterDataPayments(user.id);
      setPaymentRecords(payload);
    } catch (error) {
      setPaymentRecords([]);
      messageApi.error(normalizeError(error, '读取费用记录失败'));
    } finally {
      setPaymentModalLoading(false);
    }
  }, []);

  const submitPayment = useCallback(async () => {
    if (!paymentTargetUser) {
      return;
    }
    try {
      const values = await paymentForm.validateFields();
      setPaymentSubmitting(true);
      const payload: MasterDataAddPaymentPayload = {
        amount: values.amount,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        remark: values.remark,
        operatorUserId
      };
      const result = await addMasterDataPayment(paymentTargetUser.id, payload);
      messageApi.success(result.message || '费用记录已添加');
      setPaymentAddModalOpen(false);
      paymentForm.resetFields();
      const nextRecords = await fetchMasterDataPayments(paymentTargetUser.id);
      setPaymentRecords(nextRecords);
    } catch (error) {
      const validationMessage = firstFormValidationMessage(error);
      if (validationMessage) {
        messageApi.warning(validationMessage);
        return;
      }
      messageApi.error(normalizeError(error, '添加费用记录失败'));
    } finally {
      setPaymentSubmitting(false);
    }
  }, [operatorUserId, paymentForm, paymentTargetUser]);

  return {
    storeAssignmentOpen, setStoreAssignmentOpen, storeAssignmentLoading,
    storeAssignmentSubmitting, storeAssignmentUser, storeAssignmentGroupKeys,
    setStoreAssignmentGroupKeys, storeAssignmentCurrentGroups,
    setStoreAssignmentCurrentGroups, storeAssignmentError, setStoreAssignmentError,
    storeAssignmentTransferData, allOperatorStoreGroupKeys,
    openStoreAssignment, submitStoreAssignment,
    quotaModalOpen, setQuotaModalOpen, quotaSubmitting, quotaTargetUser,
    quotaTargetStore, setQuotaTargetStore, quotaForm, openQuotaModal, submitQuota,
    paymentModalOpen, setPaymentModalOpen, paymentModalLoading, paymentTargetUser,
    paymentRecords, setPaymentRecords, paymentAddModalOpen, setPaymentAddModalOpen,
    paymentSubmitting, paymentForm, openPaymentModal, submitPayment
  };
}
