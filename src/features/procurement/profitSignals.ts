import { midpointPrice, normalizeProfitSite } from '../profit-calculator/domain';
import { procurementCandidateDisplayTitle, procurementDemandDisplayTitle, parseProcurementNumberRange } from './domain';
import type { ProcurementCandidate, ProcurementDemandItem } from './types';

export function collectProcurementProfitTexts(candidate?: ProcurementCandidate) {
  const texts = [
    candidate?.title,
    candidate?.standardizedPriceText,
    candidate?.priceText,
    candidate?.resultCardText,
    candidate?.detailHighlightText,
    candidate?.attributeSnapshotText,
    candidate?.shippingSnapshotText,
    candidate?.packageSnapshotText,
    candidate?.standardizedSizeText,
    candidate?.sizeText,
    candidate?.standardizedPackageText,
    candidate?.packageText,
    candidate?.standardizedDeliveryText,
    candidate?.deliveryTimelineText,
    candidate?.materialText,
    candidate?.powerModeText,
    ...(candidate?.reasons ?? []),
    ...(candidate?.warnings ?? []),
    ...(candidate?.badges ?? []),
    ...((candidate?.extractionEvidences ?? []).flatMap((item) => [item.fieldValue, item.evidenceText]))
  ];
  return texts.filter((item): item is string => Boolean(item && item.trim()));
}

export function parseProcurementDimensionsFromTexts(texts: string[]) {
  for (const text of texts) {
    const normalizedText = text.replace(/[×X*]/g, 'x');
    const matched = normalizedText.match(
      /(\d+(?:\.\d+)?)\s*(?:cm|厘米)?\s*x\s*(\d+(?:\.\d+)?)\s*(?:cm|厘米)?\s*x\s*(\d+(?:\.\d+)?)\s*(?:cm|厘米)?/i
    );
    if (!matched) {
      continue;
    }
    return {
      lengthCm: Number(matched[1]),
      widthCm: Number(matched[2]),
      heightCm: Number(matched[3])
    };
  }
  return {
    lengthCm: undefined,
    widthCm: undefined,
    heightCm: undefined
  };
}

export function parseProcurementWeightGramsFromTexts(texts: string[]) {
  for (const text of texts) {
    const matched = text.match(/(\d+(?:\.\d+)?)\s*(kg|公斤|千克|g|克)\b/i);
    if (!matched) {
      continue;
    }
    const numericValue = Number(matched[1]);
    if (!Number.isFinite(numericValue)) {
      continue;
    }
    const unit = matched[2].toLowerCase();
    if (unit === 'kg' || unit === '公斤' || unit === '千克') {
      return Number((numericValue * 1000).toFixed(2));
    }
    return Number(numericValue.toFixed(2));
  }
  return undefined;
}

export function buildProcurementQuickSignalsRequest(item?: ProcurementDemandItem) {
  if (!item) {
    return null;
  }

  const salePrice = midpointPrice(item.targetPriceMin, item.targetPriceMax);
  return {
    source: 'procurement',
    context: {
      site: normalizeProfitSite(item.targetSite),
      salePrice,
      titlePrefix: procurementDemandDisplayTitle(item)
    },
    candidates: item.candidates.map((candidate) => {
      const candidatePriceRange = parseProcurementNumberRange(candidate.standardizedPriceText || candidate.priceText);
      const texts = collectProcurementProfitTexts(candidate);
      const dimensions = parseProcurementDimensionsFromTexts(texts);
      const weightGrams = parseProcurementWeightGramsFromTexts(texts);

      return {
        candidateKey: candidate.id ? `candidate-${candidate.id}` : procurementCandidateDisplayTitle(candidate),
        candidateId: candidate.id,
        title: procurementCandidateDisplayTitle(candidate),
        purchasePrice: midpointPrice(candidatePriceRange.min, candidatePriceRange.max),
        lengthCm: dimensions.lengthCm,
        widthCm: dimensions.widthCm,
        heightCm: dimensions.heightCm,
        weightGrams
      };
    })
  };
}
