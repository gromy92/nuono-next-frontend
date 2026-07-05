import type {
  ActualCommissionSnapshot,
  ActualOutboundFeeSnapshot,
  ProfitCalculationPayload,
  ProfitFormValues,
  OfficialCommissionCalculationResult,
  OfficialOutboundFeeCalculationResult
} from './domain';
import { apiFetch, parseApiResponse } from '../../shared/api';
import type { OrderFinanceOrderGroup } from '../order-finance/types';

export async function calculateProfitEstimate(request: Partial<ProfitFormValues>) {
  const response = await apiFetch('/api/profit/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return parseApiResponse<ProfitCalculationPayload>(response);
}

export type CalculateOfficialOutboundFeeByEffectiveSpecRequest = {
  ownerUserId: number;
  storeCode: string;
  skuId: string;
  site?: string;
  salePrice?: number;
};

export async function calculateOfficialOutboundFeeByEffectiveSpec(
  request: CalculateOfficialOutboundFeeByEffectiveSpecRequest
) {
  const response = await apiFetch('/api/official-outbound-fee/calculate-by-effective-spec', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return parseApiResponse<OfficialOutboundFeeCalculationResult>(response);
}

export type BatchCalculateOfficialOutboundFeeByEffectiveSpecRequest = {
  ownerUserId: number;
  storeCode: string;
  site?: string;
  items: Array<{
    skuId: string;
    site?: string;
    salePrice?: number;
  }>;
};

export async function batchCalculateOfficialOutboundFeeByEffectiveSpec(
  request: BatchCalculateOfficialOutboundFeeByEffectiveSpecRequest
) {
  const response = await apiFetch('/api/official-outbound-fee/batch-calculate-by-effective-spec', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return parseApiResponse<OfficialOutboundFeeCalculationResult[]>(response);
}

export async function batchCalculateOfficialOutboundFeeByNoonOfficialSpec(
  request: BatchCalculateOfficialOutboundFeeByEffectiveSpecRequest
) {
  const response = await apiFetch('/api/official-outbound-fee/batch-calculate-by-noon-official-spec', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return parseApiResponse<OfficialOutboundFeeCalculationResult[]>(response);
}

export async function calculateOfficialOutboundFeeByNoonOfficialSpec(
  request: CalculateOfficialOutboundFeeByEffectiveSpecRequest
) {
  const response = await apiFetch('/api/official-outbound-fee/calculate-by-noon-official-spec', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return parseApiResponse<OfficialOutboundFeeCalculationResult>(response);
}

export type FetchLatestOfficialOutboundFeeCalculationsRequest = {
  ownerUserId: number;
  storeCode: string;
  site: string;
  skuIds: string[];
  specSourceType?: string;
};

export async function fetchLatestOfficialOutboundFeeCalculations(
  request: FetchLatestOfficialOutboundFeeCalculationsRequest
) {
  const response = await apiFetch('/api/official-outbound-fee/latest-calculations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return parseApiResponse<OfficialOutboundFeeCalculationResult[]>(response);
}

export type CalculateOfficialCommissionByProductRequest = {
  ownerUserId: number;
  storeCode: string;
  skuId: string;
  site?: string;
  salePrice?: number;
};

export async function calculateOfficialCommissionByProduct(request: CalculateOfficialCommissionByProductRequest) {
  const response = await apiFetch('/api/official-commission/calculate-by-product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return parseApiResponse<OfficialCommissionCalculationResult>(response);
}

export type BatchCalculateOfficialCommissionByProductRequest = {
  ownerUserId: number;
  storeCode: string;
  site?: string;
  items: Array<{
    skuId: string;
    site?: string;
    salePrice?: number;
  }>;
};

export async function batchCalculateOfficialCommissionByProduct(request: BatchCalculateOfficialCommissionByProductRequest) {
  const response = await apiFetch('/api/official-commission/batch-calculate-by-product', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return parseApiResponse<OfficialCommissionCalculationResult[]>(response);
}

export type FetchLatestOfficialCommissionCalculationsRequest = {
  ownerUserId: number;
  storeCode: string;
  site: string;
  skuIds: string[];
};

export async function fetchLatestOfficialCommissionCalculations(
  request: FetchLatestOfficialCommissionCalculationsRequest
) {
  const response = await apiFetch('/api/official-commission/latest-calculations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  });

  return parseApiResponse<OfficialCommissionCalculationResult[]>(response);
}

export type FetchActualOutboundFeeSnapshotsRequest = {
  storeCode: string;
  siteCode: string;
  partnerSkuList: string[];
};

export async function fetchActualOutboundFeeSnapshots(request: FetchActualOutboundFeeSnapshotsRequest) {
  const params = new URLSearchParams({
    storeCode: request.storeCode,
    siteCode: request.siteCode
  });
  const partnerSkuList = Array.from(new Set(request.partnerSkuList.map((item) => item.trim()).filter(Boolean)));
  if (partnerSkuList.length) {
    params.set('partnerSkuList', partnerSkuList.join(','));
  }
  const response = await apiFetch(`/api/order-finance/actual-outbound-fees?${params.toString()}`);

  return parseApiResponse<ActualOutboundFeeSnapshot[]>(response);
}

export type FetchActualCommissionSnapshotsRequest = {
  storeCode: string;
  siteCode: string;
  partnerSkuList: string[];
};

export async function fetchActualCommissionSnapshots(request: FetchActualCommissionSnapshotsRequest) {
  const params = new URLSearchParams({
    storeCode: request.storeCode,
    siteCode: request.siteCode
  });
  const partnerSkuList = Array.from(new Set(request.partnerSkuList.map((item) => item.trim()).filter(Boolean)));
  if (partnerSkuList.length) {
    params.set('partnerSkuList', partnerSkuList.join(','));
  }
  const response = await apiFetch(`/api/order-finance/actual-commissions?${params.toString()}`);

  return parseApiResponse<ActualCommissionSnapshot[]>(response);
}

export type FetchActualOutboundFeeOrderGroupsRequest = {
  storeCode: string;
  siteCode: string;
  partnerSku: string;
  dateFrom: string;
  dateTo: string;
  currency?: string;
};

export async function fetchActualOutboundFeeOrderGroups(request: FetchActualOutboundFeeOrderGroupsRequest) {
  const params = new URLSearchParams({
    storeCode: request.storeCode,
    siteCode: request.siteCode,
    dateFrom: request.dateFrom,
    dateTo: request.dateTo,
    partnerSku: request.partnerSku
  });
  if (request.currency?.trim()) {
    params.set('currency', request.currency.trim());
  }
  const response = await apiFetch(`/api/order-finance/sku-orders?${params.toString()}`);

  return parseApiResponse<OrderFinanceOrderGroup[]>(response);
}
