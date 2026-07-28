import { lazyWorkspace } from '../route-catalog/workspaceMount';
export const RoleManagementWorkspace = lazyWorkspace(() =>
  import('../master-data/RoleManagementWorkspace').then((module) => ({ default: module.RoleManagementWorkspace }))
);
