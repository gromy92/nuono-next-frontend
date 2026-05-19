import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import process from 'node:process';
import { chromium } from 'playwright-core';

const SESSION_STORAGE_KEY = 'nuono-next-session';
const ADMIN_OPERATOR_ID = 10003;
const REAL_ACCOUNT_PASSWORD = process.env.MASTER_DATA_REAL_ACCOUNT_PASSWORD;

const browserCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
].filter(Boolean);

const executablePath = browserCandidates.find((candidate) => existsSync(candidate));

if (!executablePath) {
  throw new Error('未找到可用浏览器，请设置 PLAYWRIGHT_CHROMIUM_PATH。');
}

async function resolveBaseUrl() {
  if (process.env.MASTER_DATA_BASE_URL) {
    return process.env.MASTER_DATA_BASE_URL;
  }

  const candidates = [
    'http://127.0.0.1:9620',
    'http://localhost:9620',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:4176'
  ];
  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate}/login`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(1500)
      });
      if (response.ok) {
        return candidate;
      }
    } catch {
      // Try the next known frontend port.
    }
  }

  return candidates[0];
}

const baseUrl = await resolveBaseUrl();

async function requestJson(path, options = {}) {
  const {
    method = 'GET',
    body,
    expectedStatus = 200
  } = options;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(5000)
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  assert.equal(response.status, expectedStatus, `${method} ${path} 返回 ${response.status}: ${text.slice(0, 300)}`);
  return payload;
}

async function fetchJson(path) {
  return requestJson(path);
}

function flattenOrgNodes(nodes) {
  const result = [];
  const visit = (node) => {
    result.push(node);
    for (const child of node.children || []) {
      visit(child);
    }
  };
  for (const node of nodes || []) {
    visit(node);
  }
  return result;
}

function findById(items, id) {
  return items.find((item) => item.id === id);
}

function readSessionFromPage(page) {
  return page.evaluate((storageKey) => {
    const rawValue = window.localStorage.getItem(storageKey);
    return rawValue ? JSON.parse(rawValue) : null;
  }, SESSION_STORAGE_KEY);
}

async function assertBodyIncludes(page, expectedTexts, context) {
  const bodyText = await page.locator('body').innerText();
  for (const expectedText of expectedTexts) {
    assert(bodyText.includes(expectedText), `${context} 缺少：${expectedText}`);
  }
  return bodyText;
}

async function login(page, accountNo) {
  assert(REAL_ACCOUNT_PASSWORD, '缺少 MASTER_DATA_REAL_ACCOUNT_PASSWORD，不能执行真实账号登录用例。');
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((storageKey) => window.localStorage.removeItem(storageKey), SESSION_STORAGE_KEY);
  await page.getByPlaceholder('请输入用户名').waitFor();
  await page.getByPlaceholder('请输入用户名').fill(accountNo);
  await page.getByPlaceholder('请输入密码').fill(REAL_ACCOUNT_PASSWORD);
  await page.locator('button.ant-btn-primary').first().click();
  await page.waitForFunction(() => !window.location.pathname.startsWith('/login'), null, { timeout: 15000 });

  const session = await readSessionFromPage(page);
  assert(session, `${accountNo} 登录后没有写入本地会话`);
  assert.equal(session.accountNo, accountNo, `${accountNo} 登录会话账号不匹配`);
  assert(session.currentStore, `${accountNo} 登录后没有 currentStore`);
  assert(Array.isArray(session.userStores), `${accountNo} 登录后没有 userStores`);
  return session;
}

async function verifyRoleAssignmentShell(page, account) {
  await page.goto(`${baseUrl}/user/role`, { waitUntil: 'domcontentloaded' });
  await page.getByText('角色分配').first().waitFor();
  await assertBodyIncludes(page, ['角色分配', '店铺管理', '组织架构', '权限总览'], `${account.accountNo} 角色分配页`);

  await page.getByRole('tab', { name: '店铺管理' }).click();
  await page.getByText('创建店铺').first().waitFor();
  const storeTabText = await assertBodyIncludes(
    page,
    ['创建店铺', '修改账号', '测试连通'],
    `${account.accountNo} 店铺管理页签`
  );
  assert(!storeTabText.includes('新增站点'), `${account.accountNo} 店铺管理仍出现“新增站点”旧文案`);

  await page.getByRole('tab', { name: '组织架构' }).click();
  await page.locator('[data-testid="org-tree-board"]').waitFor();
  if (account.accountNo === '毕翠红') {
    await page.waitForFunction(() => document.body.innerText.includes('雷皓'), null, { timeout: 15000 });
  }
  await page.getByText(account.accountNo).first().waitFor();
  const orgText = await assertBodyIncludes(page, [account.accountNo], `${account.accountNo} 组织架构页签`);
  if (account.accountNo === '毕翠红') {
    assert(orgText.includes('雷皓'), '毕翠红组织架构应展示项目授权成员雷皓');
    assert(orgText.includes('郭瑶'), '毕翠红组织架构应展示生产修复后的下级郭瑶');
    assert(orgText.includes('韩雨'), '毕翠红组织架构应展示项目授权成员韩雨');
    assert(orgText.includes('陆文欢'), '毕翠红组织架构应展示生产补齐账号陆文欢');
  }
  if (account.accountNo === '马天龙') {
    assert(orgText.includes('雷皓'), '马天龙组织架构应展示直属/下级成员雷皓');
  }

  await page.getByRole('tab', { name: '权限总览' }).click();
  await assertBodyIncludes(page, ['权限总览', '老板'], `${account.accountNo} 权限总览页签`);
}

async function verifyRealAccount(browser, account) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 }
  });
  page.setDefaultTimeout(15000);

  const session = await login(page, account.accountNo);
  assert.equal(session.roleName, '老板', `${account.accountNo} 应为老板角色`);
  assert.equal(session.storeCount, account.expectedProjectStoreCount, `${account.accountNo} 项目店铺数不匹配`);
  assert.equal(session.authorizedStoreCount, account.expectedProjectStoreCount, `${account.accountNo} 授权项目店铺数不匹配`);
  assert.equal(session.userStores.length, account.expectedSiteStoreCount, `${account.accountNo} 站点店铺数不匹配`);
  assert(
    ['/purchase/order', '/product/manage', '/user/role', '/purchase/profit'].includes(new URL(page.url()).pathname),
    `${account.accountNo} 登录落点异常：${new URL(page.url()).pathname}`
  );

  await verifyRoleAssignmentShell(page, account);

  const sidebarMenuTitles = await page.locator('.ant-menu .ant-menu-title-content').allTextContents();
  assert(!sidebarMenuTitles.includes('系统管理'), `${account.accountNo} 不应看到系统管理菜单`);
  assert(!sidebarMenuTitles.includes('账号管理'), `${account.accountNo} 不应看到账号管理菜单`);

  await page.close();
  return {
    accountNo: account.accountNo,
    userId: session.userId,
    roleName: session.roleName,
    storeCount: session.storeCount,
    siteStoreCount: session.userStores.length,
    currentStore: `${session.currentStore.orgName}/${session.currentStore.storeCode}/${session.currentStore.site}`,
    grantedMenus: session.grantedMenus?.length ?? 0
  };
}

async function verifyGlobalStoreAndSiteSwitch(browser) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 }
  });
  page.setDefaultTimeout(15000);

  await login(page, '马天龙');
  await page.locator('.ant-select-selector').first().waitFor();
  const selectCount = await page.locator('.ant-select-selector').count();
  assert(selectCount >= 2, `右上角应同时存在店铺和站点选择器，实际 ${selectCount} 个`);

  const before = await readSessionFromPage(page);
  assert.equal(before.currentStore.site, 'AE', '马天龙默认当前站点应为 AE');

  await page.locator('.ant-select-selector').nth(1).click();
  await page.locator('.ant-select-item-option[title="SA"]').last().click();
  await page.waitForFunction(
    (storageKey) => JSON.parse(window.localStorage.getItem(storageKey) || '{}').currentStore?.site === 'SA',
    SESSION_STORAGE_KEY,
    { timeout: 15000 }
  );
  const afterSite = await readSessionFromPage(page);
  assert.equal(afterSite.currentStore.site, 'SA', '站点切换后 currentStore.site 应为 SA');

  await page.locator('.ant-select-selector').nth(0).click();
  await page.locator('.ant-select-item-option').filter({ hasText: 'JU LANG' }).first().click();
  await page.waitForFunction(
    (storageKey) => JSON.parse(window.localStorage.getItem(storageKey) || '{}').currentStore?.orgName === 'JU LANG',
    SESSION_STORAGE_KEY,
    { timeout: 15000 }
  );
  const afterStore = await readSessionFromPage(page);
  assert.equal(afterStore.currentStore.orgName, 'JU LANG', '店铺切换后 currentStore.orgName 应为 JU LANG');
  assert.equal(afterStore.currentStore.site, 'SA', '切换店铺时应尽量保留当前站点 SA');

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    (storageKey) => JSON.parse(window.localStorage.getItem(storageKey) || '{}').currentStore?.orgName === 'JU LANG',
    SESSION_STORAGE_KEY,
    { timeout: 15000 }
  );
  const afterReload = await readSessionFromPage(page);
  assert.equal(afterReload.currentStore.orgName, 'JU LANG', '刷新后店铺选择应持久化');
  assert.equal(afterReload.currentStore.site, 'SA', '刷新后站点选择应持久化');

  await page.close();
  return {
    before: `${before.currentStore.orgName}/${before.currentStore.storeCode}/${before.currentStore.site}`,
    afterSite: `${afterSite.currentStore.orgName}/${afterSite.currentStore.storeCode}/${afterSite.currentStore.site}`,
    afterStore: `${afterStore.currentStore.orgName}/${afterStore.currentStore.storeCode}/${afterStore.currentStore.site}`,
    afterReload: `${afterReload.currentStore.orgName}/${afterReload.currentStore.storeCode}/${afterReload.currentStore.site}`
  };
}

async function verifyAdminDevSessionPages(browser) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 }
  });
  page.setDefaultTimeout(15000);

  await page.goto(`${baseUrl}/user/manage?devSession=1`, { waitUntil: 'domcontentloaded' });
  await page.getByText('账号管理').first().waitFor();
  await assertBodyIncludes(page, ['账号管理', '商家姓名', '毕翠红', '马天龙'], '管理员账号管理页');

  await page.goto(`${baseUrl}/system/role?devSession=1&grantSystemRole=1`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '新增角色' }).waitFor();
  await assertBodyIncludes(page, ['角色管理', '新增角色', '系统管理员', '老板', '运营主管'], '管理员角色管理页');

  await page.goto(`${baseUrl}/system/menu?devSession=1`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('按菜单名称搜索').waitFor();
  await page.getByPlaceholder('按菜单名称搜索').fill('用户管理');
  await page.waitForFunction(() => document.body.innerText.includes('/api/user/manage'), null, { timeout: 15000 });
  await assertBodyIncludes(page, ['菜单维护', '用户管理', '/api/user/manage'], '管理员菜单维护页');

  await page.close();
  return ['user/manage', 'system/role', 'system/menu'];
}

async function verifyMasterDataApiDetails() {
  const bootstrap = await fetchJson('/api/system/bootstrap');
  assert.equal(bootstrap.database?.ready, true, 'bootstrap database.ready 应为 true');
  assert(
    bootstrap.database?.initScripts?.includes('classpath:db/init/010_align_core_tables_to_online_schema.sql'),
    'bootstrap initScripts 应包含 010 对齐脚本'
  );

  const merchantUsers = await fetchJson('/api/master-data/users?operatorRoleLevel=0&view=merchant');
  assert.equal(merchantUsers.length, 6, '超管商家视图应展示 6 个老板账号');
  assert(findById(merchantUsers, 307), '商家视图缺少毕翠红');
  assert(findById(merchantUsers, 308), '商家视图缺少马天龙');
  assert(findById(merchantUsers, 10002), '商家视图缺少星耀测试店老板账号');
  assert(!findById(merchantUsers, 312), '商家视图不应展示运营主管雷皓');

  const bicuithongDetail = await fetchJson('/api/master-data/user-detail?userId=307');
  assert.equal(bicuithongDetail.roleName, '老板', '毕翠红详情角色应为老板');
  assert.equal(bicuithongDetail.storeLinks.length, 4, '毕翠红详情项目店铺数应为 4');

  const matianlongDetail = await fetchJson('/api/master-data/user-detail?userId=308');
  assert.equal(matianlongDetail.roleName, '老板', '马天龙详情角色应为老板');
  assert.equal(matianlongDetail.storeLinks.length, 16, '马天龙详情项目店铺数应为 16');

  const assignStoresPayload = {
    operatorUserId: ADMIN_OPERATOR_ID,
    storeCodes: ['PRJ108065']
  };
  await requestJson('/api/master-data/users/338/assign-stores', {
    method: 'POST',
    body: assignStoresPayload
  });

  const bicuithongTeam = await fetchJson('/api/master-data/users?operatorUserId=307&operatorRoleLevel=1&view=team');
  assert(bicuithongTeam.length >= 4, '毕翠红团队视图应至少展示项目授权成员和生产补齐成员');
  assert.equal(findById(bicuithongTeam, 312)?.storeCount, 2, '毕翠红视角下雷皓应只关联 2 个项目店铺');
  assert(findById(bicuithongTeam, 313), '毕翠红团队视图应展示生产修复后的郭瑶');
  assert.equal(findById(bicuithongTeam, 320)?.storeCount, 1, '毕翠红视角下韩雨应只关联 1 个项目店铺');
  assert.equal(findById(bicuithongTeam, 338)?.storeCount, 1, '毕翠红视角下陆文欢应关联 canman 1 个项目店铺');
  await requestJson('/api/master-data/users/338/assign-stores', {
    method: 'POST',
    body: assignStoresPayload
  });

  const bicuithongOrgTree = await fetchJson('/api/master-data/org-tree?operatorUserId=307&operatorRoleLevel=1');
  const bicuithongOrgNodes = flattenOrgNodes(bicuithongOrgTree);
  const bicuithongRoot = findById(bicuithongOrgNodes, 307);
  const guoyaoNode = findById(bicuithongOrgNodes, 313);
  assert(bicuithongRoot?.children?.some((node) => node.id === 313), '毕翠红组织架构应把郭瑶挂在毕翠红下');
  assert(bicuithongRoot?.children?.some((node) => node.id === 338), '毕翠红组织架构应把陆文欢挂在毕翠红下');
  assert(guoyaoNode?.children?.some((node) => node.id === 320), '毕翠红组织架构应保留郭瑶 -> 韩雨关系');

  const matianlongTeam = await fetchJson('/api/master-data/users?operatorUserId=308&operatorRoleLevel=1&view=team');
  assert(findById(matianlongTeam, 312), '马天龙团队视图应展示雷皓');
  assert(!findById(matianlongTeam, 313), '马天龙团队视图不应展示毕翠红链路下的郭瑶');
  assert(!findById(matianlongTeam, 307), '马天龙团队视图不应展示毕翠红');

  const matianlongOrgTree = await fetchJson('/api/master-data/org-tree?operatorUserId=308&operatorRoleLevel=1');
  const matianlongOrgNodes = flattenOrgNodes(matianlongOrgTree);
  assert(findById(matianlongOrgNodes, 308), '马天龙组织架构应包含自己');
  assert(findById(matianlongOrgNodes, 312), '马天龙组织架构应包含雷皓');
  assert(!findById(matianlongOrgNodes, 313), '马天龙组织架构不应包含毕翠红链路下的郭瑶');
  assert(!findById(matianlongOrgNodes, 307), '马天龙组织架构不应包含毕翠红');

  const roles = await fetchJson('/api/master-data/roles');
  assert.equal(roles.length, 6, '角色列表应为老系统 6 个基础角色');
  for (const roleName of ['系统管理员', '老板', '运营主管', '运营', '采购', '仓管']) {
    assert(roles.some((role) => role.name === roleName), `角色列表缺少 ${roleName}`);
  }

  const menus = await fetchJson('/api/master-data/menus');
  assert.equal(menus.length, 25, '菜单列表应为老系统 25 个菜单');
  assert(menus.some((menu) => menu.name === '用户管理' && menu.urlPath === '/api/user/manage'), '菜单列表缺少用户管理');
  assert(menus.some((menu) => menu.name === '角色分配' && menu.urlPath === '/api/user/role'), '菜单列表缺少角色分配');

  const storeOverview = await fetchJson('/api/store-sync/overview?ownerUserId=307');
  assert.equal(storeOverview.ready, true, '毕翠红店铺管理 overview 应 ready');
  assert.equal(storeOverview.summary?.totalStores, 4, '毕翠红店铺管理项目店铺数应为 4');
  assert.equal(storeOverview.summary?.totalSiteStores, 6, '毕翠红店铺管理站点数应排除 chenwu 非当前授权站点后为 6');
  assert.equal(storeOverview.summary?.connectedStores, 4, '毕翠红店铺管理已连通项目店铺数应按生产 user_project 为 4');
  assert.equal(storeOverview.summary?.connectedSiteStores, 6, '毕翠红店铺管理已连通站点数应排除 chenwu 非当前授权站点后为 6');
  assert(storeOverview.stores.every((store) => store.noonUser), '毕翠红 4 个项目店铺都应展示生产 user_project 的 Noon 用户名');
  assert(storeOverview.stores.some((store) => store.projectCode === 'PRJ108065' && store.noonUser), '毕翠红 canman 应展示项目级 Noon 用户名');
  assert(storeOverview.stores.some((store) => store.managers?.some((manager) => manager.id === 338)), 'canman 负责人应包含陆文欢');

  const connection = await fetchJson('/api/store-sync/test-connection?ownerUserId=308&storeCode=PRJ346391');
  assert.equal(connection.checkMode, 'NOON_WHOAMI', '连通测试必须走 Noon WHOAMI 真实校验');
  assert(
    Number(connection.noonRequestTotalCount ?? 0) >= 1,
    '连通测试必须实际发起 Noon WHOAMI 请求，不能只读本地绑定状态'
  );
  assert.equal(typeof connection.connected, 'boolean', '连通测试应返回真实布尔结果');

  const invalidLogin = await requestJson('/api/auth/login', {
    method: 'POST',
    expectedStatus: 400,
    body: {
      accountNo: '毕翠红',
      password: 'wrong-password'
    }
  });
  assert.equal(invalidLogin.status, 400, '错误密码登录应返回 400');

  const invalidToggle = await requestJson('/api/master-data/users/307/toggle-status', {
    method: 'POST',
    expectedStatus: 400,
    body: {
      status: 2,
      operatorUserId: 307
    }
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

async function verifySystemCrudApiDetails() {
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
    body: {
      name: menuName,
      parentId: 5,
      urlPath: menuPath,
      operatorUserId: ADMIN_OPERATOR_ID
    }
  });
  let menus = await fetchJson('/api/master-data/menus');
  const createdMenu = menus.find((menu) => menu.name === menuName && menu.urlPath === menuPath);
  assert(createdMenu, '新增菜单后列表中应能找到临时菜单');

  await requestJson(`/api/master-data/menus/${createdMenu.id}`, {
    method: 'PUT',
    body: {
      name: updatedMenuName,
      parentId: 5,
      urlPath: updatedMenuPath,
      operatorUserId: ADMIN_OPERATOR_ID
    }
  });
  menus = await fetchJson('/api/master-data/menus');
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
      operatorUserId: ADMIN_OPERATOR_ID,
      menuIds: [10, 25, createdMenu.id]
    }
  });
  let roles = await fetchJson('/api/master-data/roles');
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
      operatorUserId: ADMIN_OPERATOR_ID,
      menuIds: [25]
    }
  });
  roles = await fetchJson('/api/master-data/roles');
  const updatedRole = roles.find((role) => role.id === createdRole.id);
  assert.equal(updatedRole?.name, updatedRoleName, '更新角色后名称应变化');
  assert.deepEqual(updatedRole?.menuIds, [25], '更新角色后菜单范围应收敛到角色分配');

  await requestJson(`/api/master-data/roles/${createdRole.id}?operatorUserId=${ADMIN_OPERATOR_ID}`, {
    method: 'DELETE'
  });
  roles = await fetchJson('/api/master-data/roles');
  assert(!roles.some((role) => role.id === createdRole.id), '删除角色后临时角色不应再出现在列表中');

  await requestJson(`/api/master-data/menus/${createdMenu.id}`, {
    method: 'DELETE'
  });
  menus = await fetchJson('/api/master-data/menus');
  assert(!menus.some((menu) => menu.id === createdMenu.id), '删除菜单后临时菜单不应再出现在列表中');

  const protectedRoleDelete = await requestJson(`/api/master-data/roles/1?operatorUserId=${ADMIN_OPERATOR_ID}`, {
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

console.log(`step: resolve base url -> ${baseUrl}`);
const health = await fetchJson('/actuator/health');
assert.equal(health.status, 'UP', '后端健康检查不是 UP');

const browser = await chromium.launch({
  executablePath,
  headless: true
});

try {
  console.log('step: verify master-data api details');
  const apiDetails = await verifyMasterDataApiDetails();

  const notes = [];
  let realAccounts = 'skipped';
  let globalSwitch = 'skipped';
  if (REAL_ACCOUNT_PASSWORD) {
    console.log('step: verify real legacy accounts');
    realAccounts = [];
    for (const account of [
      { accountNo: '毕翠红', expectedProjectStoreCount: 4, expectedSiteStoreCount: 8 },
      { accountNo: '马天龙', expectedProjectStoreCount: 16, expectedSiteStoreCount: 32 }
    ]) {
      realAccounts.push(await verifyRealAccount(browser, account));
    }

    console.log('step: verify global store/site switch');
    globalSwitch = await verifyGlobalStoreAndSiteSwitch(browser);
  } else {
    notes.push('未设置 MASTER_DATA_REAL_ACCOUNT_PASSWORD，真实账号登录和真实会话下的店铺/站点切换用例已跳过。');
  }

  console.log('step: verify admin devSession management pages');
  const adminPages = await verifyAdminDevSessionPages(browser);

  console.log('step: verify system settings crud api details');
  const systemCrud = await verifySystemCrudApiDetails();

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        health,
        apiDetails,
        realAccounts,
        globalSwitch,
        adminPages,
        systemCrud,
        notes
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
