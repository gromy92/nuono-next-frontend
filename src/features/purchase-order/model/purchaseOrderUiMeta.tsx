import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudSyncOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import type {
  PurchaseCollectionStatus,
  PurchaseOrderFulfillmentType,
  PurchaseOrderStatus,
  PurchaseSiteCode,
  PurchaseTransportMode
} from '../types'
import type {
  ProductDataLogisticsField,
  ProductDataSpecField
} from './purchaseOrderViewTypes'

export const ORDER_STATUS_META: Record<PurchaseOrderStatus, { label: string; color: string; icon: ReactNode }> = {
  draft: { label: '草稿', color: 'default', icon: <ClockCircleOutlined /> },
  pending_collection: { label: '待采集', color: 'blue', icon: <FileSearchOutlined /> },
  collecting: { label: '采集中', color: 'processing', icon: <CloudSyncOutlined /> },
  partial_done: { label: '部分完成', color: 'warning', icon: <ClockCircleOutlined /> },
  done: { label: '采集完成', color: 'success', icon: <CheckCircleOutlined /> },
  exception: { label: '有异常', color: 'error', icon: <ExclamationCircleOutlined /> },
  submitted: { label: '已封存', color: 'green', icon: <CheckCircleOutlined /> },
  deleted: { label: '已删除', color: 'default', icon: <DeleteOutlined /> }
}

export const ITEM_STATUS_META: Record<PurchaseCollectionStatus, { label: string; color: string }> = {
  not_started: { label: '待采集', color: 'default' },
  collecting: { label: '采集中', color: 'processing' },
  succeeded: { label: '采集成功', color: 'success' },
  failed: { label: '采集失败', color: 'error' },
  reused: { label: '复用历史', color: 'cyan' },
  cancelled: { label: '已取消', color: 'default' }
}

export const SITE_OPTIONS: Array<{ label: string; value: PurchaseSiteCode }> = [
  { label: '沙特 SA', value: 'SA' },
  { label: '阿联酋 AE', value: 'AE' }
]

export const DEFAULT_SITE_CODES: PurchaseSiteCode[] = ['SA', 'AE']

export const TRANSPORT_MODE_OPTIONS: Array<{ label: string; value: PurchaseTransportMode }> = [
  { label: '空运', value: 'AIR' },
  { label: '海运', value: 'SEA' }
]

export const DEFAULT_TRANSPORT_MODE: PurchaseTransportMode = 'AIR'
export const PURCHASE_ORDER_SEAL_WARNING = '封存后采购单将锁定，不能继续修改商品、数量或站点运输；如需调整，请联系管理员处理。'

export const FULFILLMENT_TYPE_OPTIONS: Array<{ label: string; value: PurchaseOrderFulfillmentType }> = [
  { label: '货到仓库', value: 'WAREHOUSE_RECEIPT' },
  { label: '货到货代', value: 'FACTORY_DIRECT' }
]

export const DEFAULT_FULFILLMENT_TYPE: PurchaseOrderFulfillmentType = 'WAREHOUSE_RECEIPT'
export const PRODUCT_DATA_PRODUCT_SPEC_FIELDS: ProductDataSpecField[] = [
  { key: 'productLengthCm', label: '长/cm', min: 0.01, precision: 2 },
  { key: 'productWidthCm', label: '宽/cm', min: 0.01, precision: 2 },
  { key: 'productHeightCm', label: '高/cm', min: 0.01, precision: 2 },
  { key: 'productWeightG', label: '重/g', min: 0.01, precision: 2 }
]

export const PRODUCT_DATA_CARTON_SPEC_FIELDS: ProductDataSpecField[] = [
  { key: 'cartonLengthCm', label: '箱长/cm', min: 0.01, precision: 2 },
  { key: 'cartonWidthCm', label: '箱宽/cm', min: 0.01, precision: 2 },
  { key: 'cartonHeightCm', label: '箱高/cm', min: 0.01, precision: 2 },
  { key: 'cartonWeightKg', label: '箱重/kg', min: 0.001, precision: 3 },
  { key: 'cartonQuantity', label: '装箱数', min: 1, precision: 0 }
]

export const PRODUCT_DATA_SPEC_FIELDS: ProductDataSpecField[] = [
  ...PRODUCT_DATA_PRODUCT_SPEC_FIELDS,
  ...PRODUCT_DATA_CARTON_SPEC_FIELDS
]

export const PRODUCT_DATA_LOGISTICS_FIELDS: ProductDataLogisticsField[] = [
  {
    key: 'batteryType',
    label: '带电',
    options: [
      { label: '未选择', value: 'unknown' },
      { label: '不带电', value: 'none' },
      { label: '带电', value: 'battery_equipment' }
    ]
  },
  {
    key: 'electricType',
    label: '电器',
    options: [
      { label: '未选择', value: 'unknown' },
      { label: '非电器', value: 'none' },
      { label: '电器', value: 'electric_equipment_review' }
    ]
  },
  {
    key: 'magneticType',
    label: '磁性',
    options: [
      { label: '未选择', value: 'unknown' },
      { label: '不带磁', value: 'none' },
      { label: '带磁', value: 'magnetic' }
    ]
  },
  {
    key: 'liquidType',
    label: '液体',
    options: [
      { label: '未选择', value: 'unknown' },
      { label: '非液体', value: 'none' },
      { label: '液体', value: 'liquid' }
    ]
  },
  {
    key: 'powderType',
    label: '粉末',
    options: [
      { label: '未选择', value: 'unknown' },
      { label: '非粉末', value: 'none' },
      { label: '粉末', value: 'powder' }
    ]
  },
  {
    key: 'woodenMaterialType',
    label: '木材',
    options: [
      { label: '未选择', value: 'unknown' },
      { label: '非木材', value: 'none' },
      { label: '木材', value: 'wooden_material_review' }
    ]
  },
  {
    key: 'bladeWeaponType',
    label: '刀具',
    options: [
      { label: '未选择', value: 'unknown' },
      { label: '非刀具', value: 'none' },
      { label: '刀具', value: 'blade_tool_review' }
    ]
  }
]
