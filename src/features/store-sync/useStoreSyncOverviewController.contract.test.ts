import type { AuthSession } from '../auth/session';
import { useStoreSyncOverviewController } from './useStoreSyncOverviewController';

function StoreSyncControllerForceContract({ session }: { session: AuthSession | null }) {
  const controller = useStoreSyncOverviewController(session, session);
  void controller.loadStoreSync(307, { force: true, preserveConnectionFeedback: true });
  return null;
}

void StoreSyncControllerForceContract;
