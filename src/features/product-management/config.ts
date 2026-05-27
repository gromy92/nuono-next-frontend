import type { ProductListFilters } from './types';

export const defaultProductListFilters: ProductListFilters = {
  skuQuery: '',
  titleQuery: '',
  brandQuery: '',
  issueFilter: 'all',
  liveFilter: 'all',
  lifecycleFilter: 'all',
  syncFilter: 'all',
  stockFilter: 'all'
};

export const FEATURE_PRODUCT_INSIGHTS_ENABLED = true;
