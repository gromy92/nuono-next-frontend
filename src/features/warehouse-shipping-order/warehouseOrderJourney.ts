import { apiFetch, parseApiResponse } from '../../shared/api';

export type WarehouseOrderJourney = {
  warehouseOrderId: string;
  shippingBatchId: string;
  shippingBatchNo: string;
  status: string;
  updatedAt?: string;
};

export function loadWarehouseOrderJourneys() {
  return apiFetch('/api/warehouse/dispatch/warehouse-order-journeys')
    .then((response) => parseApiResponse<WarehouseOrderJourney[]>(response, '读取仓库单流转记录失败'));
}

export function groupWarehouseOrderJourneys(journeys: WarehouseOrderJourney[]) {
  const grouped = new Map<string, WarehouseOrderJourney[]>();
  journeys.forEach((journey) => {
    const current = grouped.get(journey.warehouseOrderId) || [];
    current.push(journey);
    grouped.set(journey.warehouseOrderId, current);
  });
  return grouped;
}

export function warehouseOrderJourneyStatusMeta(status: string) {
  switch (status) {
    case 'SHIPPED': return { label: '已发运', color: 'green' };
    case 'PACKED': return { label: '待物流交接', color: 'cyan' };
    case 'PACKING': return { label: '装箱中', color: 'blue' };
    case 'OUTBOUND_CREATED': return { label: '待装箱', color: 'geekblue' };
    case 'OPTION_SELECTED': return { label: '已选物流', color: 'purple' };
    default: return { label: '计划中', color: 'default' };
  }
}
