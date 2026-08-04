import { Form, message } from 'antd';
import { useRef, useState } from 'react';
import { firstFormValidationMessage } from '../../shared/api';
import {
  fetchCurrentEligibility,
  saveBatchCategoryAssignment,
  saveManualCurrentQuoteWithEligibility,
  saveRouteRateCard
} from './productLogisticsCostApi';
import type {
  ManualQuoteFormValues,
  ProductCostTableRow,
  RateCardFormValues
} from './productLogisticsCostModels';
import { ALL_CATEGORY_FILTER } from './productLogisticsCostModels';
import {
  categoryNameForValue,
  normalizeCategoryFilterValue,
  optionLabel
} from './productLogisticsCostRouteDomain';
import type { ProductLogisticsCostData } from './useProductLogisticsCostData';

export function useProductLogisticsCostMutations(data: ProductLogisticsCostData) {
  const [savingManualQuote, setSavingManualQuote] = useState(false);
  const [savingBatchCategory, setSavingBatchCategory] = useState(false);
  const [savingRateCard, setSavingRateCard] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string>();
  const [manualQuoteRow, setManualQuoteRow] = useState<ProductCostTableRow>();
  const [rateCardListModalOpen, setRateCardListModalOpen] = useState(false);
  const [rateCardModalOpen, setRateCardModalOpen] = useState(false);
  const [batchCategoryModalOpen, setBatchCategoryModalOpen] = useState(false);
  const [batchCategoryCode, setBatchCategoryCode] = useState<string>();
  const [manualQuoteForm] = Form.useForm<ManualQuoteFormValues>();
  const [rateCardForm] = Form.useForm<RateCardFormValues>();
  const eligibilityRequestId = useRef(0);

  const routePayload = {
    siteCode: data.appliedFilters.siteCode,
    forwarderCode: data.appliedFilters.forwarderCode,
    forwarderName: optionLabel(data.forwarderOptions, data.appliedFilters.forwarderCode),
    transportMode: data.appliedFilters.transportMode
  };
  const categoryName = (code?: string) => categoryNameForValue(data.activeCategoryOptions, code) || code;

  const openManualQuoteModal = (row: ProductCostTableRow) => {
    const sourceRow = row.currentCost || row.historyCosts[0];
    const defaultUnit = data.appliedFilters.transportMode === 'AIR' ? 'KG' : 'CBM';
    const filterCategory = data.appliedFilters.cargoCategoryCode !== ALL_CATEGORY_FILTER
      ? data.appliedFilters.cargoCategoryCode
      : undefined;
    const code = normalizeCategoryFilterValue(sourceRow?.cargoCategoryCode || filterCategory);
    const rateCard = code ? data.rateCardMap.get(code) : undefined;
    setManualQuoteRow(row);
    setEligibilityError(undefined);
    setEligibilityLoading(true);
    manualQuoteForm.setFieldsValue({
      eligibilityStatus: undefined,
      cargoCategoryCode: code || undefined,
      unitCostCny: sourceRow?.unitCostCny ?? rateCard?.unitCostCny ?? undefined,
      chargeUnit: sourceRow?.chargeUnit || rateCard?.chargeUnit || defaultUnit,
      remark: ''
    });
    const requestId = ++eligibilityRequestId.current;
    void fetchCurrentEligibility({
      storeCode: data.storeCode,
      partnerSku: row.partnerSku,
      siteCode: data.appliedFilters.siteCode,
      forwarderCode: data.appliedFilters.forwarderCode,
      transportMode: data.appliedFilters.transportMode
    }).then((view) => {
      if (requestId !== eligibilityRequestId.current) return;
      manualQuoteForm.setFieldValue('eligibilityStatus', view.eligibilityStatus);
    }).catch((error) => {
      if (requestId !== eligibilityRequestId.current) return;
      setEligibilityError(error instanceof Error ? error.message : '读取货代承接状态失败');
    }).finally(() => {
      if (requestId === eligibilityRequestId.current) setEligibilityLoading(false);
    });
  };

  const closeManualQuoteModal = () => {
    eligibilityRequestId.current += 1;
    setManualQuoteRow(undefined);
    setEligibilityLoading(false);
    setEligibilityError(undefined);
    manualQuoteForm.resetFields();
  };

  const openBatchCategoryModal = () => {
    setBatchCategoryCode(undefined);
    setBatchCategoryModalOpen(true);
  };

  const closeBatchCategoryModal = () => {
    if (savingBatchCategory) return;
    setBatchCategoryModalOpen(false);
    setBatchCategoryCode(undefined);
  };

  const fillRateCardFormForCategory = (cargoCategoryCode?: string) => {
    const code = normalizeCategoryFilterValue(cargoCategoryCode);
    const rateCard = code ? data.rateCardMap.get(code) : undefined;
    rateCardForm.setFieldsValue({
      cargoCategoryCode: code || undefined,
      unitCostCny: rateCard?.unitCostCny ?? undefined,
      chargeUnit: rateCard?.chargeUnit || (data.appliedFilters.transportMode === 'AIR' ? 'KG' : 'CBM'),
      sourceReference: rateCard?.sourceReference || undefined
    });
  };

  const openRateCardModal = () => {
    const code = data.filters.cargoCategoryCode !== ALL_CATEGORY_FILTER
      ? data.filters.cargoCategoryCode
      : data.activeCategoryOptions[0]?.value;
    fillRateCardFormForCategory(code);
    setRateCardModalOpen(true);
  };

  const openRateCardListModal = () => setRateCardListModalOpen(true);
  const closeRateCardListModal = () => setRateCardListModalOpen(false);

  const closeRateCardModal = () => {
    setRateCardModalOpen(false);
    rateCardForm.resetFields();
  };

  const handleManualQuoteCategoryChange = (cargoCategoryCode: string) => {
    const code = normalizeCategoryFilterValue(cargoCategoryCode);
    const rateCard = code ? data.rateCardMap.get(code) : undefined;
    manualQuoteForm.setFieldsValue(rateCard ? {
      cargoCategoryCode: code,
      unitCostCny: rateCard.unitCostCny,
      chargeUnit: rateCard.chargeUnit || (data.appliedFilters.transportMode === 'AIR' ? 'KG' : 'CBM')
    } : { cargoCategoryCode: code || undefined });
  };

  const submitManualQuote = async () => {
    if (!manualQuoteRow) return;
    try {
      const status = manualQuoteForm.getFieldValue('eligibilityStatus');
      const values = status === 'UNSUPPORTED'
        ? await manualQuoteForm.validateFields(['eligibilityStatus'])
        : await manualQuoteForm.validateFields();
      setSavingManualQuote(true);
      const result = await saveManualCurrentQuoteWithEligibility({
        storeCode: data.storeCode,
        partnerSku: manualQuoteRow.partnerSku,
        ...routePayload,
        eligibilityStatus: values.eligibilityStatus,
        cargoCategoryCode: values.cargoCategoryCode,
        cargoCategoryName: categoryName(values.cargoCategoryCode),
        chargeUnit: values.chargeUnit,
        unitCostCny: values.unitCostCny,
        remark: values.remark?.trim()
      });
      message.success(result.eligibilityStatus === 'UNSUPPORTED'
        ? '已保存为该货代不接'
        : '当前报价和货代承接状态已保存');
      closeManualQuoteModal();
      await data.load(data.appliedFilters);
    } catch (error) {
      message.error(firstFormValidationMessage(error) || (error instanceof Error ? error.message : '保存当前报价失败'));
    } finally {
      setSavingManualQuote(false);
    }
  };

  const submitBatchCategoryAssignment = async () => {
    if (!batchCategoryCode) {
      message.warning('请选择类别');
      return;
    }
    if (!data.assignableSelectedRows.length) {
      message.warning('请选择商品');
      return;
    }
    setSavingBatchCategory(true);
    try {
      const name = categoryName(batchCategoryCode) || batchCategoryCode;
      const result = await saveBatchCategoryAssignment({
        storeCode: data.storeCode,
        ...routePayload,
        cargoCategoryCode: batchCategoryCode,
        cargoCategoryName: name,
        remark: `批量维护类别：${name}`,
        items: data.assignableSelectedRows.map((row) => ({ partnerSku: row.partnerSku }))
      });
      message.success(`已更新 ${result.updatedCount} 个商品${result.skippedCount ? `，跳过 ${result.skippedCount} 个` : ''}`);
      data.setSelectedRowKeys([]);
      setBatchCategoryCode(undefined);
      setBatchCategoryModalOpen(false);
      await data.load(data.appliedFilters);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '批量维护类别失败');
    } finally {
      setSavingBatchCategory(false);
    }
  };

  const syncSelectedProducts = async (values: RateCardFormValues, cargoCategoryName: string) => {
    if (!data.assignableSelectedRows.length) return undefined;
    return saveBatchCategoryAssignment({
      storeCode: data.storeCode,
      ...routePayload,
      cargoCategoryCode: values.cargoCategoryCode,
      cargoCategoryName,
      remark: `线路报价同步维护类别：${cargoCategoryName}`,
      items: data.assignableSelectedRows.map((row) => ({ partnerSku: row.partnerSku }))
    });
  };

  const submitRateCard = async () => {
    try {
      const values = await rateCardForm.validateFields();
      const name = categoryName(values.cargoCategoryCode) || values.cargoCategoryCode;
      setSavingRateCard(true);
      await saveRouteRateCard({
        ...routePayload,
        cargoCategoryCode: values.cargoCategoryCode,
        cargoCategoryName: name,
        chargeUnit: values.chargeUnit,
        unitCostCny: values.unitCostCny,
        sourceReference: values.sourceReference?.trim()
      });
      const result = await syncSelectedProducts(values, name);
      if (result) {
        message.success(`已保存线路报价，并更新 ${result.updatedCount} 个商品${result.skippedCount ? `，跳过 ${result.skippedCount} 个` : ''}`);
        data.setSelectedRowKeys([]);
      } else {
        message.success('线路类别报价已保存');
      }
      closeRateCardModal();
      await data.load(data.appliedFilters);
      setRateCardListModalOpen(true);
    } catch (error) {
      message.error(firstFormValidationMessage(error) || (error instanceof Error ? error.message : '保存线路类别报价失败'));
    } finally {
      setSavingRateCard(false);
    }
  };

  return {
    savingManualQuote, savingBatchCategory, savingRateCard, eligibilityLoading, eligibilityError, manualQuoteRow,
    rateCardListModalOpen, rateCardModalOpen, batchCategoryModalOpen, batchCategoryCode, setBatchCategoryCode,
    manualQuoteForm, rateCardForm, openManualQuoteModal, closeManualQuoteModal,
    openBatchCategoryModal, closeBatchCategoryModal, openRateCardListModal, closeRateCardListModal,
    openRateCardModal, closeRateCardModal,
    fillRateCardFormForCategory, handleManualQuoteCategoryChange, submitManualQuote,
    submitBatchCategoryAssignment, submitRateCard
  };
}

export type ProductLogisticsCostMutations = ReturnType<typeof useProductLogisticsCostMutations>;
