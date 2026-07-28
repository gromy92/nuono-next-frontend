import assert from 'node:assert/strict';

function flattenOrgNodes(nodes) {
  const result = [];
  const visit = (node) => {
    result.push(node);
    for (const child of node.children || []) visit(child);
  };
  for (const node of nodes || []) visit(node);
  return result;
}

function findById(items, id) {
  return items.find((item) => item.id === id);
}

export async function verifyMasterDataApiDetails({ adminOperatorId, requestJson }) {
  const bootstrap = await requestJson('/api/system/bootstrap');
  assert.equal(bootstrap.database?.ready, true, 'bootstrap database.ready 应为 true');
  assert(
    bootstrap.database?.initScripts?.includes('classpath:db/init/010_align_core_tables_to_online_schema.sql'),
    'bootstrap initScripts 应包含 010 对齐脚本'
  );

  const merchantUsers = await requestJson('/api/master-data/users?operatorRoleLevel=0&view=merchant');
  assert.equal(merchantUsers.length, 6, '超管商家视图应展示 6 个老板账号');
  assert(findById(merchantUsers, 307), '商家视图缺少毕翠红');
  assert(findById(merchantUsers, 308), '商家视图缺少马天龙');
  assert(findById(merchantUsers, 10002), '商家视图缺少星耀测试店老板账号');
  assert(!findById(merchantUsers, 312), '商家视图不应展示运营主管雷皓');

  const bicuithongDetail = await requestJson('/api/master-data/user-detail?userId=307');
  assert.equal(bicuithongDetail.roleName, '老板', '毕翠红详情角色应为老板');
  assert.equal(bicuithongDetail.storeLinks.length, 4, '毕翠红详情项目店铺数应为 4');

  const matianlongDetail = await requestJson('/api/master-data/user-detail?userId=308');
  assert.equal(matianlongDetail.roleName, '老板', '马天龙详情角色应为老板');
  assert.equal(matianlongDetail.storeLinks.length, 16, '马天龙详情项目店铺数应为 16');

  const assignStoresPayload = { operatorUserId: adminOperatorId, storeCodes: ['PRJ108065'] };
  await requestJson('/api/master-data/users/338/assign-stores', { method: 'POST', body: assignStoresPayload });

  const bicuithongTeam = await requestJson('/api/master-data/users?operatorUserId=307&operatorRoleLevel=1&view=team');
  assert(bicuithongTeam.length >= 4, '毕翠红团队视图应至少展示项目授权成员和生产补齐成员');
  assert.equal(findById(bicuithongTeam, 312)?.storeCount, 2, '毕翠红视角下雷皓应只关联 2 个项目店铺');
  assert(findById(bicuithongTeam, 313), '毕翠红团队视图应展示生产修复后的郭瑶');
  assert.equal(findById(bicuithongTeam, 320)?.storeCount, 1, '毕翠红视角下韩雨应只关联 1 个项目店铺');
  assert.equal(findById(bicuithongTeam, 338)?.storeCount, 1, '毕翠红视角下陆文欢应关联 canman 1 个项目店铺');
  await requestJson('/api/master-data/users/338/assign-stores', { method: 'POST', body: assignStoresPayload });

  const bicuithongOrgNodes = flattenOrgNodes(
    await requestJson('/api/master-data/org-tree?operatorUserId=307&operatorRoleLevel=1')
  );
  const bicuithongRoot = findById(bicuithongOrgNodes, 307);
  const guoyaoNode = findById(bicuithongOrgNodes, 313);
  assert(bicuithongRoot?.children?.some((node) => node.id === 313), '毕翠红组织架构应把郭瑶挂在毕翠红下');
  assert(bicuithongRoot?.children?.some((node) => node.id === 338), '毕翠红组织架构应把陆文欢挂在毕翠红下');
  assert(guoyaoNode?.children?.some((node) => node.id === 320), '毕翠红组织架构应保留郭瑶 -> 韩雨关系');

  const matianlongTeam = await requestJson('/api/master-data/users?operatorUserId=308&operatorRoleLevel=1&view=team');
  assert(findById(matianlongTeam, 312), '马天龙团队视图应展示雷皓');
  assert(!findById(matianlongTeam, 313), '马天龙团队视图不应展示毕翠红链路下的郭瑶');
  assert(!findById(matianlongTeam, 307), '马天龙团队视图不应展示毕翠红');

  const matianlongOrgNodes = flattenOrgNodes(
    await requestJson('/api/master-data/org-tree?operatorUserId=308&operatorRoleLevel=1')
  );
  assert(findById(matianlongOrgNodes, 308), '马天龙组织架构应包含自己');
  assert(findById(matianlongOrgNodes, 312), '马天龙组织架构应包含雷皓');
  assert(!findById(matianlongOrgNodes, 313), '马天龙组织架构不应包含毕翠红链路下的郭瑶');
  assert(!findById(matianlongOrgNodes, 307), '马天龙组织架构不应包含毕翠红');

  const roles = await requestJson('/api/master-data/roles');
  assert.equal(roles.length, 6, '角色列表应为老系统 6 个基础角色');
  for (const roleName of ['系统管理员', '老板', '运营主管', '运营', '采购', '仓管']) {
    assert(roles.some((role) => role.name === roleName), `角色列表缺少 ${roleName}`);
  }

  const menus = await requestJson('/api/master-data/menus');
  assert.equal(menus.length, 25, '菜单列表应为老系统 25 个菜单');
  assert(menus.some((menu) => menu.name === '用户管理' && menu.urlPath === '/api/user/manage'), '菜单列表缺少用户管理');
  assert(menus.some((menu) => menu.name === '角色分配' && menu.urlPath === '/api/user/role'), '菜单列表缺少角色分配');

  const storeOverview = await requestJson('/api/store-sync/overview?ownerUserId=307');
  assert.equal(storeOverview.ready, true, '毕翠红店铺管理 overview 应 ready');
  assert.equal(storeOverview.summary?.totalStores, 4, '毕翠红店铺管理项目店铺数应为 4');
  assert.equal(storeOverview.summary?.totalSiteStores, 6, '毕翠红店铺管理站点数应排除 chenwu 非当前授权站点后为 6');
  assert.equal(storeOverview.summary?.connectedStores, 4, '毕翠红店铺管理已连通项目店铺数应按生产 user_project 为 4');
  assert.equal(storeOverview.summary?.connectedSiteStores, 6, '毕翠红店铺管理已连通站点数应排除 chenwu 非当前授权站点后为 6');
  assert(storeOverview.stores.every((store) => store.noonUser), '毕翠红 4 个项目店铺都应展示生产 user_project 的 Noon 用户名');
  assert(storeOverview.stores.some((store) => store.projectCode === 'PRJ108065' && store.noonUser), '毕翠红 canman 应展示项目级 Noon 用户名');
  assert(storeOverview.stores.some((store) => store.managers?.some((manager) => manager.id === 338)), 'canman 负责人应包含陆文欢');

  const connection = await requestJson('/api/store-sync/test-connection?ownerUserId=308&storeCode=PRJ346391');
  assert.equal(connection.checkMode, 'NOON_WHOAMI', '连通测试必须走 Noon WHOAMI 真实校验');
  assert(Number(connection.noonRequestTotalCount ?? 0) >= 1, '连通测试必须实际发起 Noon WHOAMI 请求，不能只读本地绑定状态');
  assert.equal(typeof connection.connected, 'boolean', '连通测试应返回真实布尔结果');

  const invalidLogin = await requestJson('/api/auth/login', {
    method: 'POST',
    expectedStatus: 400,
    body: { accountNo: '毕翠红', password: 'wrong-password' }
  });
  assert.equal(invalidLogin.status, 400, '错误密码登录应返回 400');

  const invalidToggle = await requestJson('/api/master-data/users/307/toggle-status', {
    method: 'POST',
    expectedStatus: 400,
    body: { status: 2, operatorUserId: 307 }
  });
  assert.equal(invalidToggle.status, 400, '非法账号状态应返回 400');

  return {
    merchantUserCount: merchantUsers.length,
    roles: roles.length,
    menus: menus.length,
    matianlongTeamUsers: matianlongTeam.length,
    bicuithongStores: bicuithongDetail.storeLinks.length,
    matianlongStores: matianlongDetail.storeLinks.length
  };
}

export async function verifySystemCrudApiDetails({ adminOperatorId, requestJson }) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const menuName = `Smoke菜单${suffix}`;
  const updatedMenuName = `Smoke菜单更新${suffix}`;
  const menuPath = `/smoke/menu/${suffix}`;
  const updatedMenuPath = `/smoke/menu-updated/${suffix}`;
  const roleName = `Smoke角色${suffix}`;
  const updatedRoleName = `Smoke角色更新${suffix}`;
  const roleCode = `SMOKE_ROLE_${suffix.replace(/[^A-Za-z0-9_]/g, '_')}`;

  await requestJson('/api/master-data/menus', {
    method: 'POST',
    body: { name: menuName, parentId: 5, urlPath: menuPath, operatorUserId: adminOperatorId }
  });
  let menus = await requestJson('/api/master-data/menus');
  const createdMenu = menus.find((menu) => menu.name === menuName && menu.urlPath === menuPath);
  assert(createdMenu, '新增菜单后列表中应能找到临时菜单');

  await requestJson(`/api/master-data/menus/${createdMenu.id}`, {
    method: 'PUT',
    body: { name: updatedMenuName, parentId: 5, urlPath: updatedMenuPath, operatorUserId: adminOperatorId }
  });
  menus = await requestJson('/api/master-data/menus');
  const updatedMenu = menus.find((menu) => menu.id === createdMenu.id);
  assert.equal(updatedMenu?.name, updatedMenuName, '更新菜单后名称应变化');
  assert.equal(updatedMenu?.urlPath, updatedMenuPath, '更新菜单后路径应变化');

  await requestJson('/api/master-data/roles', {
    method: 'POST',
    body: {
      name: roleName,
      code: roleCode,
      description: 'smoke 自动化临时角色',
      parentId: 3,
      level: 3,
      operatorUserId: adminOperatorId,
      menuIds: [10, 25, createdMenu.id]
    }
  });
  let roles = await requestJson('/api/master-data/roles');
  const createdRole = roles.find((role) => role.code === roleCode);
  assert(createdRole, '新增角色后列表中应能找到临时角色');
  assert(createdRole.menuIds.includes(10), '新增角色应包含用户管理菜单');
  assert(createdRole.menuIds.includes(25), '新增角色应包含角色分配菜单');
  assert(createdRole.menuIds.includes(createdMenu.id), '新增角色应包含临时菜单');

  await requestJson(`/api/master-data/roles/${createdRole.id}`, {
    method: 'PUT',
    body: {
      name: updatedRoleName,
      code: roleCode,
      description: 'smoke 自动化临时角色已更新',
      parentId: 3,
      level: 3,
      operatorUserId: adminOperatorId,
      menuIds: [25]
    }
  });
  roles = await requestJson('/api/master-data/roles');
  const updatedRole = roles.find((role) => role.id === createdRole.id);
  assert.equal(updatedRole?.name, updatedRoleName, '更新角色后名称应变化');
  assert.deepEqual(updatedRole?.menuIds, [25], '更新角色后菜单范围应收敛到角色分配');

  await requestJson(`/api/master-data/roles/${createdRole.id}?operatorUserId=${adminOperatorId}`, { method: 'DELETE' });
  roles = await requestJson('/api/master-data/roles');
  assert(!roles.some((role) => role.id === createdRole.id), '删除角色后临时角色不应再出现在列表中');

  await requestJson(`/api/master-data/menus/${createdMenu.id}`, { method: 'DELETE' });
  menus = await requestJson('/api/master-data/menus');
  assert(!menus.some((menu) => menu.id === createdMenu.id), '删除菜单后临时菜单不应再出现在列表中');

  const protectedRoleDelete = await requestJson(`/api/master-data/roles/1?operatorUserId=${adminOperatorId}`, {
    method: 'DELETE',
    expectedStatus: 400
  });
  assert.equal(protectedRoleDelete.status, 400, '删除系统预设角色应返回 400');

  return {
    menuCreatedAndDeleted: createdMenu.id,
    roleCreatedAndDeleted: createdRole.id,
    protectedRoleDelete: protectedRoleDelete.status
  };
}
