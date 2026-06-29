import type { AuthSession } from '../auth/session';
import { useStoreSyncController } from './useStoreSyncController';

function StoreSyncControllerForceContract({ session }: { session: AuthSession | null }) {
  const controller = useStoreSyncController(session, session);
  void controller.loadStoreSync(307, { force: true, preserveConnectionFeedback: true });
  return null;
}

void StoreSyncControllerForceContract;
