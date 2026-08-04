import { expect, test } from '@playwright/test';
import { assignmentTargetOptions, authorizedWorkbench, clickAssignmentTarget, missingFieldDetail, missingFieldWorkbench, noAuthorizationWorkbench, mockAliHistoricalOrderDefaults, storeSyncOverview, syncedWorkbench } from './ali1688-historical-orders.fixtures';

test.beforeEach(async ({ page }) => mockAliHistoricalOrderDefaults(page));

test('boss can open product link entry before assigning product line', async ({ page }) => {
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  workbench.orders[0].items = [workbench.orders[0].items[1]];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  const row = page.getByText('跨境B6复古五角星锁心本').locator('xpath=ancestor::tr');
  const productCell = row.locator('.ali1688-product-line-main');
  await expect(productCell.getByText('分配信息 未分配')).toBeVisible();
  await expect(productCell.getByRole('button', { name: '分配店铺' })).toHaveCount(0);
  await expect(productCell.getByRole('button', { name: '商品关联' })).toHaveCount(0);
  const actionButton = productCell.getByRole('button', { name: '分配/关联' });
  await expect(actionButton).toBeVisible();
  await expect(actionButton).toBeEnabled();
  await actionButton.click();
  const dialog = page.getByRole('dialog', { name: '分配/关联' });
  await expect(dialog.getByText('保存分配后选择店铺商品。')).toHaveCount(0);
  await expect(assignmentTargetOptions(dialog).getByRole('button', { name: 'canman AE' })).toBeVisible();
  await expect(dialog.getByRole('combobox', { name: '目标店铺' })).toHaveCount(0);
});

test('historical order product image border reflects product and store assignment state', async ({ page }) => {
  const workbench = JSON.parse(JSON.stringify(syncedWorkbench));
  workbench.orders[0].items = [
    {
      ...workbench.orders[0].items[0],
      id: '94001-LINKED-IMAGE',
      title: '已关联商品图片',
      imageUrl: 'https://example.com/linked-item.jpg',
      assignmentId: undefined,
      assignmentStatus: 'unassigned',
      assignmentStatusLabel: '未分配',
      assignmentTargetType: undefined,
      assignmentTargetStoreCode: undefined,
      assignmentTargetSiteCode: undefined,
      productLink: {
        status: 'linked',
        skuParent: 'CANMAN-AE-SKU-LINKED',
        partnerSku: 'CM-AE-LINKED',
        pskuCode: 'PSKU-CM-AE-LINKED'
      }
    },
    {
      ...workbench.orders[0].items[2],
      id: '94002-STORE-LINKED-IMAGE',
      title: '已分配且已关联商品图片',
      imageUrl: 'https://example.com/store-linked-item.jpg',
      assignmentId: 99002,
      assignmentStatus: 'assigned',
      assignmentStatusLabel: '已分配',
      assignmentTargetType: 'STORE_SITE',
      assignmentTargetStoreCode: 'PRJ108065',
      assignmentTargetSiteCode: 'AE',
      assignmentBreakdownText: 'PRJ108065 AE 8',
      productLink: {
        status: 'linked',
        skuParent: 'CANMAN-AE-SKU-STORE',
        partnerSku: 'CM-AE-STORE',
        pskuCode: 'PSKU-CM-AE-STORE'
      }
    },
    {
      ...workbench.orders[0].items[2],
      id: '94003-STORE-ONLY-IMAGE',
      title: '仅分配店铺商品图片',
      imageUrl: 'https://example.com/store-only-item.jpg',
      assignmentId: 99003,
      assignmentStatus: 'assigned',
      assignmentStatusLabel: '已分配',
      assignmentTargetType: 'STORE_SITE',
      assignmentTargetStoreCode: 'PRJ108065',
      assignmentTargetSiteCode: 'AE',
      assignmentBreakdownText: 'PRJ108065 AE 8',
      productLink: undefined
    }
  ];

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  const productLinkedImage = page.getByRole('img', { name: '已关联商品图片', exact: true });
  await expect(productLinkedImage).toHaveClass(/ali1688-product-line-image--product-linked/);
  await expect(productLinkedImage).toHaveCSS('border-color', 'rgb(34, 197, 94)');

  const assignedAndProductLinkedImage = page.getByRole('img', { name: '已分配且已关联商品图片', exact: true });
  await expect(assignedAndProductLinkedImage).toHaveClass(/ali1688-product-line-image--product-linked/);
  await expect(assignedAndProductLinkedImage).not.toHaveClass(/ali1688-product-line-image--store-linked/);
  await expect(assignedAndProductLinkedImage).toHaveCSS('border-color', 'rgb(34, 197, 94)');

  const assignedStoreOnlyImage = page.getByRole('img', { name: '仅分配店铺商品图片', exact: true });
  await expect(assignedStoreOnlyImage).toHaveClass(/ali1688-product-line-image--store-linked/);
  await expect(assignedStoreOnlyImage).not.toHaveClass(/ali1688-product-line-image--product-linked/);
  await expect(assignedStoreOnlyImage).toHaveCSS('border-color', 'rgb(37, 99, 235)');
});
