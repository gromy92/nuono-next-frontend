import type { Page } from '@playwright/test';

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

export const missingProductValues = {
  productLengthCm: undefined,
  productWidthCm: undefined,
  productHeightCm: undefined,
  productWeightG: undefined
};

export function createSpecRow(
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

export async function selectCompletenessFilter(page: Page, label: string) {
  await page.getByTestId('product-specs-completeness-filter').locator('.ant-select-selector').click();
  await page.locator('.ant-select-item-option').filter({ hasText: label }).click();
}

export async function selectLogisticsAttributeFilter(page: Page, label: string) {
  const filter = page.getByTestId('product-specs-logistics-attribute-filter');
  await filter.locator('.ant-select-selector').click();
  await page.keyboard.type(label);
  await page.locator('.ant-select-item-option').filter({ hasText: label }).click();
}
