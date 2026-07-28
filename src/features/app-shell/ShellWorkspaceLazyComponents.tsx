import { lazyWorkspace } from '../route-catalog/workspaceMount';
export const InTransitGoodsPage = lazyWorkspace(() =>
  import('../in-transit-goods/InTransitGoodsPage').then((module) => ({ default: module.InTransitGoodsPage }))
);
export const RoleManagementWorkspace = lazyWorkspace(() =>
  import('../master-data/RoleManagementWorkspace').then((module) => ({ default: module.RoleManagementWorkspace }))
);
