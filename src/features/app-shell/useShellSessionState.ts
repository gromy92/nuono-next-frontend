import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import type { AuthSession } from '../auth/session';
import { currentAppPathname, SESSION_EXPIRED_EVENT, withPublicBasePath } from '../../runtimePaths';
import { isProcurementRequirementConfirmationPath } from '../procurement-confirmation/route';
import { filterLegacyMenuItemsByAllowedKeys, workspaceMenuItems } from './SidebarNavigation';
import {
  PROCUREMENT_REQUIREMENT_DEMO_SESSION,
  readStoredSession,
  SESSION_STORAGE_KEY
} from './ShellSessionStorage';
import {
  type AppMenuKey,
  PURCHASE_ORDER_PATH,
  readInitialWorkspaceMenuKey,
  resolveSessionAllowedMenuKeys,
  resolveSessionLandingMenuKey,
  resolveWorkspaceMenuKeyFromLocation,
  resolveWorkspacePathForMenuKey,
  withCurrentWorkspaceDevQuery
} from './WorkspaceRouting';

export function useShellSessionState() {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());
  const [currentPathname, setCurrentPathname] = useState<string>(() =>
    typeof window === 'undefined' ? PURCHASE_ORDER_PATH : currentAppPathname()
  );
  const [activeMenuKey, setActiveMenuKey] = useState<AppMenuKey>(() => readInitialWorkspaceMenuKey());

  const shouldRenderProcurementRequirementConfirmation =
    isProcurementRequirementConfirmationPath(currentPathname);
  const usingProcurementRequirementDemoSession = shouldRenderProcurementRequirementConfirmation && !session;
  const shellSession = session ?? (usingProcurementRequirementDemoSession ? PROCUREMENT_REQUIREMENT_DEMO_SESSION : null);
  const sessionAllowedMenuKeys = useMemo(
    () =>
      usingProcurementRequirementDemoSession
        ? (['purchase-order'] as AppMenuKey[])
        : resolveSessionAllowedMenuKeys(shellSession),
    [shellSession, usingProcurementRequirementDemoSession]
  );
  const sessionAllowedMenuKeySet = useMemo(() => new Set(sessionAllowedMenuKeys), [sessionAllowedMenuKeys]);
  const visibleWorkspaceMenuItems = useMemo(
    () => filterLegacyMenuItemsByAllowedKeys(workspaceMenuItems, sessionAllowedMenuKeySet),
    [sessionAllowedMenuKeySet]
  );

  const syncWorkspacePathForMenuKey = useCallback((menuKey: AppMenuKey) => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextPath = resolveWorkspacePathForMenuKey(menuKey);
    if (currentAppPathname() === nextPath) {
      return;
    }

    window.history.replaceState({}, '', withCurrentWorkspaceDevQuery(nextPath));
  }, []);

  return {
    activeMenuKey,
    setActiveMenuKey,
    setCurrentPathname,
    session,
    setSession,
    sessionAllowedMenuKeys,
    sessionAllowedMenuKeySet,
    shellSession,
    shouldRenderProcurementRequirementConfirmation,
    syncWorkspacePathForMenuKey,
    usingProcurementRequirementDemoSession,
    visibleWorkspaceMenuItems
  };
}

type UseShellSessionEffectsParams = {
  activeMenuKey: AppMenuKey;
  resetStoreSync: () => void;
  session: AuthSession | null;
  sessionAllowedMenuKeys: AppMenuKey[];
  sessionAllowedMenuKeySet: Set<AppMenuKey>;
  setActiveMenuKey: (menuKey: AppMenuKey) => void;
  setChangePasswordOpen: (open: boolean) => void;
  setCurrentPathname: (pathname: string) => void;
  setLoginError: (message: string | null) => void;
  setLogoutConfirmOpen: (open: boolean) => void;
  setSession: (session: AuthSession | null) => void;
};

export function useShellSessionEffects({
  activeMenuKey,
  resetStoreSync,
  session,
  sessionAllowedMenuKeys,
  sessionAllowedMenuKeySet,
  setActiveMenuKey,
  setChangePasswordOpen,
  setCurrentPathname,
  setLoginError,
  setLogoutConfirmOpen,
  setSession
}: UseShellSessionEffectsParams) {
  const sessionExpiredNotifiedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (session) {
        sessionExpiredNotifiedRef.current = false;
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore localStorage write failures in local preview mode.
    }
  }, [session]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleSessionExpired = () => {
      if (sessionExpiredNotifiedRef.current) {
        return;
      }
      sessionExpiredNotifiedRef.current = true;
      setSession(null);
      setActiveMenuKey('purchase-order');
      setLoginError('登录已过期，请重新登录。');
      resetStoreSync();
      setLogoutConfirmOpen(false);
      setChangePasswordOpen(false);
      try {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // Ignore localStorage write failures in local preview mode.
      }
      if (!currentAppPathname().startsWith('/login')) {
        window.history.replaceState({}, '', withPublicBasePath('/login'));
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      message.warning('登录已过期，请重新登录。');
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [resetStoreSync, setActiveMenuKey, setChangePasswordOpen, setLoginError, setLogoutConfirmOpen, setSession]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncPathname = () => setCurrentPathname(currentAppPathname());
    window.addEventListener('popstate', syncPathname);
    syncPathname();
    return () => window.removeEventListener('popstate', syncPathname);
  }, [setCurrentPathname]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextMenuKey = resolveSessionLandingMenuKey(
      session,
      sessionAllowedMenuKeys,
      activeMenuKey
    );

    if (session && currentAppPathname().startsWith('/login') && nextMenuKey) {
      if (nextMenuKey !== activeMenuKey) {
        setActiveMenuKey(nextMenuKey);
      }
      window.history.replaceState({}, '', withCurrentWorkspaceDevQuery(resolveWorkspacePathForMenuKey(nextMenuKey)));
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, [activeMenuKey, session, sessionAllowedMenuKeys, setActiveMenuKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || !session || !sessionAllowedMenuKeys.length) {
      return;
    }

    const requestedMenuKey = resolveWorkspaceMenuKeyFromLocation(currentAppPathname());
    const effectiveMenuKey = requestedMenuKey ?? activeMenuKey;
    if (sessionAllowedMenuKeySet.has(effectiveMenuKey)) {
      if (requestedMenuKey) {
        if (isProcurementRequirementConfirmationPath(currentAppPathname())) {
          return;
        }
        const canonicalPath = resolveWorkspacePathForMenuKey(requestedMenuKey);
        if (currentAppPathname() !== canonicalPath) {
          window.history.replaceState({}, '', withCurrentWorkspaceDevQuery(canonicalPath));
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
      return;
    }

    const nextMenuKey = resolveSessionLandingMenuKey(session, sessionAllowedMenuKeys, null);
    if (!nextMenuKey) {
      return;
    }

    if (nextMenuKey !== activeMenuKey) {
      setActiveMenuKey(nextMenuKey);
    }
    window.history.replaceState({}, '', withCurrentWorkspaceDevQuery(resolveWorkspacePathForMenuKey(nextMenuKey)));
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [activeMenuKey, session, sessionAllowedMenuKeySet, sessionAllowedMenuKeys, setActiveMenuKey]);
}
