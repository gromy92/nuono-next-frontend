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
  const { method = 'GET', body, expectedStatus = 200 } = options;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000)
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

async function assertMasterDataReady() {
  const bootstrap = await requestJson('/api/system/bootstrap');
  assert.equal(bootstrap.database?.ready, true, '主数据页面验收需要 local-db 数据库 ready=true');

  const usersResponse = await fetch(`${baseUrl}/api/master-data/users?operatorRoleLevel=0&view=merchant`, {
    signal: AbortSignal.timeout(8000)
  });
  const text = await usersResponse.text();
  assert.equal(
    usersResponse.status,
    200,
    `主数据接口未就绪：GET /api/master-data/users 返回 ${usersResponse.status}: ${text.slice(0, 300)}`
  );
}

function tid(name) {
  return `[data-testid="${name}"]`;
}

async function bodyText(page) {
  return page.locator('body').innerText();
}

async function assertBodyIncludes(page, expectedTexts, context) {
  const text = await bodyText(page);
  for (const expectedText of expectedTexts) {
    assert(text.includes(expectedText), `${context} 缺少：${expectedText}`);
  }
  return text;
}

async function fillByTestId(page, testId, value) {
  const root = page.locator(tid(testId)).last();
  await root.waitFor();
  const input = root.locator('input, textarea').first();
  if (await input.count()) {
    await input.fill(value);
    return;
  }
  await root.fill(value);
}

async function clickByTestId(page, testId, options = {}) {
  await page.locator(tid(testId)).first().click(options);
}

async function closeActiveModal(page) {
  const visibleModal = page.locator('.ant-modal-wrap:visible').last();
  if (!(await visibleModal.count())) {
    return;
  }
  const closeButton = visibleModal.locator('.ant-modal-close').first();
  if (await closeButton.count()) {
    await closeButton.click();
    await visibleModal.waitFor({ state: 'hidden', timeout: 15000 });
  }
}

async function waitForBoard(page, testId) {
  await page.locator(tid(testId)).waitFor({ timeout: 15000 });
}

async function openDevSession(page, path) {
  const join = path.includes('?') ? '&' : '?';
  const extra = [
    path.startsWith('/user/role') ? 'devRole=boss&grantRoleAssignment=1' : '',
    path.startsWith('/system/role') ? 'grantSystemRole=1' : ''
  ].filter(Boolean).map((item) => `&${item}`).join('');
  await page.goto(`${baseUrl}${path}${join}devSession=1${extra}`, { waitUntil: 'domcontentloaded' });
  await page.locator(tid('sidebar-menu')).waitFor({ timeout: 15000 });
}

async function readSessionFromPage(page) {
  return page.evaluate((storageKey) => {
    const rawValue = window.localStorage.getItem(storageKey);
    return rawValue ? JSON.parse(rawValue) : null;
  }, SESSION_STORAGE_KEY);
}

async function verifyLoginAndLogout(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.setDefaultTimeout(15000);

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  await page.locator(tid('auth-page-login')).waitFor();
  assert(new URL(page.url()).pathname === '/login' || await page.locator(tid('login-form')).isVisible(), '未登录访问 / 应进入登录页');

  await fillByTestId(page, 'login-username-input', '不存在的测试账号');
  await fillByTestId(page, 'login-password-input', 'wrong-password');
  await clickByTestId(page, 'login-submit-button');
  await page.locator(tid('login-error-alert')).waitFor();

  await page.goto(`${baseUrl}/login/register`, { waitUntil: 'domcontentloaded' });
  await page.locator(tid('auth-page-register')).waitFor();
  await assertBodyIncludes(page, ['欢迎注册'], '注册占位页');

  await page.goto(`${baseUrl}/login/reset-pwd`, { waitUntil: 'domcontentloaded' });
  await page.locator(tid('auth-page-reset-pwd')).waitFor();
  await assertBodyIncludes(page, ['重置密码'], '重置密码占位页');

  let realLogin = 'skipped';
  if (REAL_ACCOUNT_PASSWORD) {
    await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
    await fillByTestId(page, 'login-username-input', '马天龙');
    await fillByTestId(page, 'login-password-input', REAL_ACCOUNT_PASSWORD);
    await clickByTestId(page, 'login-submit-button');
    await page.waitForFunction(() => !window.location.pathname.startsWith('/login'), null, { timeout: 15000 });
    const session = await readSessionFromPage(page);
    assert.equal(session?.accountNo, '马天龙', '真实账号登录后 session.accountNo 应匹配');
    await page.locator(tid('global-store-switch')).waitFor();
    await clickByTestId(page, 'user-avatar-menu-button');
    await clickByTestId(page, 'logout-button');
    await clickByTestId(page, 'logout-confirm-submit-button');
    await page.locator(tid('login-form')).waitFor();
    const afterLogout = await readSessionFromPage(page);
    assert.equal(afterLogout, null, '退出登录后应清除本地会话');
    realLogin = 'passed';
  }

  await page.close();
  return { realLogin };
}

async function verifyGlobalStoreSwitch(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.setDefaultTimeout(15000);

  await openDevSession(page, '/user/role');
  await page.locator(tid('global-store-switch')).waitFor();
  const storeSelectVisible = await page.locator(tid('global-store-select')).isVisible();
  const siteSelectVisible = await page.locator(tid('global-site-select')).isVisible();
  assert(storeSelectVisible, '右上角应展示店铺切换器');
  assert(siteSelectVisible, '右上角应展示站点切换器');

  const before = await readSessionFromPage(page);
  await page.locator(tid('global-site-select')).click();
  const visibleSiteOptions = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option');
  const siteOptionTexts = (await visibleSiteOptions.allTextContents()).map((item) => item.trim()).filter(Boolean);
  const targetSite = siteOptionTexts.find((item) => item !== before.currentStore.site) ?? siteOptionTexts[0];
  assert(targetSite, '站点下拉应至少有一个可选项');
  await visibleSiteOptions.filter({ hasText: targetSite }).first().click();
  await page.waitForFunction(
    ([storageKey, expectedSite]) => JSON.parse(window.localStorage.getItem(storageKey) || '{}').currentStore?.site === expectedSite,
    [SESSION_STORAGE_KEY, targetSite],
    { timeout: 15000 }
  );

  const afterSite = await readSessionFromPage(page);
  await page.goto(`${baseUrl}/user/role`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    ([storageKey, expectedSite]) => JSON.parse(window.localStorage.getItem(storageKey) || '{}').currentStore?.site === expectedSite,
    [SESSION_STORAGE_KEY, targetSite],
    { timeout: 15000 }
  );
  const afterReload = await readSessionFromPage(page);

  await page.close();
  return {
    before: `${before.currentStore.orgName}/${before.currentStore.storeCode}/${before.currentStore.site}`,
    afterSite: `${afterSite.currentStore.orgName}/${afterSite.currentStore.storeCode}/${afterSite.currentStore.site}`,
    afterReload: `${afterReload.currentStore.orgName}/${afterReload.currentStore.storeCode}/${afterReload.currentStore.site}`
  };
}

async function verifyAccountManagement(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.setDefaultTimeout(15000);

  await openDevSession(page, '/user/manage');
  await waitForBoard(page, 'master-data-board-user-account');
  await page.locator(tid('user-table')).waitFor();
  await assertBodyIncludes(page, ['账号管理', '商家姓名', '毕翠红', '马天龙'], '账号管理页');

  await fillByTestId(page, 'user-search-input', '毕翠红');
  await assertBodyIncludes(page, ['毕翠红'], '账号管理搜索');

  await page.locator(tid('user-detail-button')).first().click();
  await page.locator(tid('merchant-store-table')).waitFor();
  await assertBodyIncludes(page, ['毕翠红 的店铺', '店铺名称', '修改额度'], '账号管理店铺展开行');
  await page.locator(tid('merchant-store-table')).locator('button').filter({ hasText: '修改额度' }).first().click();
  await page.locator(tid('quota-form')).waitFor();
  await clickByTestId(page, 'quota-cancel-button');

  await page.locator(tid('user-payment-button')).first().click();
  await page.locator(tid('payment-table')).waitFor();
  await clickByTestId(page, 'payment-create-button');
  await page.locator(tid('payment-form')).waitFor();
  await clickByTestId(page, 'payment-cancel-button');
  await closeActiveModal(page);

  await clickByTestId(page, 'user-create-button');
  await page.locator(tid('user-form')).waitFor();
  await clickByTestId(page, 'user-submit-button');
  await page.locator(tid('user-form')).waitFor();
  await clickByTestId(page, 'user-cancel-button');

  await page.close();
  return { checked: ['table', 'search', 'store-expand-row', 'quota-modal', 'payment-modal', 'create-validation'] };
}

async function verifyRoleAssignment(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.setDefaultTimeout(15000);

  await openDevSession(page, '/user/role');
  await page.locator(tid('role-management-tabs')).waitFor();
  await waitForBoard(page, 'master-data-board-user-role');
  await assertBodyIncludes(page, ['角色分配', '店铺管理', '组织架构', '权限总览'], '角色分配页');

  await fillByTestId(page, 'role-user-search-input', '雷皓');
  await assertBodyIncludes(page, ['雷皓'], '角色分配搜索');
  await page.locator(tid('role-assign-select')).first().waitFor();
  await page.locator(tid('store-assign-button')).first().click();
  await page.locator(tid('store-assignment-form')).waitFor();
  await clickByTestId(page, 'store-assignment-cancel-button');

  await page.getByRole('tab', { name: '店铺管理' }).click();
  await page.locator(tid('store-management-board')).waitFor();
  await assertBodyIncludes(page, ['店铺管理', '创建店铺', '修改账号', '测试连通'], '店铺管理页签');
  const storeText = await bodyText(page);
  assert(!storeText.includes('新增站点'), '店铺管理页签不应出现“新增站点”旧文案');
  assert(storeText.includes('店铺Code'), '店铺管理表格应按最新老系统列结构展示“店铺Code”列');

  const stableConnectionButton = page.locator(
    `${tid('store-test-connection-button')}[data-store-code="PRJ346391"]:not([disabled])`
  );
  const availableConnectionButtons = page.locator(`${tid('store-test-connection-button')}:not([disabled])`);
  assert((await availableConnectionButtons.count()) > 0, '店铺管理页签缺少可点击的测试连通按钮');
  if ((await stableConnectionButton.count()) > 0) {
    await stableConnectionButton.first().click();
  } else {
    await availableConnectionButtons.first().click();
  }
  await page.locator(tid('store-test-connection-feedback')).waitFor();
  await page.waitForFunction(
    (selector) => {
      const element = document.querySelector(selector);
      const text = element?.textContent || '';
      return text.includes('连接正常') || text.includes('连接失败') || text.includes('重新绑定账号');
    },
    tid('store-test-connection-feedback'),
    { timeout: 45000 }
  );
  const connectionFeedback = await page.locator(tid('store-test-connection-feedback')).innerText();
  assert(connectionFeedback.includes('连接'), `测试连通点击后未出现有效反馈：${connectionFeedback}`);

  await clickByTestId(page, 'store-create-button');
  await page.locator(tid('store-create-form')).waitFor();
  await clickByTestId(page, 'store-create-submit-button');
  await page.locator(tid('store-create-form')).waitFor();
  await clickByTestId(page, 'store-create-cancel-button');

  await page.getByRole('tab', { name: '组织架构' }).click();
  await page.locator(tid('org-tree-board')).waitFor();
  await assertBodyIncludes(page, ['组织架构'], '组织架构页签');

  await page.getByRole('tab', { name: '权限总览' }).click();
  await page.locator(tid('permission-overview-board')).waitFor();
  await page.locator(tid('permission-overview-table')).waitFor();
  await assertBodyIncludes(page, ['权限总览'], '权限总览页签');

  await page.close();
  return { checked: ['role-table', 'search', 'store-assignment-modal', 'store-tab', 'store-test-connection', 'org-tab', 'permission-tab'] };
}

async function cleanupSystemFixtures(suffix) {
  const [roles, menus] = await Promise.all([
    requestJson('/api/master-data/roles'),
    requestJson('/api/master-data/menus')
  ]);

  for (const role of roles.filter((item) => item.code === `PAGE_ACCEPT_${suffix}`)) {
    await requestJson(`/api/master-data/roles/${role.id}?operatorUserId=${ADMIN_OPERATOR_ID}`, { method: 'DELETE' });
  }
  for (const menu of menus.filter((item) => item.name.includes(suffix) || item.urlPath?.includes(suffix))) {
    await requestJson(`/api/master-data/menus/${menu.id}`, { method: 'DELETE' });
  }
}

async function verifySystemSettingsCrud(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.setDefaultTimeout(15000);

  const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
  const menuName = `页面验收菜单${suffix}`;
  const updatedMenuName = `页面验收菜单更新${suffix}`;
  const menuPath = `/page-acceptance/${suffix}`;
  const roleName = `页面验收角色${suffix}`;
  const updatedRoleName = `页面验收角色更新${suffix}`;
  const roleCode = `PAGE_ACCEPT_${suffix}`;

  try {
    await openDevSession(page, '/system/menu');
    await waitForBoard(page, 'master-data-board-system-menu');
    await assertBodyIncludes(page, ['菜单维护', '新增菜单'], '菜单维护页');

    await fillByTestId(page, 'menu-search-input', '用户管理');
    await assertBodyIncludes(page, ['用户管理', '/api/user/manage'], '菜单维护搜索');

    await clickByTestId(page, 'menu-create-button');
    await page.locator(tid('menu-form')).waitFor();
    await fillByTestId(page, 'menu-name-input', menuName);
    await fillByTestId(page, 'menu-url-path-input', menuPath);
    await clickByTestId(page, 'menu-submit-button');
    await fillByTestId(page, 'menu-search-input', menuName);
    await page.getByText(menuName).waitFor({ timeout: 15000 });

    await page.locator('tr').filter({ hasText: menuName }).locator(tid('menu-edit-button')).click();
    await page.locator(tid('menu-form')).waitFor();
    await fillByTestId(page, 'menu-name-input', updatedMenuName);
    await clickByTestId(page, 'menu-submit-button');
    await fillByTestId(page, 'menu-search-input', updatedMenuName);
    await page.getByText(updatedMenuName).waitFor({ timeout: 15000 });

    await openDevSession(page, '/system/role');
    await waitForBoard(page, 'master-data-board-system-role');
    await assertBodyIncludes(page, ['角色管理', '新增角色', '系统管理员', '老板'], '角色管理页');

    const protectedDeleteDisabled = await page.locator('tr').filter({ hasText: '系统管理员' }).locator(tid('role-delete-button')).first().isDisabled();
    assert.equal(protectedDeleteDisabled, true, '系统预设角色删除按钮应禁用');

    await clickByTestId(page, 'role-create-button');
    await page.locator(tid('role-form')).waitFor();
    await fillByTestId(page, 'role-name-input', roleName);
    await fillByTestId(page, 'role-code-input', roleCode);
    await fillByTestId(page, 'role-description-input', '页面功能验收临时角色');
    await fillByTestId(page, 'role-level-input', '3');
    await clickByTestId(page, 'role-submit-button');
    await page.getByText(roleName).waitFor({ timeout: 15000 });

    await page.locator('tr').filter({ hasText: roleName }).locator(tid('role-edit-button')).click();
    await page.locator(tid('role-form')).waitFor();
    await fillByTestId(page, 'role-name-input', updatedRoleName);
    await clickByTestId(page, 'role-submit-button');
    await page.getByText(updatedRoleName).waitFor({ timeout: 15000 });

    const rolesAfterUpdate = await requestJson('/api/master-data/roles');
    const createdRole = rolesAfterUpdate.find((role) => role.code === roleCode);
    assert(createdRole, '页面新增/编辑角色后 API 应能找到临时角色');
    await requestJson(`/api/master-data/roles/${createdRole.id}?operatorUserId=${ADMIN_OPERATOR_ID}`, { method: 'DELETE' });
    const rolesAfterDelete = await requestJson('/api/master-data/roles');
    assert(!rolesAfterDelete.some((role) => role.code === roleCode), '临时角色删除后不应留在角色列表');

    await openDevSession(page, '/system/menu');
    await fillByTestId(page, 'menu-search-input', updatedMenuName);
    const menusAfterUpdate = await requestJson('/api/master-data/menus');
    const createdMenu = menusAfterUpdate.find((menu) => menu.name === updatedMenuName && menu.urlPath === menuPath);
    assert(createdMenu, '页面新增/编辑菜单后 API 应能找到临时菜单');
    await requestJson(`/api/master-data/menus/${createdMenu.id}`, { method: 'DELETE' });
    const menusAfterDelete = await requestJson('/api/master-data/menus');
    assert(!menusAfterDelete.some((menu) => menu.id === createdMenu.id), '临时菜单删除后不应留在菜单列表');

    await page.close();
    return { roleCode, menuPath };
  } finally {
    await cleanupSystemFixtures(suffix).catch((error) => {
      console.warn(`cleanup skipped: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
}

console.log(`step: resolve base url -> ${baseUrl}`);
const health = await requestJson('/actuator/health');
assert.equal(health.status, 'UP', '后端健康检查不是 UP');
await assertMasterDataReady();

const browser = await chromium.launch({
  executablePath,
  headless: process.env.HEADLESS !== '0'
});

try {
  console.log('step: login, placeholder pages, logout');
  const login = await verifyLoginAndLogout(browser);

  console.log('step: global store/site switch');
  const globalSwitch = await verifyGlobalStoreSwitch(browser);

  console.log('step: account management page');
  const accountManagement = await verifyAccountManagement(browser);

  console.log('step: role assignment, store management, org, permission overview');
  const roleAssignment = await verifyRoleAssignment(browser);

  console.log('step: system role/menu page crud');
  const systemSettings = await verifySystemSettingsCrud(browser);

  console.log(
    JSON.stringify(
      {
        ok: true,
        baseUrl,
        health,
        login,
        globalSwitch,
        accountManagement,
        roleAssignment,
        systemSettings,
        notes: REAL_ACCOUNT_PASSWORD
          ? []
          : ['未设置 MASTER_DATA_REAL_ACCOUNT_PASSWORD，真实账号成功登录/退出用例已跳过；错误登录和 devSession 页面验收已执行。']
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
