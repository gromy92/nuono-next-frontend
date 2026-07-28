import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState
} from 'react';
import type { AppMenuKey } from './routeDefinitions';

export type WorkspaceOwnedTab = {
  key: string;
  parentMenuKey: AppMenuKey;
  pathLabel?: string;
  label: ReactNode;
  closable: boolean;
  onClose: () => Promise<void> | void;
};

export type WorkspaceOwnedTabsController = ReturnType<typeof useWorkspaceOwnedTabsController>;

export function useWorkspaceOwnedTabsController(params: {
  setActiveMenuKey: (key: AppMenuKey) => void;
  syncWorkspacePathForMenuKey: (key: AppMenuKey) => void;
}) {
  const { setActiveMenuKey, syncWorkspacePathForMenuKey } = params;
  const [tabs, setTabs] = useState<WorkspaceOwnedTab[]>([]);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const [activeOwnedTabKey, setActiveOwnedTabKey] = useState<string | null>(null);

  const registerOwnedTab = useCallback((tab: WorkspaceOwnedTab) => {
    setTabs((current) => {
      const index = current.findIndex((item) => item.key === tab.key);
      if (index < 0) return [...current, tab];
      const existing = current[index];
      if (
        existing.parentMenuKey === tab.parentMenuKey &&
        existing.label === tab.label &&
        existing.closable === tab.closable &&
        existing.onClose === tab.onClose
      ) {
        return current;
      }
      return current.map((item) => item.key === tab.key ? tab : item);
    });
  }, []);

  const unregisterOwnedTab = useCallback((key: string) => {
    setTabs((current) => current.filter((tab) => tab.key !== key));
    setActiveOwnedTabKey((current) => current === key ? null : current);
  }, []);

  const activateOwnedTab = useCallback((key: string) => {
    const tab = tabsRef.current.find((item) => item.key === key);
    if (!tab) return;
    setActiveOwnedTabKey(key);
    setActiveMenuKey(tab.parentMenuKey);
    syncWorkspacePathForMenuKey(tab.parentMenuKey);
  }, [setActiveMenuKey, syncWorkspacePathForMenuKey]);

  const openOwnedTab = useCallback((tab: WorkspaceOwnedTab) => {
    registerOwnedTab(tab);
    setActiveOwnedTabKey(tab.key);
    setActiveMenuKey(tab.parentMenuKey);
    syncWorkspacePathForMenuKey(tab.parentMenuKey);
  }, [registerOwnedTab, setActiveMenuKey, syncWorkspacePathForMenuKey]);

  const activateParentMenu = useCallback((menuKey: AppMenuKey) => {
    setActiveOwnedTabKey((current) => {
      const activeTab = tabsRef.current.find((tab) => tab.key === current);
      return activeTab?.parentMenuKey === menuKey ? null : current;
    });
    setActiveMenuKey(menuKey);
    syncWorkspacePathForMenuKey(menuKey);
  }, [setActiveMenuKey, syncWorkspacePathForMenuKey]);

  const requestCloseOwnedTab = useCallback(async (key: string) => {
    const tab = tabsRef.current.find((item) => item.key === key);
    if (!tab) return;
    await tab.onClose();
  }, []);

  return {
    activeOwnedTabKey,
    activateOwnedTab,
    activateParentMenu,
    openOwnedTab,
    registerOwnedTab,
    requestCloseOwnedTab,
    tabs,
    unregisterOwnedTab
  };
}

const WorkspaceOwnedTabsContext = createContext<WorkspaceOwnedTabsController | null>(null);

export function WorkspaceOwnedTabsProvider(props: {
  children: ReactNode;
  controller: WorkspaceOwnedTabsController;
}) {
  return (
    <WorkspaceOwnedTabsContext.Provider value={props.controller}>
      {props.children}
    </WorkspaceOwnedTabsContext.Provider>
  );
}

export function useWorkspaceOwnedTabs() {
  const value = useContext(WorkspaceOwnedTabsContext);
  if (!value) throw new Error('useWorkspaceOwnedTabs must be used inside WorkspaceOwnedTabsProvider');
  return value;
}
