import assert from 'node:assert/strict';
import {
  clickByTestId,
  fillByTestId,
  openDevSession,
  tid,
  waitForBoard
} from './master_data_page_driver.mjs';
import { assertBodyIncludes } from './master_data_smoke_support.mjs';

export async function verifySystemSettingsCrudScenario({
  adminOperatorId,
  browser,
  requestJson
}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  page.setDefaultTimeout(15000);

  const suffix = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
  const menuName = `页面验收菜单${suffix}`;
  const updatedMenuName = `页面验收菜单更新${suffix}`;
  const menuPath = `/page-acceptance/${suffix}`;
  const roleName = `页面验收角色${suffix}`;
  const updatedRoleName = `页面验收角色更新${suffix}`;
  const roleCode = `PAGE_ACCEPT_${suffix}`;

  async function cleanupFixtures() {
    const [roles, menus] = await Promise.all([
      requestJson('/api/master-data/roles'),
      requestJson('/api/master-data/menus')
    ]);
    for (const role of roles.filter((item) => item.code === roleCode)) {
      await requestJson(`/api/master-data/roles/${role.id}?operatorUserId=${adminOperatorId}`, { method: 'DELETE' });
    }
    for (const menu of menus.filter((item) => item.name.includes(suffix) || item.urlPath?.includes(suffix))) {
      await requestJson(`/api/master-data/menus/${menu.id}`, { method: 'DELETE' });
    }
  }

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
    await requestJson(`/api/master-data/roles/${createdRole.id}?operatorUserId=${adminOperatorId}`, { method: 'DELETE' });
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
    await cleanupFixtures().catch((error) => {
      console.warn(`cleanup skipped: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
}
