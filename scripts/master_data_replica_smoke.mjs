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
  verifyMasterDataApiDetails,
  verifySystemCrudApiDetails
} from './master_data_replica_api_scenarios.mjs';

const requestJson = createMasterDataRequestJson(5000);

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

console.log(`step: resolve base url -> ${baseUrl}`);
const health = await requestJson('/actuator/health');
assert.equal(health.status, 'UP', '后端健康检查不是 UP');

const browser = await chromium.launch({
  executablePath,
  headless: true
});

try {
  console.log('step: verify master-data api details');
  const apiDetails = await verifyMasterDataApiDetails({
    adminOperatorId: ADMIN_OPERATOR_ID,
    requestJson
  });

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
  const systemCrud = await verifySystemCrudApiDetails({
    adminOperatorId: ADMIN_OPERATOR_ID,
    requestJson
  });

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
