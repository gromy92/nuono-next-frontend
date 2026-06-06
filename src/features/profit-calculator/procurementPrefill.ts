import {
  isFiniteNumber,
  midpointPrice,
  normalizeProfitSite,
  PROFIT_FORM_DEFAULTS,
  type ProfitDetailSeedPayload,
  type ProfitFormValues
} from './domain';
import { procurementCandidateDisplayTitle, procurementDemandDisplayTitle, parseProcurementNumberRange } from '../procurement/domain';
import type { ProcurementCandidate, ProcurementDemandItem } from '../procurement/types';

export function buildProfitFormPrefillValues(
  demandItem: ProcurementDemandItem | undefined,
  candidate: ProcurementCandidate | undefined,
  detailSeed: ProfitDetailSeedPayload | undefined,
  currentValues: Partial<ProfitFormValues>
) {
  const candidatePriceRange = parseProcurementNumberRange(candidate?.standardizedPriceText || candidate?.priceText);
  const nextSalePrice = midpointPrice(demandItem?.targetPriceMin, demandItem?.targetPriceMax);
  const nextPurchasePrice = midpointPrice(candidatePriceRange.min, candidatePriceRange.max);
  const currentTitle = currentValues.title;
  const fallbackTitle = demandItem
    ? candidate
      ? `${procurementDemandDisplayTitle(demandItem)} / ${procurementCandidateDisplayTitle(candidate)}`
      : procurementDemandDisplayTitle(demandItem)
    : currentTitle;

  if (!detailSeed) {
    return {
      ...PROFIT_FORM_DEFAULTS,
      ...currentValues,
      title: fallbackTitle,
      site:
        demandItem?.targetSite?.toUpperCase() === 'AE'
          ? 'AE'
          : demandItem?.targetSite?.toUpperCase() === 'SA'
            ? 'SA'
            : currentValues.site || PROFIT_FORM_DEFAULTS.site,
      salePrice: nextSalePrice ?? currentValues.salePrice ?? PROFIT_FORM_DEFAULTS.salePrice,
      purchasePrice: nextPurchasePrice ?? currentValues.purchasePrice ?? PROFIT_FORM_DEFAULTS.purchasePrice
    } satisfies Partial<ProfitFormValues>;
  }

  const nextValues: Partial<ProfitFormValues> = {
    ...PROFIT_FORM_DEFAULTS,
    ...currentValues,
    title: detailSeed.title ?? fallbackTitle,
    site: normalizeProfitSite(detailSeed.site ?? demandItem?.targetSite ?? currentValues.site),
    salePrice: isFiniteNumber(detailSeed.salePrice) ? detailSeed.salePrice : undefined,
    purchasePrice: isFiniteNumber(detailSeed.purchasePrice) ? detailSeed.purchasePrice : undefined,
    lengthCm: isFiniteNumber(detailSeed.lengthCm) ? detailSeed.lengthCm : undefined,
    widthCm: isFiniteNumber(detailSeed.widthCm) ? detailSeed.widthCm : undefined,
    heightCm: isFiniteNumber(detailSeed.heightCm) ? detailSeed.heightCm : undefined,
    weightGrams: isFiniteNumber(detailSeed.weightGrams) ? detailSeed.weightGrams : undefined,
    vatRate: isFiniteNumber(detailSeed.vatRate) ? detailSeed.vatRate : PROFIT_FORM_DEFAULTS.vatRate,
    exchangeRate: isFiniteNumber(detailSeed.exchangeRate) ? detailSeed.exchangeRate : PROFIT_FORM_DEFAULTS.exchangeRate,
    domesticShippingFee: isFiniteNumber(detailSeed.domesticShippingFee)
      ? detailSeed.domesticShippingFee
      : PROFIT_FORM_DEFAULTS.domesticShippingFee,
    warehouseDeliveryUnitPrice: isFiniteNumber(detailSeed.warehouseDeliveryUnitPrice)
      ? detailSeed.warehouseDeliveryUnitPrice
      : PROFIT_FORM_DEFAULTS.warehouseDeliveryUnitPrice,
    airFreightUnitPrice: isFiniteNumber(detailSeed.airFreightUnitPrice)
      ? detailSeed.airFreightUnitPrice
      : PROFIT_FORM_DEFAULTS.airFreightUnitPrice,
    oceanFreightUnitPrice: isFiniteNumber(detailSeed.oceanFreightUnitPrice)
      ? detailSeed.oceanFreightUnitPrice
      : PROFIT_FORM_DEFAULTS.oceanFreightUnitPrice,
    airFreightDimFactor: isFiniteNumber(detailSeed.airFreightDimFactor)
      ? detailSeed.airFreightDimFactor
      : PROFIT_FORM_DEFAULTS.airFreightDimFactor,
    fbnCommissionRate: isFiniteNumber(detailSeed.fbnCommissionRate)
      ? detailSeed.fbnCommissionRate
      : PROFIT_FORM_DEFAULTS.fbnCommissionRate,
    fbpCommissionRate: isFiniteNumber(detailSeed.fbpCommissionRate)
      ? detailSeed.fbpCommissionRate
      : PROFIT_FORM_DEFAULTS.fbpCommissionRate,
    fbnOutboundFee: isFiniteNumber(detailSeed.fbnOutboundFee)
      ? detailSeed.fbnOutboundFee
      : PROFIT_FORM_DEFAULTS.fbnOutboundFee,
    manualFbnOutboundFeeOverride:
      typeof detailSeed.manualFbnOutboundFeeOverride === 'boolean'
        ? detailSeed.manualFbnOutboundFeeOverride
        : currentValues.manualFbnOutboundFeeOverride ?? PROFIT_FORM_DEFAULTS.manualFbnOutboundFeeOverride,
    fbpDirectShipFee: isFiniteNumber(detailSeed.fbpDirectShipFee)
      ? detailSeed.fbpDirectShipFee
      : PROFIT_FORM_DEFAULTS.fbpDirectShipFee,
    fulfillmentFee: isFiniteNumber(detailSeed.fulfillmentFee)
      ? detailSeed.fulfillmentFee
      : PROFIT_FORM_DEFAULTS.fulfillmentFee,
    ownerUserId: isFiniteNumber(detailSeed.ownerUserId) ? detailSeed.ownerUserId : currentValues.ownerUserId,
    storeCode: detailSeed.storeCode ?? currentValues.storeCode,
    skuId: detailSeed.skuId ?? currentValues.skuId
  };

  if (!isFiniteNumber(nextValues.salePrice)) {
    nextValues.salePrice = nextSalePrice;
  }
  if (!isFiniteNumber(nextValues.purchasePrice)) {
    nextValues.purchasePrice = nextPurchasePrice;
  }
  return nextValues;
}
