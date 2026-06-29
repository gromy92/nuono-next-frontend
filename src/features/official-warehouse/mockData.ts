import type { OfficialWarehouseInboundOrder } from './types'

export const OFFICIAL_WAREHOUSE_OPTIONS = [
  { code: 'FBN-RUH', name: 'Riyadh FBN', siteCode: 'SA' },
  { code: 'FBN-JED', name: 'Jeddah FBN', siteCode: 'SA' },
  { code: 'FBN-DXB', name: 'Dubai FBN', siteCode: 'AE' }
]

export const officialWarehouseMockOrders: OfficialWarehouseInboundOrder[] = [
  {
    id: 'nowh-001',
    inboundNo: 'NOWH-260611-001',
    dispatchPlanNo: 'DSP-260611-001',
    storeCode: 'STR108065-NSA',
    storeName: 'canman',
    siteCode: 'SA',
    transportMode: 'AIR',
    recommendedWarehouseCode: 'FBN-RUH',
    recommendedWarehouseName: 'Riyadh FBN',
    confirmedWarehouseCode: 'FBN-RUH',
    confirmedWarehouseName: 'Riyadh FBN',
    asnNo: 'ASN-SA-260611-8731',
    productCount: 2,
    totalQuantity: 120,
    cartonCount: 10,
    asnStatus: 'SUCCESS',
    appointmentStatus: 'SUCCESS',
    receiptStatus: 'PARTIAL_RECEIVED',
    discrepancyStatus: 'NEEDS_CORRECTION',
    appointmentWindow: '2026-06-14 14:00-16:00',
    arrivedForwarderWarehouse: true,
    updatedAt: '2026-06-11 15:20',
    splitReason: '同店铺、同站点、同运输方式、同目的仓',
    issueTags: ['入仓少收 8 件'],
    lines: [
      {
        id: 'line-001-1',
        psku: 'PAPERSAYS036',
        noonSku: 'N53377117A',
        zsku: 'Z9D45F7F7B1A8127C8D7CZ',
        title: 'Portable thermal printer M08F',
        quantity: 80,
        cartonCount: 6,
        unitsPerCarton: 12,
        grossWeightKg: 42.6,
        volumeCbm: 0.38,
        missingTags: []
      },
      {
        id: 'line-001-2',
        psku: 'PAPERSAYS079',
        noonSku: 'N70092011A',
        zsku: 'Z14E7258D1C2E8AA20B99Z',
        title: 'Felt notice board dark grey',
        quantity: 40,
        cartonCount: 4,
        unitsPerCarton: 10,
        grossWeightKg: 28.4,
        volumeCbm: 0.31,
        missingTags: []
      }
    ],
    appointmentAttempts: [
      {
        id: 'ap-001-1',
        attemptedAt: '2026-06-11 15:08',
        warehouseCode: 'FBN-RUH',
        warehouseName: 'Riyadh FBN',
        expectedDateRange: '2026-06-13 至 2026-06-15',
        matchedDate: '2026-06-14',
        matchedSlot: '14:00-16:00',
        result: 'SUCCESS',
        operatorName: '毕翠红',
        noonResponseSummary: 'Noon accepted appointment slot id 81273.'
      }
    ],
    receiptRows: [
      {
        id: 'receipt-001-1',
        source: 'NOON_PULL',
        lineId: 'line-001-1',
        psku: 'PAPERSAYS036',
        shippedQuantity: 80,
        noonReceivedQuantity: 72,
        effectiveReceivedQuantity: 72,
        discrepancyQuantity: -8,
        status: 'SHORT_RECEIVED'
      },
      {
        id: 'receipt-001-2',
        source: 'NOON_PULL',
        lineId: 'line-001-2',
        psku: 'PAPERSAYS079',
        shippedQuantity: 40,
        noonReceivedQuantity: 40,
        effectiveReceivedQuantity: 40,
        discrepancyQuantity: 0,
        status: 'MATCHED'
      }
    ],
    corrections: []
  },
  {
    id: 'nowh-002',
    inboundNo: 'NOWH-260611-002',
    dispatchPlanNo: 'DSP-260611-001',
    storeCode: 'STR108065-NAE',
    storeName: 'canman',
    siteCode: 'AE',
    transportMode: 'SEA',
    recommendedWarehouseCode: 'FBN-DXB',
    recommendedWarehouseName: 'Dubai FBN',
    productCount: 1,
    totalQuantity: 60,
    cartonCount: 5,
    asnStatus: 'DRAFT',
    appointmentStatus: 'NOT_READY',
    receiptStatus: 'NOT_STARTED',
    discrepancyStatus: 'NONE',
    arrivedForwarderWarehouse: false,
    updatedAt: '2026-06-11 15:00',
    splitReason: '站点不同，自动拆分',
    issueTags: ['待确认目的仓'],
    lines: [
      {
        id: 'line-002-1',
        psku: 'PAPERSAYS082',
        noonSku: 'N53398002A',
        zsku: 'Z2D1421D8EF9017AB42B0Z',
        title: 'Felt notice board white',
        quantity: 60,
        cartonCount: 5,
        unitsPerCarton: 12,
        grossWeightKg: 35.2,
        volumeCbm: 0.44,
        missingTags: []
      }
    ],
    appointmentAttempts: [],
    receiptRows: [],
    corrections: []
  },
  {
    id: 'nowh-003',
    inboundNo: 'NOWH-260611-003',
    dispatchPlanNo: 'DSP-260611-002',
    storeCode: 'STR69486-NSA',
    storeName: 'SGGR',
    siteCode: 'SA',
    transportMode: 'SEA',
    recommendedWarehouseCode: 'FBN-JED',
    recommendedWarehouseName: 'Jeddah FBN',
    confirmedWarehouseCode: 'FBN-JED',
    confirmedWarehouseName: 'Jeddah FBN',
    asnNo: 'ASN-SA-260611-6149',
    productCount: 3,
    totalQuantity: 210,
    cartonCount: 18,
    asnStatus: 'SUCCESS',
    appointmentStatus: 'FAILED',
    receiptStatus: 'NOT_STARTED',
    discrepancyStatus: 'NONE',
    arrivedForwarderWarehouse: true,
    updatedAt: '2026-06-11 14:40',
    splitReason: '目的仓不同，自动拆分',
    issueTags: ['无可用时段'],
    lines: [
      {
        id: 'line-003-1',
        psku: 'SGGR170',
        noonSku: 'N88541091A',
        zsku: 'Z6B5186EE9CF77A178EA0Z',
        title: 'TPR fabric set',
        quantity: 90,
        cartonCount: 8,
        unitsPerCarton: 12,
        grossWeightKg: 51.8,
        volumeCbm: 0.62,
        missingTags: []
      },
      {
        id: 'line-003-2',
        psku: 'SGGR219',
        noonSku: 'N88542002A',
        title: 'Sleeping cap set',
        quantity: 60,
        cartonCount: 5,
        unitsPerCarton: 12,
        grossWeightKg: 24.1,
        volumeCbm: 0.29,
        missingTags: ['缺ZSKU']
      },
      {
        id: 'line-003-3',
        psku: 'SGGR250',
        noonSku: 'N88542003A',
        title: 'Sleeping cap set large',
        quantity: 60,
        cartonCount: 5,
        unitsPerCarton: 12,
        grossWeightKg: 25.4,
        volumeCbm: 0.32,
        missingTags: ['缺ZSKU']
      }
    ],
    appointmentAttempts: [
      {
        id: 'ap-003-1',
        attemptedAt: '2026-06-11 14:38',
        warehouseCode: 'FBN-JED',
        warehouseName: 'Jeddah FBN',
        expectedDateRange: '2026-06-13 至 2026-06-16',
        result: 'FAILED',
        failureReason: 'Noon 未返回符合条件的 slot',
        operatorName: '毕翠红',
        noonResponseSummary: 'Capacity empty for warehouse FBN-JED.'
      }
    ],
    receiptRows: [],
    corrections: []
  },
  {
    id: 'nowh-004',
    inboundNo: 'NOWH-260611-004',
    dispatchPlanNo: 'DSP-260611-003',
    storeCode: 'STR244978-NAE',
    storeName: 'chenwu',
    siteCode: 'AE',
    transportMode: 'AIR',
    recommendedWarehouseCode: 'FBN-DXB',
    recommendedWarehouseName: 'Dubai FBN',
    confirmedWarehouseCode: 'FBN-DXB',
    confirmedWarehouseName: 'Dubai FBN',
    asnNo: 'ASN-AE-260611-1440',
    productCount: 1,
    totalQuantity: 80,
    cartonCount: 6,
    asnStatus: 'SUCCESS',
    appointmentStatus: 'PENDING',
    receiptStatus: 'NOT_STARTED',
    discrepancyStatus: 'NONE',
    arrivedForwarderWarehouse: true,
    updatedAt: '2026-06-11 14:30',
    splitReason: '店铺不同，自动拆分',
    issueTags: [],
    lines: [
      {
        id: 'line-004-1',
        psku: 'PHO0B008-1',
        noonSku: 'N44112780A',
        zsku: 'ZAC5440E698D34CF34006Z',
        title: 'Phomemo 241BT label maker',
        quantity: 80,
        cartonCount: 6,
        unitsPerCarton: 14,
        grossWeightKg: 39.6,
        volumeCbm: 0.34,
        missingTags: []
      }
    ],
    appointmentAttempts: [],
    receiptRows: [],
    corrections: []
  }
]
