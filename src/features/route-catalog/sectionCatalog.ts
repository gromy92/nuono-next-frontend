import type { WorkspaceSectionMetadata } from './types'
import { freezeCatalogMetadata } from './freezeCatalogMetadata'

export const WORKSPACE_SECTION_METADATA = freezeCatalogMetadata<WorkspaceSectionMetadata[]>([
  { key: 'home', label: '首页', iconKey: 'home', disabled: true },
  { key: 'product', label: '商品', iconKey: 'product' },
  { key: 'purchase', label: '采购', iconKey: 'purchase' },
  { key: 'logistics', label: '物流', iconKey: 'logistics' },
  { key: 'warehouse', label: '仓储', iconKey: 'warehouse' },
  { key: 'operations', label: '运营', iconKey: 'operations' },
  { key: 'operation-config', label: '运营配置', iconKey: 'operation-config' },
  { key: 'data', label: '数据', iconKey: 'data' },
  { key: 'system-reports', label: '系统报表', iconKey: 'system-reports' },
  { key: 'user', label: '用户', iconKey: 'user' },
  { key: 'system', label: '系统管理', iconKey: 'system' }
])
