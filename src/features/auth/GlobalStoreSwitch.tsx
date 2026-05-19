import { ShopOutlined } from '@ant-design/icons';
import { Select, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo } from 'react';
import type { AuthSession, AuthSessionStore } from './session';

const { Text } = Typography;

const SITE_FLAG_MAP: Record<string, string> = {
  AE: '🇦🇪',
  UAE: '🇦🇪',
  NAE: '🇦🇪',
  SA: '🇸🇦',
  KSA: '🇸🇦',
  NSA: '🇸🇦',
  EG: '🇪🇬',
  EGY: '🇪🇬',
  NEG: '🇪🇬',
  QA: '🇶🇦',
  QAT: '🇶🇦',
  KW: '🇰🇼',
  KWT: '🇰🇼',
  OM: '🇴🇲',
  OMN: '🇴🇲',
  BH: '🇧🇭',
  BHR: '🇧🇭'
};

function siteFlag(site?: string) {
  const normalizedSite = (site || '').trim().toUpperCase().replace(/[^A-Z]/g, '');
  return SITE_FLAG_MAP[normalizedSite] || '';
}

function SiteLabel({ site }: { site?: string }) {
  const label = site || '单站点';
  const flag = siteFlag(site);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, lineHeight: 1 }}>
      {flag ? <span aria-hidden="true">{flag}</span> : null}
      <span>{label}</span>
    </span>
  );
}

function getStoreGroupKey(store: AuthSessionStore) {
  return store.projectCode || store.orgCode || store.projectName || store.storeCode;
}

function getStoreGroupLabel(store: AuthSessionStore) {
  return store.projectName || store.orgName || store.projectCode || store.storeCode;
}

function resolveCurrentStore(session: AuthSession) {
  const stores = Array.isArray(session.userStores) ? session.userStores : [];
  if (!stores.length) {
    return null;
  }
  const currentStoreCode = session.currentStore?.storeCode;
  const currentSite = session.currentStore?.site;
  const matched = stores.find(
    (store) => store.storeCode === currentStoreCode && String(store.site || '') === String(currentSite || '')
  );
  if (matched) {
    return matched;
  }
  return stores.find((store) => store.authorized) || stores[0];
}

function canSwitchStoreGroup(session: AuthSession) {
  if (session.level == null) {
    return true;
  }
  return session.level <= 2;
}

type Props = {
  session: AuthSession;
  onChange: (nextSession: AuthSession) => void;
};

export function GlobalStoreSwitch({ session, onChange }: Props) {
  const stores = useMemo(() => {
    const source = Array.isArray(session.userStores) ? session.userStores : [];
    const seen = new Set<string>();
    return source.filter((store) => {
      const key = `${store.storeCode}-${store.site || ''}`;
      if (!store.storeCode || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [session.userStores]);

  const currentStore = useMemo(() => resolveCurrentStore(session), [session]);
  const storeGroups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; stores: AuthSessionStore[] }>();
    stores.forEach((store) => {
      const groupKey = getStoreGroupKey(store);
      if (!groupKey) {
        return;
      }
      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          label: getStoreGroupLabel(store),
          stores: []
        });
      }
      map.get(groupKey)?.stores.push(store);
    });
    return Array.from(map.values());
  }, [stores]);

  const currentGroup = useMemo(() => {
    if (!currentStore) {
      return storeGroups[0];
    }
    const groupKey = getStoreGroupKey(currentStore);
    return storeGroups.find((group) => group.key === groupKey) || storeGroups[0];
  }, [currentStore, storeGroups]);

  const siteOptions = useMemo(
    () =>
      (currentGroup?.stores || []).map((store) => ({
        label: <SiteLabel site={store.site || '未标注站点'} />,
        value: store.storeCode
      })),
    [currentGroup]
  );

  useEffect(() => {
    if (
      !currentStore ||
      (session.currentStore?.storeCode === currentStore.storeCode && session.currentStore?.site === currentStore.site)
    ) {
      return;
    }
    onChange({
      ...session,
      currentStore
    });
  }, [currentStore, onChange, session]);

  if (!stores.length || !currentStore) {
    return (
      <Space data-testid="global-store-switch-empty" size={6}>
        <ShopOutlined style={{ color: '#16a34a', fontSize: 16 }} />
        <Text type="secondary">暂无店铺</Text>
      </Space>
    );
  }

  return (
    <Space data-testid="global-store-switch" size={8} align="center">
      <Space size={6} align="center">
        <ShopOutlined style={{ color: '#16a34a', fontSize: 16 }} />
        {canSwitchStoreGroup(session) ? (
          <Select
            data-testid="global-store-select"
            size="small"
            variant="borderless"
            style={{ minWidth: 180 }}
            value={currentGroup?.key}
            disabled={storeGroups.length <= 1}
            options={storeGroups.map((group) => ({
              label: group.label,
              value: group.key
            }))}
            onChange={(groupKey) => {
              const targetGroup = storeGroups.find((group) => group.key === groupKey);
              const nextStore = targetGroup?.stores.find((store) => store.site === currentStore.site) || targetGroup?.stores[0];
              if (!nextStore) {
                return;
              }
              onChange({
                ...session,
                currentStore: nextStore
              });
            }}
          />
        ) : (
          <Text style={{ color: '#1f2937', fontSize: 13 }}>{currentGroup?.label || getStoreGroupLabel(currentStore)}</Text>
        )}
      </Space>

      {siteOptions.length > 1 ? (
        <Select
          data-testid="global-site-select"
          size="small"
          variant="borderless"
          style={{ minWidth: 96 }}
          value={currentStore.storeCode}
          options={siteOptions}
          onChange={(storeCode) => {
            const nextStore =
              currentGroup?.stores.find((store) => store.storeCode === storeCode) || currentGroup?.stores[0];
            if (!nextStore) {
              return;
            }
            onChange({
              ...session,
              currentStore: nextStore
            });
          }}
        />
      ) : (
        <Tag style={{ marginInlineEnd: 0, borderRadius: 999, color: '#4b5563' }}>
          <SiteLabel site={currentStore.site} />
        </Tag>
      )}
    </Space>
  );
}
