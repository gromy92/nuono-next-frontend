import { expect, test } from '@playwright/test';

type DomesticSpecPatch = {
  ali1688?: Record<string, number | undefined>;
  warehouse?: Record<string, number | undefined>;
  noonOfficial?: Record<string, number | undefined>;
  logisticsProfile?: Record<string, string | boolean | undefined>;
  imageUrl?: string;
};

const completeValues = {
  productLengthCm: 10,
  productWidthCm: 20,
  productHeightCm: 3,
  productWeightG: 120
};

const missingProductValues = {
  productLengthCm: undefined,
  productWidthCm: undefined,
  productHeightCm: undefined,
  productWeightG: undefined
};

function createSpecRow(
  variantId: number,
  partnerSku: string,
  title: string,
  patch: DomesticSpecPatch = {}
) {
  const ali1688 = { ...completeValues, ...(patch.ali1688 || {}) };
  const warehouse = { ...completeValues, ...(patch.warehouse || {}) };
  const noonOfficial = { ...completeValues, ...(patch.noonOfficial || {}) };
  return {
    storeCode: 'STR108065-NAE',
    variantId,
    title,
    imageUrl: patch.imageUrl,
    partnerSku,
    effectiveSourceId: variantId * 10 + 1,
    effectiveSourceType: 'ali1688',
    ...ali1688,
    sources: [
      {
        sourceId: variantId * 10 + 1,
        variantId,
        sourceType: 'ali1688',
        ...ali1688
      },
      {
        sourceId: variantId * 10 + 2,
        variantId,
        sourceType: 'warehouse',
        ...warehouse
      },
      {
        sourceId: variantId * 10 + 3,
        variantId,
        sourceType: 'noon_official',
        ...noonOfficial
      }
    ],
    logisticsProfile: {
      batteryType: 'none',
      electricType: 'none',
      magneticType: 'none',
      liquidType: 'none',
      powderType: 'none',
      woodenMaterialType: 'none',
      bladeWeaponType: 'none',
      manualConfirmRequired: false,
      ...(patch.logisticsProfile || {})
    }
  };
}

async function selectCompletenessFilter(page: import('@playwright/test').Page, label: string) {
  await page.getByTestId('product-specs-completeness-filter').locator('.ant-select-selector').click();
  await page.locator('.ant-select-item-option').filter({ hasText: label }).click();
}

async function selectLogisticsAttributeFilter(page: import('@playwright/test').Page, label: string) {
  const filter = page.getByTestId('product-specs-logistics-attribute-filter');
  await filter.locator('.ant-select-selector').click();
  await page.keyboard.type(label);
  await page.locator('.ant-select-item-option').filter({ hasText: label }).click();
}

test.describe('商品规格', () => {
  test('真实授权店铺账号访问时按业务店铺归一，不按站点拆分规格范围', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'nuono-next-session',
        JSON.stringify({
          userId: 90003,
          accountNo: 'operator-real-store',
          realName: '真实店铺运营',
          roleId: 5,
          roleName: '运营',
          level: 2,
          bindingStatus: 'PROJECT_BOUND',
          currentStore: {
            id: 301,
            projectCode: 'PRJ108065',
            projectName: 'canman',
            storeCode: 'STR108065-NSA',
            site: 'SA',
            authorized: true
          },
          userStores: [
            {
              id: 301,
              projectCode: 'PRJ108065',
              projectName: 'canman',
              storeCode: 'STR108065-NAE',
              site: 'AE',
              authorized: true
            },
            {
              id: 303,
              projectCode: 'PRJ108065',
              projectName: 'canman',
              storeCode: 'STR108065-NSA',
              site: 'SA',
              authorized: true
            },
            {
              id: 302,
              projectCode: 'PRJ999999',
              projectName: '未授权店铺',
              storeCode: 'STR999999-NAE',
              site: 'AE',
              authorized: false
            }
          ],
          grantedMenus: [
            {
              menuId: 9104,
              menuName: '商品规格',
              urlPath: '/product/specs'
            }
          ]
        })
      );
    });
    const requestedOwnerUserIds: Array<string | null> = [];
    const requestedStoreCodes: Array<string | null> = [];
    await page.route('**/api/product-specs?**', async (route) => {
      const url = new URL(route.request().url());
      requestedOwnerUserIds.push(url.searchParams.get('ownerUserId'));
      requestedStoreCodes.push(url.searchParams.get('storeCode'));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ready: true,
          ownerUserId: 307,
          storeCode: 'STR108065-NSA',
          warnings: [],
          items: [createSpecRow(1101, 'REAL-STORE-PSKU', 'Real Store Product')]
        })
      });
    });

    await page.goto('/product/specs');

    await expect(page.getByText('PSKU REAL-STORE-PSKU', { exact: true })).toBeVisible();
    await expect(page.getByRole('main').locator('.ant-select-selector').filter({ hasText: 'canman' })).toHaveCount(0);
    await expect(page.getByRole('table').getByText('canman', { exact: true })).toBeVisible();
    await expect(page.getByText('STR108065-NSA', { exact: true })).toHaveCount(0);
    expect(requestedOwnerUserIds).toEqual([null]);
    expect(requestedStoreCodes).toEqual(['STR108065-NAE']);
  });

  test('支持按 1688、仓管、国内规格、Noon 官方尺寸和物流属性缺失筛选', async ({ page }) => {
    await page.route('**/api/product-specs?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ready: true,
          ownerUserId: 307,
          storeCode: 'STR108065-NAE',
          warnings: [],
          items: [
            createSpecRow(1001, 'COMPLETE-PSKU', 'Complete Spec Product'),
            createSpecRow(1002, 'ALI1688-MISSING-PSKU', '1688 Missing Product', {
              ali1688: { productWidthCm: undefined }
            }),
            createSpecRow(1003, 'WAREHOUSE-MISSING-PSKU', 'Warehouse Missing Product', {
              warehouse: { productWeightG: undefined }
            }),
            createSpecRow(1006, 'DOMESTIC-MISSING-PSKU', 'Domestic Missing Product', {
              ali1688: missingProductValues,
              warehouse: missingProductValues
            }),
            createSpecRow(1004, 'OFFICIAL-MISSING-PSKU', 'Official Missing Product', {
              noonOfficial: { productHeightCm: undefined }
            }),
            createSpecRow(1005, 'LOGISTICS-MISSING-PSKU', 'Logistics Missing Product', {
              logisticsProfile: { magneticType: 'unknown', manualConfirmRequired: true }
            })
          ]
        })
      });
    });

    await page.goto('/product/specs?devSession=1&devRole=boss');

    await expect(page.getByText('共 6 条数据')).toBeVisible();
    await expect(page.getByText('PSKU COMPLETE-PSKU', { exact: true })).toBeVisible();

    await selectCompletenessFilter(page, '1688规格缺失');
    await expect(page.getByText('共 2 条数据')).toBeVisible();
    await expect(page.getByText('PSKU ALI1688-MISSING-PSKU', { exact: true })).toBeVisible();
    await expect(page.getByText('PSKU DOMESTIC-MISSING-PSKU', { exact: true })).toBeVisible();
    await expect(page.getByText('PSKU COMPLETE-PSKU', { exact: true })).toBeHidden();

    await selectCompletenessFilter(page, '仓管规格缺失');
    await expect(page.getByText('共 2 条数据')).toBeVisible();
    await expect(page.getByText('PSKU WAREHOUSE-MISSING-PSKU', { exact: true })).toBeVisible();
    await expect(page.getByText('PSKU DOMESTIC-MISSING-PSKU', { exact: true })).toBeVisible();

    await selectCompletenessFilter(page, '国内规格缺失');
    await expect(page.getByText('共 1 条数据')).toBeVisible();
    await expect(page.getByText('PSKU DOMESTIC-MISSING-PSKU', { exact: true })).toBeVisible();

    await selectCompletenessFilter(page, 'Noon官方尺寸缺失');
    await expect(page.getByText('共 1 条数据')).toBeVisible();
    await expect(page.getByText('PSKU OFFICIAL-MISSING-PSKU', { exact: true })).toBeVisible();

    await selectCompletenessFilter(page, '物流属性缺失');
    await expect(page.getByText('共 1 条数据')).toBeVisible();
    await expect(page.getByText('PSKU LOGISTICS-MISSING-PSKU', { exact: true })).toBeVisible();
  });

  test('支持按每个物流属性筛选商品', async ({ page }) => {
    await page.route('**/api/product-specs?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ready: true,
          ownerUserId: 307,
          storeCode: 'STR108065-NAE',
          warnings: [],
          items: [
            createSpecRow(1201, 'BATTERY-YES-PSKU', 'Battery Product', {
              logisticsProfile: { batteryType: 'battery_equipment' }
            }),
            createSpecRow(1202, 'ELECTRIC-YES-PSKU', 'Electric Product', {
              logisticsProfile: { electricType: 'electric_equipment_review' }
            }),
            createSpecRow(1203, 'MAGNETIC-YES-PSKU', 'Magnetic Product', {
              logisticsProfile: { magneticType: 'magnetic' }
            }),
            createSpecRow(1204, 'LIQUID-YES-PSKU', 'Liquid Product', {
              logisticsProfile: { liquidType: 'liquid' }
            }),
            createSpecRow(1205, 'POWDER-YES-PSKU', 'Powder Product', {
              logisticsProfile: { powderType: 'powder' }
            }),
            createSpecRow(1206, 'WOODEN-YES-PSKU', 'Wooden Product', {
              logisticsProfile: { woodenMaterialType: 'wooden_material_review' }
            }),
            createSpecRow(1207, 'BLADE-YES-PSKU', 'Blade Product', {
              logisticsProfile: { bladeWeaponType: 'blade_tool_review' }
            })
          ]
        })
      });
    });

    await page.goto('/product/specs?devSession=1&devRole=boss');

    const filterCases = [
      ['带电：带电', 'BATTERY-YES-PSKU'],
      ['电器：电器', 'ELECTRIC-YES-PSKU'],
      ['磁性：带磁', 'MAGNETIC-YES-PSKU'],
      ['液体：液体', 'LIQUID-YES-PSKU'],
      ['粉末：粉末', 'POWDER-YES-PSKU'],
      ['木材：木材', 'WOODEN-YES-PSKU'],
      ['刀具：刀具', 'BLADE-YES-PSKU']
    ] as const;

    for (const [filterLabel, expectedSku] of filterCases) {
      await selectLogisticsAttributeFilter(page, filterLabel);
      await expect(page.getByText('共 1 条数据')).toBeVisible();
      await expect(page.getByText(`PSKU ${expectedSku}`, { exact: true })).toBeVisible();
    }
  });

  test('物流属性保留全部属性、分 3 行展示、去掉字段标题，并按确认状态显示红黄框，商品图为 70x90', async ({ page }) => {
    const savePayloads: unknown[] = [];
    await page.route('**/api/product-specs?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ready: true,
          ownerUserId: 307,
          storeCode: 'STR108065-NAE',
          warnings: [],
          items: [
            createSpecRow(
              1001,
              'MAGNETIC-CHECK-PSKU',
              'Magnetic Check Product With A Long Product Detail Title That Needs Three Lines',
              {
                imageUrl:
                  'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2280%22 height%3D%2280%22%3E%3Crect width%3D%2280%22 height%3D%2280%22 fill%3D%22%230f766e%22%2F%3E%3C%2Fsvg%3E',
                logisticsProfile: { magneticType: 'unknown', manualConfirmRequired: true }
              }
            )
          ]
        })
      });
    });
    await page.route('**/api/product-logistics-profiles/*', async (route) => {
      const payload = await route.request().postDataJSON();
      savePayloads.push(payload);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...payload,
          variantId: 1001
        })
      });
    });

    await page.goto('/product/specs?devSession=1&devRole=boss');

    const thumbBox = await page.getByTestId('product-spec-thumb-1001').boundingBox();
    expect(Math.round(thumbBox?.width || 0)).toBe(70);
    expect(Math.round(thumbBox?.height || 0)).toBe(90);

    const titleBox = await page.getByTestId('product-spec-title-1001').boundingBox();
    expect(titleBox?.height || 0).toBeGreaterThanOrEqual(44);
    expect(titleBox?.height || 0).toBeLessThanOrEqual(54);

    await expect(page.getByRole('columnheader', { name: 'Noon官方尺寸' })).toHaveCount(0);
    await expect(page.getByTestId('product-specs-source-noon_official-1001')).toBeVisible();
    await expect(page.getByTestId('product-specs-spec-cell-noon_official-productLengthCm-1001')).toBeVisible();
    await expect(page.getByTestId('product-specs-spec-cell-noon_official-productWidthCm-1001')).toBeVisible();
    await expect(page.getByTestId('product-specs-spec-cell-noon_official-productHeightCm-1001')).toBeVisible();
    await expect(page.getByTestId('product-specs-spec-cell-noon_official-productWeightG-1001')).toBeVisible();
    await expect(page.getByTestId('product-specs-spec-cell-noon_official-cartonLengthCm-1001')).toHaveCount(0);
    await expect(page.getByTestId('product-specs-spec-cell-noon_official-cartonWidthCm-1001')).toHaveCount(0);
    await expect(page.getByTestId('product-specs-spec-cell-noon_official-cartonHeightCm-1001')).toHaveCount(0);
    await expect(page.getByTestId('product-specs-spec-cell-noon_official-cartonWeightKg-1001')).toHaveCount(0);
    await expect(page.getByTestId('product-specs-spec-cell-noon_official-cartonQuantity-1001')).toHaveCount(0);

    const domesticSpecBox = await page
      .getByTestId('product-specs-spec-cell-ali1688-productLengthCm-1001')
      .boundingBox();
    expect(domesticSpecBox?.width || 0).toBeGreaterThanOrEqual(45);
    expect(domesticSpecBox?.width || 0).toBeLessThanOrEqual(50);

    await expect(page.getByTestId('product-specs-logistics-select-batteryType-1001')).toBeVisible();
    await expect(page.getByTestId('product-specs-logistics-select-electricType-1001')).toBeVisible();
    await expect(page.getByTestId('product-specs-logistics-select-magneticType-1001')).toBeVisible();
    await expect(page.getByTestId('product-specs-logistics-select-liquidType-1001')).toBeVisible();
    await expect(page.getByTestId('product-specs-logistics-select-powderType-1001')).toBeVisible();
    await expect(page.getByTestId('product-specs-logistics-select-woodenMaterialType-1001')).toBeVisible();
    await expect(page.getByTestId('product-specs-logistics-select-bladeWeaponType-1001')).toBeVisible();
    await expect(page.locator('.product-specs-logistics-title')).toHaveCount(0);
    const logisticSelectBoxes = await Promise.all(
      [
        'batteryType',
        'electricType',
        'magneticType',
        'liquidType',
        'powderType',
        'woodenMaterialType',
        'bladeWeaponType'
      ].map(async (field) => page.getByTestId(`product-specs-logistics-select-${field}-1001`).boundingBox())
    );
    expect(logisticSelectBoxes[0]?.width || 0).toBeGreaterThanOrEqual(72);
    expect(logisticSelectBoxes[0]?.width || 0).toBeLessThanOrEqual(82);
    const rowTops = Array.from(new Set(logisticSelectBoxes.map((box) => Math.round(box?.y || 0))));
    expect(rowTops).toHaveLength(3);

    const batterySelect = page.getByTestId('product-specs-logistics-select-batteryType-1001');
    await expect(batterySelect.locator('.ant-select-arrow')).toBeHidden();
    await expect(batterySelect).toHaveClass(/product-specs-logistics-select--none/);
    await expect(batterySelect.locator('.ant-select-selector')).toHaveCSS('background-color', 'rgb(255, 253, 244)');
    await expect(batterySelect.locator('.ant-select-selection-item')).toHaveCSS('color', 'rgb(107, 114, 128)');

    const magneticSelect = page.getByTestId('product-specs-logistics-select-magneticType-1001');
    await expect(magneticSelect.locator('.ant-select-arrow')).toBeHidden();
    await expect(magneticSelect).toHaveClass(/product-specs-logistics-select--missing/);
    await expect(magneticSelect.locator('.ant-select-selector')).toHaveCSS('border-color', 'rgb(248, 113, 113)');
    await magneticSelect.locator('.ant-select-selector').click();
    await expect(page.locator('.ant-select-item-option').filter({ hasText: '磁性' })).toBeVisible();
    await expect(page.locator('.ant-select-item-option').filter({ hasText: '不带磁' })).toBeVisible();
    await page.getByTitle('带磁', { exact: true }).click();
    await expect(magneticSelect).toHaveClass(/product-specs-logistics-select--confirmed/);
    await expect(magneticSelect).toHaveClass(/product-specs-logistics-select--included/);
    await expect(magneticSelect.locator('.ant-select-selector')).toHaveCSS('background-color', 'rgb(255, 253, 244)');
    await expect(magneticSelect.locator('.ant-select-selector')).toHaveCSS('border-color', 'rgb(180, 83, 9)');
    await expect(magneticSelect.locator('.ant-select-selection-item')).toHaveCSS('color', 'rgb(107, 114, 128)');
    expect(savePayloads).toEqual([expect.objectContaining({ magneticType: 'magnetic' })]);
  });
});
