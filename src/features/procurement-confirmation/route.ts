import { PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH } from './constants';

export type RequirementRoute =
  | { page: 'list' }
  | { page: 'detail'; demandId: string };

export function parseRequirementRoute(pathname: string): RequirementRoute {
  const normalized = pathname.replace(/\/+$/, '');
  if (!normalized || normalized === PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH) {
    return { page: 'list' };
  }
  if (normalized === `${PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH}/list`) {
    return { page: 'list' };
  }
  if (normalized.startsWith(`${PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH}/detail/`)) {
    return {
      page: 'detail',
      demandId: normalized.slice(`${PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH}/detail/`.length)
    };
  }
  return { page: 'list' };
}

export function buildRequirementRoutePath(route: RequirementRoute) {
  if (route.page === 'list') {
    return `${PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH}/list`;
  }
  return `${PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH}/detail/${route.demandId}`;
}

export function navigateRequirementRoute(route: RequirementRoute, replace = false) {
  if (typeof window === 'undefined') {
    return;
  }
  const nextPath = buildRequirementRoutePath(route);
  if (replace) {
    window.history.replaceState({}, '', nextPath);
  } else {
    window.history.pushState({}, '', nextPath);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function isProcurementRequirementConfirmationPath(pathname: string) {
  return pathname.startsWith(PROCUREMENT_REQUIREMENT_CONFIRMATION_BASE_PATH);
}
