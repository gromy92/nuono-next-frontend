import type { AuthSession } from '../auth/session';
import { ProductLogisticsCostsModals } from './ProductLogisticsCostsModals';
import { ProductLogisticsCostsTable } from './ProductLogisticsCostsTable';
import { ProductLogisticsCostsToolbar } from './ProductLogisticsCostsToolbar';
import { useProductLogisticsCostData } from './useProductLogisticsCostData';
import { useProductLogisticsCostMutations } from './useProductLogisticsCostMutations';
import './ProductLogisticsCostsPage.css';

export function ProductLogisticsCostsPage({ session }: { session: AuthSession }) {
  const data = useProductLogisticsCostData(session);
  const mutations = useProductLogisticsCostMutations(data);

  return (
    <div className="product-logistics-costs-page">
      <ProductLogisticsCostsToolbar data={data} mutations={mutations} />
      <ProductLogisticsCostsTable data={data} mutations={mutations} />
      <ProductLogisticsCostsModals data={data} mutations={mutations} />
    </div>
  );
}
