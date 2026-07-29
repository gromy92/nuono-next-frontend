import { expect, type Page } from '@playwright/test';

const REMOVED_CALENDAR_ITEM_OPTION_LABELS = [
  '节日爆发系数',
  '月度薪酬爆发系数',
  '流行产品衰退系数',
  '流行产品关键词',
  '季节产品'
];

export async function expectRemovedCalendarItemOptionsHidden(page: Page) {
  for (const label of REMOVED_CALENDAR_ITEM_OPTION_LABELS) {
    await expect(page.locator('.ant-select-dropdown').filter({ hasText: label })).toHaveCount(0);
  }
}

export async function setupOperationsConfigScope(page: Page) {
  await page.route('**/api/operations-config/scope**', async (route) => {
    await route.fulfill({
      json: {
        systemAdmin: false,
        roleName: '运营',
        bossOptions: [],
        selectedBossUserIds: [],
        stores: [{ ownerUserId: 307, storeCode: 'STR108065-NAE', siteCode: 'AE' }],
        defaultOwnerUserId: 307,
        defaultStoreCode: 'STR108065-NAE',
        defaultSiteCode: 'AE',
        emptyReason: null
      }
    });
  });
}
