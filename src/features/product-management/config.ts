import type { ProductListFilters } from './types';

export const defaultProductListFilters: ProductListFilters = {
  skuQuery: '',
  titleQuery: '',
  brandQuery: '',
  issueFilter: 'all',
  liveFilter: 'all',
  syncFilter: 'all',
  stockFilter: 'all',
  operationStageFilter: 'all'
};
