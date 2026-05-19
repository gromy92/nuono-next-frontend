import type { ReactNode } from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';

export type WorkspaceTabItem = {
  key: string;
  label: ReactNode;
  closable: boolean;
};

type WorkspaceTabsBarProps = {
  activeKey: string;
  items: WorkspaceTabItem[];
  onChange: (key: string) => void;
  onEdit: NonNullable<TabsProps['onEdit']>;
  renderSingle?: boolean;
};

export function WorkspaceTabsBar({ activeKey, items, onChange, onEdit, renderSingle = false }: WorkspaceTabsBarProps) {
  if (items.length <= 1 && !renderSingle) {
    return null;
  }

  const canCloseTab = items.length > 1;

  return (
    <div
      data-testid="workspace-tabs-bar"
      className="nuono-workspace-tabs"
      style={{
        marginBottom: 10,
        borderBottom: '1px solid #e5e7eb',
        background: '#ffffff'
      }}
    >
      <Tabs
        type="editable-card"
        size="small"
        hideAdd
        activeKey={activeKey}
        onChange={onChange}
        onEdit={onEdit}
        tabBarGutter={4}
        style={{ marginBottom: 0 }}
        items={items.map((item) => ({
          key: item.key,
          label: item.label,
          closable: canCloseTab && item.closable
        }))}
      />
    </div>
  );
}
