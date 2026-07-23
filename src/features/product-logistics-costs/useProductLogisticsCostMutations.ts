import { Form, message } from 'antd';
import { useState } from 'react';
import { firstFormValidationMessage } from '../../shared/api';
import {
  saveBatchCategoryAssignment,
  saveManualCurrentQuote,
  saveRouteRateCard
} from './productLogisticsCostApi';
import type {
  ManualQuoteFormValues,
  ProductCostTableRow,
  RateCardFormValues
} from './productLogisticsCostModels';
import { ALL_CATEGORY_FILTER, FORWARDER_OPTIONS } from './productLogisticsCostModels';
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
  const [manualQuoteRow, setManualQuoteRow] = useState<ProductCostTableRow>();
  const [rateCardModalOpen, setRateCardModalOpen] = useState(false);
  const [batchCategoryModalOpen, setBatchCategoryModalOpen] = useState(false);
  const [batchCategoryCode, setBatchCategoryCode] = useState<string>();
  const [manualQuoteForm] = Form.useForm<ManualQuoteFormValues>();
  const [rateCardForm] = Form.useForm<RateCardFormValues>();

  const routePayload = {
    siteCode: data.appliedFilters.siteCode,
    forwarderCode: data.appliedFilters.forwarderCode,
    forwarderName: optionLabel(FORWARDER_OPTIONS, data.appliedFilters.forwarderCode),
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
    manualQuoteForm.setFieldsValue({
      cargoCategoryCode: code || undefined,
      unitCostCny: sourceRow?.unitCostCny ?? rateCard?.unitCostCny ?? undefined,
      chargeUnit: sourceRow?.chargeUnit || rateCard?.chargeUnit || defaultUnit,
      remark: ''
    });
  };

  const closeManualQuoteModal = () => {
    setManualQuoteRow(undefined);
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
      const values = await manualQuoteForm.validateFields();
      setSavingManualQuote(true);
      await saveManualCurrentQuote({
        storeCode: data.storeCode,
        partnerSku: manualQuoteRow.partnerSku,
        ...routePayload,
        cargoCategoryCode: values.cargoCategoryCode,
        cargoCategoryName: categoryName(values.cargoCategoryCode),
        chargeUnit: values.chargeUnit,
        unitCostCny: values.unitCostCny,
        remark: values.remark?.trim()
      });
      message.success('当前报价已保存');
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
    } catch (error) {
      message.error(firstFormValidationMessage(error) || (error instanceof Error ? error.message : '保存线路类别报价失败'));
    } finally {
      setSavingRateCard(false);
    }
  };

  return {
    savingManualQuote, savingBatchCategory, savingRateCard, manualQuoteRow,
    rateCardModalOpen, batchCategoryModalOpen, batchCategoryCode, setBatchCategoryCode,
    manualQuoteForm, rateCardForm, openManualQuoteModal, closeManualQuoteModal,
    openBatchCategoryModal, closeBatchCategoryModal, openRateCardModal, closeRateCardModal,
    fillRateCardFormForCategory, handleManualQuoteCategoryChange, submitManualQuote,
    submitBatchCategoryAssignment, submitRateCard
  };
}

export type ProductLogisticsCostMutations = ReturnType<typeof useProductLogisticsCostMutations>;
