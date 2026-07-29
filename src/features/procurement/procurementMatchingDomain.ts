import type { ProcurementCheckResult } from './types';
import { sanitizeProcurementCopy } from './procurementPresentationDomain';
import {
  normalizeProcurementFieldText,
  procurementFieldTokens,
  procurementMaxDays,
  procurementPowerMode
} from './procurementFieldDomain';

export function procurementSizeMatch(expected?: string, actual?: string) {
  const expectedText = sanitizeProcurementCopy(expected);
  const actualText = sanitizeProcurementCopy(actual);
  if (!expectedText && !actualText) {
    return {
      status: 'pending' as const,
      judgement: '尺寸信息待补充'
    };
  }
  if (!expectedText || !actualText) {
    return {
      status: 'pending' as const,
      judgement: '尺寸还不够完整'
    };
  }

  const expectedNumbers = expectedText.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const actualNumbers = actualText.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (expectedNumbers.length && actualNumbers.length) {
    const expectedValue = expectedNumbers[0] ?? 0;
    const actualValue = actualNumbers[0] ?? 0;
    const delta = Math.abs(expectedValue - actualValue);
    if (delta <= Math.max(1, expectedValue * 0.15)) {
      return {
        status: 'match' as const,
        judgement: '尺寸区间基本一致'
      };
    }
    if (delta <= Math.max(2, expectedValue * 0.3)) {
      return {
        status: 'warning' as const,
        judgement: '尺寸接近，但建议再复核'
      };
    }
    return {
      status: 'mismatch' as const,
      judgement: '尺寸明显偏离'
    };
  }

  const expectedNormalized = normalizeProcurementFieldText(expectedText);
  const actualNormalized = normalizeProcurementFieldText(actualText);
  if (expectedNormalized && actualNormalized && (actualNormalized.includes(expectedNormalized) || expectedNormalized.includes(actualNormalized))) {
    return {
      status: 'match' as const,
      judgement: '尺寸描述基本一致'
    };
  }

  const overlap = procurementFieldTokens(expectedText).some((token) => actualNormalized.includes(token));
  if (overlap) {
    return {
      status: 'warning' as const,
      judgement: '尺寸线索大体接近'
    };
  }

  return {
    status: 'mismatch' as const,
    judgement: '尺寸描述不一致'
  };
}

export function procurementTextFieldMatch(expected?: string, actual?: string, matchedLabel = '要求命中', mismatchLabel = '要求偏离') {
  const expectedText = sanitizeProcurementCopy(expected);
  const actualText = sanitizeProcurementCopy(actual);
  if (!expectedText && !actualText) {
    return {
      status: 'pending' as const,
      judgement: '信息待补充'
    };
  }
  if (!expectedText || !actualText) {
    return {
      status: 'pending' as const,
      judgement: '信息还不够完整'
    };
  }

  const actualNormalized = normalizeProcurementFieldText(actualText);
  const overlap = procurementFieldTokens(expectedText).some((token) => actualNormalized.includes(token));
  if (overlap) {
    return {
      status: 'match' as const,
      judgement: matchedLabel
    };
  }

  return {
    status: 'mismatch' as const,
    judgement: mismatchLabel
  };
}

export function procurementPowerModeMatch(expected?: string, actual?: string) {
  const expectedMode = procurementPowerMode(expected);
  const actualMode = procurementPowerMode(actual);
  if (!expectedMode && !actualMode) {
    return {
      status: 'pending' as const,
      judgement: '供电方式待补充'
    };
  }
  if (!expectedMode || !actualMode) {
    return {
      status: 'pending' as const,
      judgement: '供电方式还不够完整'
    };
  }
  if (expectedMode === actualMode) {
    return {
      status: 'match' as const,
      judgement: '供电方式一致'
    };
  }
  if (
    (expectedMode === '无电' && actualMode === '蜡烛/炭') ||
    (expectedMode === '蜡烛/炭' && actualMode === '无电')
  ) {
    return {
      status: 'warning' as const,
      judgement: '都属于非插电方向，但点火方式不同'
    };
  }
  return {
    status: 'mismatch' as const,
    judgement: '供电方式不一致'
  };
}

export function procurementDeliveryMatch(expected?: string, actual?: string) {
  const expectedDays = procurementMaxDays(expected);
  const actualDays = procurementMaxDays(actual);
  if (!expected && !actual) {
    return {
      status: 'pending' as const,
      judgement: '交期要求待补充'
    };
  }
  if (expectedDays === null || actualDays === null) {
    return {
      status: 'pending' as const,
      judgement: '交期信息还不够完整'
    };
  }
  if (actualDays <= expectedDays) {
    return {
      status: 'match' as const,
      judgement: '交期可以满足当前要求'
    };
  }
  if (actualDays <= expectedDays + 2) {
    return {
      status: 'warning' as const,
      judgement: '交期略慢，建议询价时重点确认'
    };
  }
  return {
    status: 'mismatch' as const,
    judgement: '交期偏慢，可能影响推进'
  };
}

export function procurementCheckStatusMeta(status: ProcurementCheckResult['status']) {
  if (status === 'match') {
    return { label: '命中', color: 'success' as const, background: '#f0fdf4', border: '#bbf7d0' };
  }
  if (status === 'warning') {
    return { label: '待确认', color: 'warning' as const, background: '#fffbeb', border: '#fde68a' };
  }
  if (status === 'mismatch') {
    return { label: '偏离', color: 'error' as const, background: '#fef2f2', border: '#fecaca' };
  }
  return { label: '待补', color: 'default' as const, background: '#f8fafc', border: '#e2e8f0' };
}

export function procurementStructuredFieldSourceMeta(source?: string) {
  if (source === 'AUTO_PARSED') {
    return { label: '自动解析', color: 'processing' as const };
  }
  if (source === 'MANUAL') {
    return { label: '人工维护', color: 'success' as const };
  }
  if (source === 'MIXED') {
    return { label: '混合补齐', color: 'warning' as const };
  }
  return { label: '待补字段', color: 'default' as const };
}

export function procurementEvidenceSourceMeta(sourceType?: string) {
  if (sourceType === 'MANUAL') {
    return { label: '人工维护', color: 'success' as const };
  }
  if (sourceType === 'AUTO_PARSED') {
    return { label: '自动抽取', color: 'processing' as const };
  }
  return { label: '来源待定', color: 'default' as const };
}
