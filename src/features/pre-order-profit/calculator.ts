import type {
  PreOrderProfitCalculation,
  PreOrderProfitCategoryRule,
  PreOrderProfitInput,
  PreOrderProfitLogisticsRule,
  PreOrderProfitSiteCode,
  PreOrderProfitSiteConfig,
  PreOrderProfitStatus
} from './types';

export const DEFAULT_TARGET_MARGIN_PCT = 30;
export const DOMESTIC_LOGISTICS_RMB_PER_KG = 2;

export const PRE_ORDER_PROFIT_SITE_CONFIGS: Record<PreOrderProfitSiteCode, PreOrderProfitSiteConfig> = {
  SA: {
    site: 'SA',
    label: '沙特',
    currency: 'SAR',
    taxRate: 0.15,
    exchangeRateRmbPerCurrency: 1.8833
  },
  AE: {
    site: 'AE',
    label: '阿联酋',
    currency: 'AED',
    taxRate: 0.05,
    exchangeRateRmbPerCurrency: 1.95
  }
};

export function calculatePreOrderProfit(
  input: PreOrderProfitInput,
  categoryRule?: PreOrderProfitCategoryRule,
  logisticsRule?: PreOrderProfitLogisticsRule
): PreOrderProfitCalculation {
  const siteConfig = PRE_ORDER_PROFIT_SITE_CONFIGS[input.site];
  const missingFields = collectMissingFields(input, categoryRule, logisticsRule);
  const currency = siteConfig.currency;
  const taxMultiplier = 1 + siteConfig.taxRate;

  const volumeWeightKg = positive(input.lengthCm) && positive(input.widthCm) && positive(input.heightCm) && logisticsRule
    ? (input.lengthCm * input.widthCm * input.heightCm) / logisticsRule.volumeDivisorCm3PerKg
    : 0;
  const chargeableWeightKg = Math.max(input.actualWeightKg || 0, volumeWeightKg);
  const procurementCost = (input.purchasePriceRmb || 0) / siteConfig.exchangeRateRmbPerCurrency;
  const domesticLogisticsCost = ((input.actualWeightKg || 0) * DOMESTIC_LOGISTICS_RMB_PER_KG) / siteConfig.exchangeRateRmbPerCurrency;
  const firstLegLogisticsCost = logisticsRule
    ? (chargeableWeightKg * logisticsRule.unitPriceRmbPerKg) / siteConfig.exchangeRateRmbPerCurrency
    : 0;
  const commissionBase = categoryRule ? (input.salePrice || 0) * categoryRule.commissionRate : 0;
  const commissionTaxIncluded = commissionBase * taxMultiplier;
  const outboundBase = categoryRule?.outboundFee ?? 0;
  const outboundTaxIncluded = outboundBase * taxMultiplier;
  const fixedCost = procurementCost + domesticLogisticsCost + firstLegLogisticsCost + outboundTaxIncluded;
  const totalCost = fixedCost + commissionTaxIncluded;
  const estimatedProfit = (input.salePrice || 0) - totalCost;
  const estimatedMarginPct = positive(input.salePrice) ? (estimatedProfit / input.salePrice) * 100 : 0;
  const salePriceVariableRate = categoryRule ? categoryRule.commissionRate * taxMultiplier : 0;
  const breakEvenDenominator = 1 - salePriceVariableRate;
  const targetDenominator = 1 - salePriceVariableRate - ((input.targetMarginPct || 0) / 100);
  const breakEvenPrice = breakEvenDenominator > 0 && missingFields.length === 0 ? fixedCost / breakEvenDenominator : null;
  const targetMarginPrice = targetDenominator > 0 && missingFields.length === 0 ? fixedCost / targetDenominator : null;
  const status = resolveStatus(input, missingFields, targetDenominator);

  return {
    status,
    statusText: statusText(status),
    missingFields,
    currency,
    siteLabel: siteConfig.label,
    taxRatePct: round(siteConfig.taxRate * 100),
    exchangeRate: siteConfig.exchangeRateRmbPerCurrency,
    actualWeightKg: round(input.actualWeightKg || 0, 3),
    volumeWeightKg: round(volumeWeightKg, 3),
    chargeableWeightKg: round(chargeableWeightKg, 3),
    procurementCost: round(procurementCost),
    domesticLogisticsCost: round(domesticLogisticsCost),
    firstLegLogisticsCost: round(firstLegLogisticsCost),
    commissionBase: round(commissionBase),
    commissionTaxIncluded: round(commissionTaxIncluded),
    outboundBase: round(outboundBase),
    outboundTaxIncluded: round(outboundTaxIncluded),
    totalCost: round(totalCost),
    estimatedProfit: round(estimatedProfit),
    estimatedMarginPct: round(estimatedMarginPct),
    breakEvenPrice: breakEvenPrice == null ? null : round(breakEvenPrice),
    targetMarginPrice: targetMarginPrice == null ? null : round(targetMarginPrice),
    costLines: [
      {
        key: 'procurement',
        label: '采购成本',
        amount: round(procurementCost),
        source: 'manual',
        note: `采购单价 RMB / 汇率 ${siteConfig.exchangeRateRmbPerCurrency}`
      },
      {
        key: 'domestic-logistics',
        label: '国内物流费',
        amount: round(domesticLogisticsCost),
        source: 'fixed',
        note: `实际重量 kg * ${DOMESTIC_LOGISTICS_RMB_PER_KG} RMB/kg`
      },
      {
        key: 'first-leg',
        label: '头程物流成本',
        amount: round(firstLegLogisticsCost),
        source: 'rule',
        note: logisticsRule
          ? `${logisticsRule.label}：计费重 ${round(chargeableWeightKg, 3)} kg * ${logisticsRule.unitPriceRmbPerKg} RMB/kg`
          : '缺物流商规则'
      },
      {
        key: 'commission',
        label: '平台佣金含税',
        amount: round(commissionTaxIncluded),
        source: 'rule',
        note: categoryRule ? `佣金率 ${round(categoryRule.commissionRate * 100)}% * 含税 ${round(taxMultiplier, 2)}` : '缺类目佣金规则'
      },
      {
        key: 'outbound',
        label: '出舱/履约费含税',
        amount: round(outboundTaxIncluded),
        source: 'rule',
        note: categoryRule ? `基础费用 ${round(outboundBase)} ${currency} * 含税 ${round(taxMultiplier, 2)}` : '缺出舱/履约规则'
      }
    ]
  };
}

function collectMissingFields(
  input: PreOrderProfitInput,
  categoryRule?: PreOrderProfitCategoryRule,
  logisticsRule?: PreOrderProfitLogisticsRule
) {
  const missingFields: string[] = [];
  if (!input.purchaseUrl.trim()) missingFields.push('1688 采购链接');
  if (!positive(input.purchasePriceRmb)) missingFields.push('采购单价');
  if (!positive(input.lengthCm)) missingFields.push('长');
  if (!positive(input.widthCm)) missingFields.push('宽');
  if (!positive(input.heightCm)) missingFields.push('高');
  if (!positive(input.actualWeightKg)) missingFields.push('实际重量');
  if (!input.categoryId || !categoryRule) missingFields.push('类目佣金/出舱规则');
  if (!input.logisticsCarrierId || !logisticsRule) missingFields.push('物流商规则');
  if (!positive(input.salePrice)) missingFields.push('预估售价');
  return missingFields;
}

function resolveStatus(input: PreOrderProfitInput, missingFields: string[], targetDenominator: number): PreOrderProfitStatus {
  if (missingFields.some((field) => !['类目佣金/出舱规则', '物流商规则'].includes(field))) {
    return 'INCOMPLETE_INPUT';
  }
  if (missingFields.length) {
    return 'MISSING_RULE';
  }
  if (targetDenominator <= 0 || !positive(input.targetMarginPct)) {
    return 'INVALID_FORMULA';
  }
  return 'READY';
}

function statusText(status: PreOrderProfitStatus) {
  if (status === 'READY') return '可计算';
  if (status === 'MISSING_RULE') return '缺规则';
  if (status === 'INVALID_FORMULA') return '公式无效';
  return '缺输入';
}

function positive(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
