import { expect, test } from '@playwright/test';
import { assignmentTargetOptions, authorizedWorkbench, clickAssignmentTarget, missingFieldDetail, missingFieldWorkbench, noAuthorizationWorkbench, mockAliHistoricalOrderDefaults, storeSyncOverview, syncedWorkbench } from './ali1688-historical-orders.fixtures';

test.beforeEach(async ({ page }) => mockAliHistoricalOrderDefaults(page));

test('boss can open Excel import entry while operations cannot upload', async ({ page }) => {
  let workbench = noAuthorizationWorkbench;

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/excel-imports/sources**', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');

  await expect(page.getByRole('button', { name: 'Excel 导入' })).toBeVisible();
  await page.getByRole('button', { name: 'Excel 导入' }).click();
  const importDialog = page.getByRole('dialog', { name: 'Excel 导入' });
  await expect(importDialog).toBeVisible();
  await expect(importDialog.getByText('导入目标')).not.toBeVisible();
  await expect(importDialog.getByText('PRJ108065 · AE', { exact: true })).not.toBeVisible();
  await expect(importDialog.getByRole('button', { name: '上传' })).toBeVisible();
  await expect(importDialog.getByText('Excel 来源')).not.toBeVisible();
  await expect(importDialog.getByText('创建来源')).not.toBeVisible();

  workbench = {
    ...noAuthorizationWorkbench,
    roleCapabilities: {
      canAuthorize: false,
      canViewOrders: true
    }
  };
  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=operator&grantAli1688HistoricalOrders=1');
  await expect(page.getByRole('button', { name: 'Excel 导入' })).not.toBeVisible();
});

test('boss can upload and audit a sanitized Excel import without a preview confirmation step', async ({ page }) => {
  let workbench = noAuthorizationWorkbench;

  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: workbench });
  });
  await page.route('**/api/procurement/ali1688-orders/excel-imports/sources**', async (route) => {
    await route.fulfill({
      json: [
        {
          authorizationId: 91008,
          providerCode: 'ALI1688_EXCEL_UPLOAD',
          accountLabel: '沁雪冰菏 Excel 导入',
          storeCode: 'PRJ108065',
          siteCode: 'AE',
          status: 'authorized'
        }
      ]
    });
  });
  await page.route('**/api/procurement/ali1688-orders/excel-imports/preview**', async (route) => {
    await route.fulfill({
      json: {
        batchId: 97001,
        status: 'preview_ready',
        fileName: 'sanitized-1688-order-export.xlsx',
        fileSize: 4096,
        fileHash: 'safe-hash',
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        source: {
          authorizationId: 91008,
          providerCode: 'ALI1688_EXCEL_UPLOAD',
          accountLabel: '沁雪冰菏 Excel 导入'
        },
        headerValidation: {
          valid: true,
          expectedHeaderCount: 49,
          actualHeaderCount: 49
        },
        summary: {
          totalDataRowCount: 3,
          orderHeaderRowCount: 2,
          productLineCount: 3,
          logisticsLineCount: 2,
          validRowCount: 3,
          duplicateCandidateCount: 0
        },
        rowErrors: [],
        rowWarnings: []
      }
    });
  });
  await page.route('**/api/procurement/ali1688-orders/excel-imports/97001/commit**', async (route) => {
    workbench = syncedWorkbench;
    await route.fulfill({
      json: {
        batchId: 97001,
        status: 'committed',
        counts: {
          insertedOrderCount: 2,
          updatedOrderCount: 0,
          skippedOrderCount: 0,
          insertedItemCount: 3,
          updatedItemCount: 0,
          skippedItemCount: 0,
          insertedLogisticsCount: 2,
          updatedLogisticsCount: 0,
          skippedLogisticsCount: 0
        }
      }
    });
  });
  await page.route(/\/api\/procurement\/ali1688-orders\/excel-imports(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      json: [
        {
          batchId: 97001,
          status: 'committed',
          fileName: 'sanitized-1688-order-export.xlsx',
          fileSize: 4096,
          fileHash: 'safe-hash',
          accountLabel: '沁雪冰菏 Excel 导入',
          storeCode: 'PRJ108065',
          siteCode: 'AE',
          productLineCount: 3,
          createdAt: '2026-05-26 12:00:00'
        }
      ]
    });
  });
  await page.route(/\/api\/procurement\/ali1688-orders\/excel-imports\/97001(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      json: {
        batchId: 97001,
        status: 'committed',
        fileName: 'sanitized-1688-order-export.xlsx',
        fileSize: 4096,
        fileHash: 'safe-hash',
        accountLabel: '沁雪冰菏 Excel 导入',
        storeCode: 'PRJ108065',
        siteCode: 'AE',
        headerVersion: 'ali1688_historical_order_export_v1',
        orderHeaderRowCount: 2,
        productLineCount: 3,
        logisticsLineCount: 2,
        validRowCount: 3,
        duplicateCandidateCount: 0,
        errorCount: 0,
        warningCount: 0,
        createdBy: 307,
        createdAt: '2026-05-26 12:00:00',
        errorSummaryJson: '{"rowErrors":0,"rowWarnings":0}'
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.getByRole('button', { name: 'Excel 导入' }).click();
  const importDialog = page.getByRole('dialog', { name: 'Excel 导入' });
  await expect(importDialog).toBeVisible();
  await page.locator('.ant-upload input[type="file"]').setInputFiles({
    name: 'sanitized-1688-order-export.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('sanitized 1688 fixture placeholder')
  });
  await importDialog.getByRole('button', { name: '上传' }).click();

  await expect(importDialog.getByText('导入完成，列表已刷新')).toBeVisible();
  await expect(importDialog.getByText('预览批次 97001')).not.toBeVisible();
  await expect(importDialog.getByRole('button', { name: '确认导入' })).not.toBeVisible();
  await expect(importDialog.getByText('新增货品')).toBeVisible();
  await importDialog.getByRole('button', { name: '关 闭' }).click();

  await expect(page.getByText('ALI-ORDER-20260525-001').first()).toBeVisible();
  await page.getByRole('button', { name: '导入历史' }).click();
  const historyDrawer = page.getByRole('dialog', { name: 'Excel 导入历史' });
  await expect(historyDrawer).toBeVisible();
  await expect(historyDrawer.getByText('sanitized-1688-order-export.xlsx')).toBeVisible();
  await expect(historyDrawer.getByText('safe-hash')).not.toBeVisible();
  await historyDrawer.getByRole('button', { name: '查看详情' }).click();
  await expect(historyDrawer.getByText('safe-hash')).toBeVisible();
  await expect(historyDrawer.getByText('ali1688_historical_order_export_v1')).toBeVisible();
});

test('boss sees safe validation feedback for a wrong Excel template', async ({ page }) => {
  await page.route('**/api/procurement/ali1688-orders/workbench**', async (route) => {
    await route.fulfill({ json: noAuthorizationWorkbench });
  });
  await page.route('**/api/procurement/ali1688-orders/excel-imports/sources**', async (route) => {
    await route.fulfill({
      json: [
        {
          authorizationId: 91008,
          providerCode: 'ALI1688_EXCEL_UPLOAD',
          accountLabel: '沁雪冰菏 Excel 导入',
          storeCode: 'PRJ108065',
          siteCode: 'AE',
          status: 'authorized'
        }
      ]
    });
  });
  await page.route('**/api/procurement/ali1688-orders/excel-imports/preview**', async (route) => {
    await route.fulfill({
      json: {
        batchId: 97002,
        status: 'validation_failed',
        fileName: 'wrong-template.xlsx',
        summary: {
          totalDataRowCount: 0,
          orderHeaderRowCount: 0,
          productLineCount: 0,
          logisticsLineCount: 0,
          validRowCount: 0,
          duplicateCandidateCount: 0
        },
        headerValidation: {
          valid: false,
          expectedHeaderCount: 49,
          actualHeaderCount: 2,
          message: '表头不匹配，请重新导出 1688 历史订单 Excel。',
          mismatchedHeaders: [
            {
              columnIndex: 1,
              expected: '订单编号',
              actual: '错误列'
            }
          ]
        },
        rowErrors: [],
        rowWarnings: []
      }
    });
  });

  await page.goto('/purchase/ali1688-orders?devSession=1&devRole=boss&grantAli1688HistoricalOrders=1');
  await page.getByRole('button', { name: 'Excel 导入' }).click();
  const importDialog = page.getByRole('dialog', { name: 'Excel 导入' });
  await page.locator('.ant-upload input[type="file"]').setInputFiles({
    name: 'wrong-template.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('wrong template placeholder')
  });
  await importDialog.getByRole('button', { name: '上传' }).click();

  await expect(importDialog.getByText('表头不匹配，请重新导出 1688 历史订单 Excel。')).toBeVisible();
  await expect(importDialog.getByText('第 1 列：应为 订单编号，实际为 错误列')).toBeVisible();
  await expect(importDialog.getByRole('button', { name: '确认导入' })).not.toBeVisible();
});
