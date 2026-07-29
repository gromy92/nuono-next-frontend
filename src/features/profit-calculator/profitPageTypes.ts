import type { Key } from 'react'
import type { AuthSessionStore } from '../auth/session'
import type { ProductListRowPayload } from '../product-domain/productListTypes'
import type { OrderFinanceOrderGroup } from '../order-finance/types'
import type { OfficialOutboundFeeCalculationResult } from './domain'
import type { ProfitActualCommissionMap, ProfitActualOutboundFeeMap, ProfitCommissionMap, ProfitListFilters, ProfitOutboundFeeMap, ProfitProductListState } from './profitWorkspaceModel'

export type ProfitCalculatorPageProps = {
  ownerUserId?: number;
  defaultStoreCode?: string;
  defaultSite: string;
  currentStore: AuthSessionStore | null;
  listState: ProfitProductListState;
  filteredRows: ProductListRowPayload[];
  filters: ProfitListFilters;
  selectedRowKeys: Key[];
  outboundFeeByRowKey: ProfitOutboundFeeMap;
  noonOutboundFeeByRowKey: ProfitOutboundFeeMap;
  actualOutboundFeeByRowKey: ProfitActualOutboundFeeMap;
  commissionByRowKey: ProfitCommissionMap;
  actualCommissionByRowKey: ProfitActualCommissionMap;
  actualOutboundFeeLoading: boolean;
  actualCommissionLoading: boolean;
  noonOutboundFeeLoading: boolean;
  calculatingRowKey: string | null;
  calculatingCommissionRowKey: string | null;
  bulkCalculating: boolean;
  bulkCommissionCalculating: boolean;
  onFiltersChange: (filters: ProfitListFilters) => void;
  onSelectedRowKeysChange: (keys: Key[]) => void;
  onRefresh: () => void | Promise<void>;
  onCalculateOutboundFee: (record: ProductListRowPayload) => void | Promise<unknown>;
  onCalculateSelectedOutboundFees: () => void | Promise<void>;
  onCalculateCommission: (record: ProductListRowPayload) => void | Promise<unknown>;
  onCalculateSelectedCommissions: () => void | Promise<void>;
};

export type OutboundFeeDetailState = {
  rowKey: string;
  record: ProductListRowPayload;
  storeCode: string;
  site: string;
  skuId: string;
  dateFrom: string;
  dateTo: string;
  noonOfficialLoading: boolean;
  noonOfficialResult?: OfficialOutboundFeeCalculationResult;
  noonOfficialError?: string;
  historyLoading: boolean;
  historyGroups: OrderFinanceOrderGroup[];
  historyError?: string;
};

export type CommissionDetailState = {
  rowKey: string;
  record: ProductListRowPayload;
  storeCode: string;
  site: string;
  skuId: string;
  dateFrom: string;
  dateTo: string;
  historyLoading: boolean;
  historyGroups: OrderFinanceOrderGroup[];
  historyError?: string;
};
