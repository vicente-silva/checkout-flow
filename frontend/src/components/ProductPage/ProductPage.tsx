import { useAppSelector } from '@/store/hooks';
import ProductCard from './ProductCard';

export default function ProductPage() {
  const { items, status, error } = useAppSelector((state) => state.products);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="card text-center" role="status">
        <p>Cargando productos...</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="card text-center">
        <p className="field-error">{error ?? 'No se pudieron cargar los productos'}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card text-center">
        <p>No hay productos disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
