import type { InTransitBatchFilters, InTransitContract } from './types'

export const DEFAULT_BATCH_PAGE_SIZE = 20

export const DEFAULT_FILTERS: InTransitBatchFilters = {
  statusScope: 'all',
  page: 1,
  pageSize: DEFAULT_BATCH_PAGE_SIZE,
  sortField: 'createdAt',
  sortDirection: 'desc'
}

export const DEFAULT_CONTRACT: InTransitContract = {
  transportModes: [
    { code: 'SEA', label: '海运' },
    { code: 'AIR', label: '空运' }
  ],
  destinations: [
    { code: 'RUH', label: '利雅得' },
    { code: 'DB', label: '迪拜' }
  ],
  batchStatuses: [
    { code: 'draft', label: '草稿' },
    { code: 'pending_shipment', label: '待发货' },
    { code: 'shipped', label: '已发货' },
    { code: 'in_transit', label: '运输中' },
    { code: 'customs_clearance', label: '清关中' },
    { code: 'delivering', label: '派送中' },
    { code: 'warehouse_received', label: '已入仓' },
    { code: 'exception', label: '异常' },
    { code: 'completed', label: '已完成' },
    { code: 'cancelled', label: '已取消' }
  ],
  nodeStatuses: [
    { code: 'created', label: '已登记' },
    { code: 'handed_to_forwarder', label: '已交货代' },
    { code: 'departed_origin', label: '起运地发出' },
    { code: 'in_transit', label: '运输中' },
    { code: 'arrived_port', label: '到港' },
    { code: 'customs_clearance', label: '清关中' },
    { code: 'customs_released', label: '清关完成' },
    { code: 'delivering', label: '派送中' },
    { code: 'warehouse_received', label: '已入仓' },
    { code: 'exception', label: '异常' },
    { code: 'cancelled', label: '已取消' }
  ],
  qualityStatuses: [],
  purchaseOrderFields: [],
  feeFields: []
}

export const MISSING_FIELD_LABELS: Record<string, string> = {
  forwarder: '货代',
  transportMode: '运输方式',
  targetStoreCode: '目的地',
  targetWarehouseName: '目的仓'
}
