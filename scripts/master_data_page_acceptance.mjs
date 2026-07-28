import assert from 'node:assert/strict';
import process from 'node:process';
import { chromium } from 'playwright-core';
import {
  ADMIN_OPERATOR_ID,
  assertBodyIncludes,
  baseUrl,
  createMasterDataRequestJson,
  executablePath,
  readSessionFromPage,
  REAL_ACCOUNT_PASSWORD,
  SESSION_STORAGE_KEY
} from './master_data_smoke_support.mjs';
import {
  clickByTestId,
  closeActiveModal,
  fillByTestId,
  openDevSession,
  tid,
  waitForBoard
} from './master_data_page_driver.mjs';
import { verifySystemSettingsCrudScenario } from './master_data_page_system_settings_scenario.mjs';

const requestJson = createMasterDataRequestJson(8000);

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
  const systemSettings = await verifySystemSettingsCrudScenario({
    adminOperatorId: ADMIN_OPERATOR_ID,
    browser,
    requestJson
  });

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
