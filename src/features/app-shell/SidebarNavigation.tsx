import type { ReactNode } from 'react'
import {
  BarChartOutlined,
  CalendarOutlined,
  FileTextOutlined,
  HomeOutlined,
  MenuOutlined,
  RobotOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  TruckOutlined
} from '@ant-design/icons'
import {
  WORKSPACE_SECTION_DEFINITIONS,
  shouldShowWorkspaceMenuInSidebar,
  workspaceMenuDefinition,
  type WorkspaceSectionIconKey
} from './WorkspaceMenuRegistry'

export type SidebarMenuItem = {
  key: string
  label: ReactNode
  disabled?: boolean
  icon?: ReactNode
  children?: SidebarMenuItem[]
}

export function legacySectionIcon(icon: ReactNode = <MenuOutlined />) {
  return <span className="nuono-shell-sidebar-menu-icon">{icon}</span>
}

const sectionIconMap: Record<WorkspaceSectionIconKey, ReactNode> = {
  home: <HomeOutlined />,
  product: <ShoppingOutlined />,
  purchase: <ShoppingCartOutlined />,
  logistics: <TruckOutlined />,
  warehouse: <TruckOutlined />,
  campaign: <CalendarOutlined />,
  'operation-config': <SettingOutlined />,
  task: <FileTextOutlined />,
  data: <BarChartOutlined />,
  'noon-call': <BarChartOutlined />,
  'system-report': <BarChartOutlined />,
  user: <TeamOutlined />,
  'ai-model': <RobotOutlined />,
  system: <SettingOutlined />
}

export const workspaceMenuItems: SidebarMenuItem[] = WORKSPACE_SECTION_DEFINITIONS.map((section) => ({
  key: section.key,
  label: section.label,
  icon: legacySectionIcon(sectionIconMap[section.iconKey]),
  disabled: section.disabled,
  children: section.entries
    ?.map((entry) => {
      if (entry.type === 'placeholder') {
        return {
          key: entry.key,
          label: entry.label,
          disabled: entry.disabled
        }
      }
      if (!shouldShowWorkspaceMenuInSidebar(entry.key)) {
        return null
      }
      const definition = workspaceMenuDefinition(entry.key)
      return {
        key: definition.key,
        label: definition.label
      }
    })
    .filter(Boolean) as SidebarMenuItem[] | undefined
}))

export const legacyMenuItems = workspaceMenuItems

export function filterLegacyMenuItemsByAllowedKeys<T extends string>(
  items: SidebarMenuItem[],
  allowedMenuKeySet: ReadonlySet<T>
) {
  return items
    .map((item) => {
      if (item.children?.length) {
        const visibleChildren = item.children.filter(
          (child) => !child.disabled && allowedMenuKeySet.has(child.key as T)
        )
        if (!visibleChildren.length) {
          return null
        }
        return {
          ...item,
          children: visibleChildren
        }
      }
      return !item.disabled && allowedMenuKeySet.has(item.key as T) ? item : null
    })
    .filter(Boolean) as SidebarMenuItem[]
}
