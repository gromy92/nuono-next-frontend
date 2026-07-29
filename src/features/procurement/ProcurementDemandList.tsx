import { Button, Space, Tag } from 'antd';
import {
  procurementDemandDisplayTitle,
  procurementItemStatusMeta
} from './domain';
import type { ProcurementDemandItem } from './types';

export function ProcurementDemandList({
  demandItems,
  selectedDemandItemId,
  onSelectDemandItem
}: {
  demandItems: ProcurementDemandItem[];
  selectedDemandItemId?: number;
  onSelectDemandItem: (demandItemId: number) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>采购需求</div>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        {demandItems.map((item) => {
          const selected = selectedDemandItemId === item.id;
          const itemStatusMeta = procurementItemStatusMeta(item.status);
          return (
            <div
              key={item.id}
              style={{
                padding: 12,
                borderRadius: 10,
                border: selected ? '1px solid #0f766e' : '1px solid #dbe4ea',
                background: selected ? '#f0fdf4' : '#ffffff'
              }}
            >
              <Space size={[8, 8]} wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: '#0f172a', fontWeight: 600, marginBottom: 6 }}>
                    {procurementDemandDisplayTitle(item)}
                  </div>
                  <div style={{ color: '#475569', fontSize: 13 }}>
                    目标价 {item.targetPriceMin?.toFixed(2)} - {item.targetPriceMax?.toFixed(2)} · 目标量 {item.targetQuantity} · 站点 {item.targetSite || '-'}
                  </div>
                </div>
                <Space size={[8, 8]} wrap>
                  <Tag color={itemStatusMeta.color} style={{ marginInlineEnd: 0 }}>
                    {itemStatusMeta.label}
                  </Tag>
                  <Button
                    type={selected ? 'primary' : 'default'}
                    onClick={() => onSelectDemandItem(item.id)}
                  >
                    {selected ? '当前需求' : '查看需求'}
                  </Button>
                </Space>
              </Space>
            </div>
          );
        })}
      </Space>
    </div>
  );
}
