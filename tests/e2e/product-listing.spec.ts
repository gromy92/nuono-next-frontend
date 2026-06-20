import { expect, test } from '@playwright/test';

function productListingSession() {
  return {
    userId: 90003,
    accountNo: 'product-listing-operator',
    realName: '商品上架运营',
    roleId: 5,
    roleName: '运营',
    level: 2,
    bindingStatus: 'PROJECT_BOUND',
    currentStore: {
      id: 301,
      projectCode: 'PRJ245027',
      projectName: 'xingyao',
      storeCode: 'STR245027-NAE',
      site: 'AE',
      authorized: true
    },
    userStores: [
      {
        id: 301,
        projectCode: 'PRJ245027',
        projectName: 'xingyao',
        storeCode: 'STR245027-NAE',
        site: 'AE',
        authorized: true
      }
    ],
    grantedMenus: [
      {
        menuId: 2401,
        menuName: '商品上架',
        urlPath: '/purchase/listing'
      }
    ]
  };
}

test.describe('商品上架', () => {
  test('真实上架确认成功后不能从同一个 dry-run 再次确认', async ({ page }) => {
    let confirmCalls = 0;
    await page.addInitScript((session) => {
      window.localStorage.setItem('nuono-next-session', JSON.stringify(session));
    }, productListingSession());
    await page.route('**/api/product-listing/drafts', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          draftId: 10001,
          draftNo: 'PLD-10001',
          storeCode: 'STR245027-NAE',
          status: 'ready_for_dry_run',
          validationIssues: [],
          draft: {
            draftId: 10001,
            storeCode: 'STR245027-NAE',
            psku: 'E2E-PL-001',
            imageUrls: []
          }
        })
      });
    });
    await page.route('**/api/product-listing/dry-run', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          taskId: 20001,
          taskNo: 'PLT-20001',
          draftId: 10001,
          storeCode: 'STR245027-NAE',
          mode: 'DRY_RUN',
          status: 'validated',
          validationIssues: []
        })
      });
    });
    await page.route('**/api/product-listing/tasks/20001/confirm-real-run', async (route) => {
      confirmCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          taskId: 20002,
          taskNo: 'PLT-20002',
          draftId: 10001,
          storeCode: 'STR245027-NAE',
          mode: 'REAL_RUN',
          status: 'succeeded',
          sourceTaskId: 20001,
          noonResult: {
            success: true,
            steps: [
              {
                stepKey: 'create_product',
                status: 'succeeded',
                externalReference: 'partnerSku=E2E-PL-001'
              },
              {
                stepKey: 'sku_cache',
                status: 'succeeded',
                externalReference: 'skuParent=ZPARENT-E2E;pskuCode=PSKU-E2E-001'
              },
              {
                stepKey: 'upsert_zsku_base',
                status: 'succeeded',
                externalReference: 'skuParent=ZPARENT-E2E'
              },
              {
                stepKey: 'upload_images',
                status: 'succeeded',
                externalReference: 'uploaded=1'
              },
              {
                stepKey: 'upsert_zsku_content_en',
                status: 'succeeded'
              },
              {
                stepKey: 'upsert_zsku_content_ar',
                status: 'succeeded'
              },
              {
                stepKey: 'upsert_price',
                status: 'succeeded'
              },
              {
                stepKey: 'verify_noon_readback',
                status: 'succeeded',
                externalReference: 'readBackAttempts=3;skuParent=ZPARENT-E2E;pskuCode=PSKU-E2E-001'
              }
            ]
          },
          validationIssues: []
        })
      });
    });

    await page.goto('/purchase/listing');
    await page.getByLabel('新增 PSKU', { exact: true }).fill('E2E-PL-001');
    await page.locator('button', { hasText: '提交 dry-run' }).click();
    await expect(page.getByText('真实上架确认', { exact: true })).toBeVisible();
    const confirmButton = page.locator('button', { hasText: '确认真实上架' });

    await confirmButton.click();
    await expect(page.getByText('确认真实上架到 Noon', { exact: true })).toBeVisible();
    await page.locator('.ant-modal button', { hasText: '确认上架' }).click();

    await expect(page.getByText('PLT-20002', { exact: true })).toBeVisible();
    await expect(page.getByText('E2E-PL-001', { exact: true })).toBeVisible();
    await expect(page.getByText('PSKU-E2E-001', { exact: true })).toBeVisible();
    await expect(page.getByText('ZPARENT-E2E', { exact: true })).toBeVisible();
    await expect(page.getByText('3', { exact: true })).toBeVisible();
    await expect(page.getByText('create_product', { exact: true })).toBeVisible();
    await expect(page.getByText('sku_cache', { exact: true })).toBeVisible();
    await expect(page.getByText('upload_images', { exact: true })).toBeVisible();
    await expect(page.getByText('verify_noon_readback', { exact: true })).toBeVisible();
    await expect(confirmButton).toBeDisabled();
    expect(confirmCalls).toBe(1);
  });
});
