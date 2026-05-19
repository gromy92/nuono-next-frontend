import type { ColumnsType } from 'antd/es/table';
import { formatSnapshotValue } from '../utils';

export const warehouseStockColumns: ColumnsType<Record<string, unknown>> = [
  {
    title: '仓库',
    dataIndex: 'warehouseCode',
    key: 'warehouseCode',
    render: (value: unknown, record: Record<string, unknown>) => formatSnapshotValue(value ?? record.warehouse)
  },
  {
    title: '类型',
    dataIndex: 'stockType',
    key: 'stockType',
    width: 120,
    render: (value: unknown) => formatSnapshotValue(value)
  },
  {
    title: '最后更新时间',
    dataIndex: 'lastStockUpdate',
    key: 'lastStockUpdate',
    width: 180,
    render: (value: unknown) => formatSnapshotValue(value)
  },
  {
    title: '调拨中',
    dataIndex: 'stockTransferred',
    key: 'stockTransferred',
    width: 160,
    render: (value: unknown) => formatSnapshotValue(value)
  },
  {
    title: '预留库存',
    dataIndex: 'stockReserved',
    key: 'stockReserved',
    width: 150,
    render: (value: unknown) => formatSnapshotValue(value)
  },
  {
    title: '可用库存',
    dataIndex: 'netStock',
    key: 'netStock',
    width: 120,
    render: (value: unknown) => formatSnapshotValue(value)
  }
];
