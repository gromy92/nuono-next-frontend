import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { withPublicBasePath } from '../../runtimePaths';
import { legacySectionIcon, type SidebarMenuItem } from './SidebarNavigation';
import type { AppMenuKey } from './WorkspaceRouting';

const { Sider } = Layout;

type ShellSidebarProps = {
  activeMenuKey: AppMenuKey;
  activeSidebarRootKey?: string;
  items: SidebarMenuItem[];
  openKeys: string[];
  onMenuClick: MenuProps['onClick'];
  onMouseLeave: () => void;
  onOpenKeysChange: (keys: string[]) => void;
};

function effectiveSelectedMenuKey(activeMenuKey: AppMenuKey) {
  return activeMenuKey === 'user-store-noon' ? 'user-role' : activeMenuKey;
}

export function ShellSidebar({
  activeMenuKey,
  activeSidebarRootKey,
  items,
  openKeys,
  onMenuClick,
  onMouseLeave,
  onOpenKeysChange
}: ShellSidebarProps) {
  const selectedMenuKey = effectiveSelectedMenuKey(activeMenuKey);

  return (
    <Sider width={48} theme="light" className="nuono-shell-sidebar-rail" onMouseLeave={onMouseLeave}>
      <div className="nuono-shell-sidebar-rail-inner">
        <div className="nuono-shell-sidebar-rail-logo" aria-hidden="true" />
        <div className="nuono-shell-sidebar-rail-items">
          {items.map((item) => {
            const isActive = item.key === activeSidebarRootKey || item.children?.some((child) => child.key === selectedMenuKey);
            const labelText = typeof item.label === 'string' ? item.label : item.key;
            return (
              <span
                key={item.key}
                className={`nuono-shell-sidebar-rail-item${isActive ? ' nuono-shell-sidebar-rail-item-active' : ''}`}
                title={labelText}
                aria-label={labelText}
                onMouseEnter={() => {
                  if (item.children?.length) {
                    onOpenKeysChange([item.key]);
                  }
                }}
              >
                {item.icon ?? legacySectionIcon()}
              </span>
            );
          })}
        </div>
      </div>
      <div className="nuono-shell-sidebar-popover">
        <div className="nuono-shell-sidebar-popover-logo">
          <img src={withPublicBasePath('/logo-title.png')} alt="诺诺管家" />
        </div>
        <div className="nuono-shell-sidebar-popover-menu">
          <Menu
            data-testid="sidebar-menu"
            theme="light"
            mode="inline"
            selectedKeys={[selectedMenuKey]}
            openKeys={openKeys}
            onOpenChange={(keys) => onOpenKeysChange(keys as string[])}
            items={items}
            onClick={onMenuClick}
          />
        </div>
      </div>
    </Sider>
  );
}
