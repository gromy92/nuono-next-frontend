import {
  formatProcurementPriceRange,
  parseProcurementLeadingInteger,
  parseProcurementNumberRange,
  procurementCandidateDeliveryText,
  procurementCandidateDisplayTitle,
  procurementCandidateMaterialText,
  procurementCandidateMoqText,
  procurementCandidatePackageText,
  procurementCandidatePowerModeText,
  procurementCandidatePriceText,
  procurementCandidateSizeText,
  procurementDeliveryMatch,
  procurementDemandDisplayTitle,
  procurementDisplayArray,
  procurementDisplayText,
  procurementPowerMode,
  procurementPowerModeMatch,
  procurementRequirementText,
  procurementSizeMatch,
  procurementTextFieldMatch
} from './domain';
import type { ProcurementCandidate, ProcurementCheckResult, ProcurementDemandItem } from './types';

export function buildProcurementCompareSummary(
  selectedProcurementItem: ProcurementDemandItem | undefined,
  comparingProcurementCandidate: ProcurementCandidate | undefined
) {
    if (!selectedProcurementItem || !comparingProcurementCandidate) {
      return null;
    }

    const targetMin = selectedProcurementItem.targetPriceMin;
    const targetMax = selectedProcurementItem.targetPriceMax;
    const candidatePriceRange = parseProcurementNumberRange(
      comparingProcurementCandidate.standardizedPriceText || comparingProcurementCandidate.priceText
    );
    const candidateMoq = parseProcurementLeadingInteger(
      comparingProcurementCandidate.standardizedMoqText || comparingProcurementCandidate.moqText
    );
    const fitScore = comparingProcurementCandidate.fitScore ?? 0;
    const specScore = comparingProcurementCandidate.specScore ?? 0;
    const priceScore = comparingProcurementCandidate.priceScore ?? 0;
    const supplierScore = comparingProcurementCandidate.supplierScore ?? 0;
    const logisticsScore = comparingProcurementCandidate.logisticsScore ?? 0;
    const totalScore = comparingProcurementCandidate.totalScore ?? 0;

    const priceMatched =
      typeof targetMin === 'number' &&
      typeof targetMax === 'number' &&
      candidatePriceRange.min !== null &&
      candidatePriceRange.max !== null &&
      candidatePriceRange.max >= targetMin &&
      candidatePriceRange.min <= targetMax;

    const moqMatched =
      typeof selectedProcurementItem.targetQuantity === 'number' &&
      candidateMoq !== null &&
      candidateMoq <= selectedProcurementItem.targetQuantity;

    const materialMatched = procurementTextFieldMatch(
      selectedProcurementItem.targetMaterial,
      comparingProcurementCandidate.materialText,
      '材质方向命中',
      '材质方向偏离'
    );
    const powerModeMatched = procurementPowerModeMatch(
      selectedProcurementItem.targetPowerMode,
      comparingProcurementCandidate.powerModeText
    );
    const sizeMatched = procurementSizeMatch(
      selectedProcurementItem.targetSizeText,
      comparingProcurementCandidate.sizeText
    );
    const packageMatched = procurementTextFieldMatch(
      selectedProcurementItem.targetPackageType,
      comparingProcurementCandidate.packageText,
      '包装方向命中',
      '包装方向偏离'
    );
    const deliveryMatched = procurementDeliveryMatch(
      selectedProcurementItem.deliveryExpectation,
      comparingProcurementCandidate.deliveryTimelineText
    );

    const structuredChecks: ProcurementCheckResult[] = [
      {
        label: '材质',
        sourceValue: procurementDisplayText(selectedProcurementItem.targetMaterial),
        candidateValue: procurementCandidateMaterialText(comparingProcurementCandidate),
        status: materialMatched.status,
        judgement: materialMatched.judgement,
        positiveSignal: materialMatched.status === 'match' ? '材质方向符合采购要求' : undefined,
        pendingSignal:
          materialMatched.status === 'mismatch'
            ? '材质方向可能偏离采购要求'
            : materialMatched.status === 'pending'
              ? '材质信息待补充'
              : undefined
      },
      {
        label: '供电方式',
        sourceValue: procurementDisplayText(procurementPowerMode(selectedProcurementItem.targetPowerMode) || selectedProcurementItem.targetPowerMode),
        candidateValue: procurementCandidatePowerModeText(comparingProcurementCandidate),
        status: powerModeMatched.status,
        judgement: powerModeMatched.judgement,
        positiveSignal: powerModeMatched.status === 'match' ? '供电方式与目标一致' : undefined,
        pendingSignal:
          powerModeMatched.status === 'warning'
            ? '供电方向接近，但使用方式不同'
            : powerModeMatched.status === 'mismatch'
              ? '供电方式与目标不一致'
              : powerModeMatched.status === 'pending'
                ? '供电方式待补充'
                : undefined
      },
      {
        label: '尺寸/体量',
        sourceValue: procurementDisplayText(selectedProcurementItem.targetSizeText),
        candidateValue: procurementCandidateSizeText(comparingProcurementCandidate),
        status: sizeMatched.status,
        judgement: sizeMatched.judgement,
        positiveSignal: sizeMatched.status === 'match' ? '尺寸区间基本匹配' : undefined,
        pendingSignal:
          sizeMatched.status === 'warning'
            ? '尺寸接近，但建议再复核'
            : sizeMatched.status === 'mismatch'
              ? '尺寸可能偏离目标'
              : sizeMatched.status === 'pending'
                ? '尺寸信息待补充'
                : undefined
      },
      {
        label: '包装形式',
        sourceValue: procurementDisplayText(selectedProcurementItem.targetPackageType),
        candidateValue: procurementCandidatePackageText(comparingProcurementCandidate),
        status: packageMatched.status,
        judgement: packageMatched.judgement,
        positiveSignal: packageMatched.status === 'match' ? '包装形式符合当前预期' : undefined,
        pendingSignal:
          packageMatched.status === 'mismatch'
            ? '包装形式偏离采购要求'
            : packageMatched.status === 'pending'
              ? '包装信息待补充'
              : undefined
      },
      {
        label: '交期',
        sourceValue: procurementDisplayText(selectedProcurementItem.deliveryExpectation),
        candidateValue: procurementCandidateDeliveryText(comparingProcurementCandidate),
        status: deliveryMatched.status,
        judgement: deliveryMatched.judgement,
        positiveSignal: deliveryMatched.status === 'match' ? '交期可以覆盖当前节奏' : undefined,
        pendingSignal:
          deliveryMatched.status === 'warning'
            ? '交期略慢，需带着问题去询价'
            : deliveryMatched.status === 'mismatch'
              ? '交期可能拖慢推进'
              : deliveryMatched.status === 'pending'
                ? '交期信息待补充'
                : undefined
      }
    ];

    const hardMismatchCount = structuredChecks.filter((item) => item.status === 'mismatch').length;
    const unresolvedCheckCount = structuredChecks.filter((item) => item.status === 'warning' || item.status === 'pending').length;
    const powerModeIsCriticalMismatch = structuredChecks.some(
      (item) => item.label === '供电方式' && item.status === 'mismatch'
    );

    let overallLabel = '需谨慎复核';
    let overallColor: 'success' | 'processing' | 'warning' | 'default' = 'default';
    let overallDescription = '当前候选可继续保留在候选池中，但还不建议直接进入采购确认。';
    if (powerModeIsCriticalMismatch) {
      overallLabel = '关键条件偏离';
      overallColor = 'warning';
      overallDescription = '供电方式与采购要求不一致，当前不建议直接推进，应优先换候选或重新确认目标要求。';
    } else if (hardMismatchCount >= 2) {
      overallLabel = '多项条件偏离';
      overallColor = 'warning';
      overallDescription = '材质、尺寸、包装或交期里已有多项偏离，继续推进的收益不高。';
    } else if (totalScore >= 80 && hardMismatchCount === 0 && unresolvedCheckCount <= 1) {
      overallLabel = '可作为意向采购';
      overallColor = 'success';
      overallDescription = '外观、价格与供应商能力整体较好，可以优先作为当前意向采购候选。';
    } else if (totalScore >= 65 && hardMismatchCount === 0) {
      overallLabel = '可继续比对';
      overallColor = 'processing';
      overallDescription = '整体较匹配，但还要继续核对规格、交期和供应商稳定性。';
    } else if (totalScore >= 50 && hardMismatchCount <= 1) {
      overallLabel = '可继续对比';
      overallColor = 'warning';
      overallDescription = '当前更适合作为待复核候选，建议继续横向比较。';
    }

    const positiveSignals = [
      ...structuredChecks.map((item) => item.positiveSignal).filter(Boolean),
      fitScore >= 32 ? '外观轮廓和核心卖点接近' : fitScore >= 24 ? '主体结构较接近' : '',
      specScore >= 15 ? '规格匹配度较高' : specScore >= 10 ? '规格线索基本够用' : '',
      priceMatched ? '价格带落在目标区间' : priceScore >= 24 ? '价格仍有竞争力' : '',
      moqMatched ? '起订量可以覆盖当前需求' : '',
      supplierScore >= 14 ? '供应商能力较强' : supplierScore >= 10 ? '供应商能力可继续观察' : '',
      logisticsScore >= 12 ? '物流履约节奏较稳' : logisticsScore >= 9 ? '物流节奏可继续核验' : ''
    ].filter(Boolean) as string[];

    const pendingSignals = [
      ...structuredChecks.map((item) => item.pendingSignal).filter(Boolean),
      fitScore < 24 ? '外观或功能仍需人工复核' : '',
      specScore < 10 ? '规格匹配度仍需补强' : '',
      !priceMatched && candidatePriceRange.min !== null ? '价格可能偏离目标区间' : '',
      !moqMatched && candidateMoq !== null ? '起订量偏高，可能压库存' : '',
      ...procurementDisplayArray(comparingProcurementCandidate.warnings)
    ].filter(Boolean) as string[];

    return {
      overallLabel,
      overallColor,
      overallDescription,
      structuredChecks,
      positiveSignals,
      pendingSignals,
      rows: [
        {
          label: '标题 / 款式拟合',
          sourceValue: procurementDemandDisplayTitle(selectedProcurementItem),
          candidateValue: procurementCandidateDisplayTitle(comparingProcurementCandidate),
          judgement: fitScore >= 32 ? '外观与卖点高度接近' : fitScore >= 24 ? '主体接近，需看细节图' : '标题与结构仍需人工确认'
        },
        ...structuredChecks.map((item) => ({
          label: item.label,
          sourceValue: item.sourceValue,
          candidateValue: item.candidateValue,
          judgement: item.judgement
        })),
        {
          label: '价格带',
          sourceValue: formatProcurementPriceRange(targetMin, targetMax),
          candidateValue: procurementCandidatePriceText(comparingProcurementCandidate),
          judgement:
            candidatePriceRange.min === null
              ? '候选价格信息待确认'
              : priceMatched
                ? '价格落在目标区间'
                : '价格可能偏离目标区间'
        },
        {
          label: '采购数量 / 起订量',
          sourceValue: `${selectedProcurementItem.targetQuantity || '-'} 件`,
          candidateValue: procurementCandidateMoqText(comparingProcurementCandidate),
          judgement:
            candidateMoq === null
              ? '起订量信息待确认'
              : moqMatched
                ? '起订量可覆盖当前需求'
                : '起订量偏高，需要重新评估'
        },
        {
          label: '采购要求 / 风险',
          sourceValue: procurementRequirementText(selectedProcurementItem.specialRequirement),
          candidateValue:
            comparingProcurementCandidate.warnings.length > 0
              ? procurementDisplayArray(comparingProcurementCandidate.warnings).join('；')
              : '当前未识别明显风险',
          judgement:
            comparingProcurementCandidate.warnings.length > 1
              ? '建议先补做人工确认再推进'
              : comparingProcurementCandidate.warnings.length === 1
                ? '有单点风险，建议带着问题去询价'
                : '当前风险可控'
        }
      ],
      scoreCards: [
        { label: '外观/功能拟合', value: fitScore, max: 40 },
        { label: '规格信息', value: specScore, max: 25 },
        { label: '价格符合度', value: priceScore, max: 14 },
        { label: '供应商能力', value: supplierScore, max: 14 },
        { label: '物流履约', value: logisticsScore, max: 12 }
      ]
    };

}
