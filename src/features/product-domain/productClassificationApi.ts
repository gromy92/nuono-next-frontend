import { apiRequestJson } from '../../shared/api';

export type ProductClassificationOptionsRequest = {
  ownerUserId?: number;
  storeCode?: string;
  brandQuery?: string;
  fulltypeQuery?: string;
  limit?: number;
  includeGlobalFulltypes?: boolean;
};

export type ProductClassificationOptionPayload = {
  value?: string;
  label?: string;
  family?: string;
  productType?: string;
  productSubtype?: string;
  usageCount?: number;
};

export type ProductClassificationOptionsResponse = {
  ready: boolean;
  source?: string;
  message?: string;
  warnings: string[];
  brands: ProductClassificationOptionPayload[];
  fulltypes: ProductClassificationOptionPayload[];
};

export function fetchProductClassificationOptions(request: ProductClassificationOptionsRequest) {
  return apiRequestJson<ProductClassificationOptionsResponse>(
    '/api/product-master/classification-options',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    },
    '读取品牌和类目候选失败'
  );
}
