import type { AuthSession } from '../auth/session';
import { useProfitCalculatorWorkspace } from './useProfitCalculatorWorkspace';

function ProfitWorkspaceDisabledContract({ session }: { session: AuthSession | null }) {
  const workspace = useProfitCalculatorWorkspace(() => undefined, session, { enabled: false });
  void workspace.profitBoard;
  void workspace.openProfitCalculatorPrefilled;
  return null;
}

void ProfitWorkspaceDisabledContract;
