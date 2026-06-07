import type { AuthSession } from '../../auth/session';
import { useProductListDatasetLoader } from './useProductListDatasetLoader';

function ProductListDatasetLoaderForceContract({ session }: { session: AuthSession | null }) {
  const { loadProductListDataset } = useProductListDatasetLoader({
    activeOwnerId: 307,
    session,
    setProductListDatasetState: () => undefined
  });

  void loadProductListDataset('STR108065-NSA', 307, { force: true });
  return null;
}

void ProductListDatasetLoaderForceContract;
