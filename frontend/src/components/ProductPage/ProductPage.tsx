import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openPaymentInfoStep, selectProduct } from '@/store/slices/checkoutSlice';
import { formatCentsAsCurrency } from '@/domain/money';

export default function ProductPage() {
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((state) => state.products);
  const [quantity, setQuantity] = useState(1);

  const product = items[0];

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="card text-center" role="status">
        <p>Cargando producto...</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="card text-center">
        <p className="field-error">{error ?? 'No se pudo cargar el producto'}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="card text-center">
        <p>No hay productos disponibles en este momento.</p>
      </div>
    );
  }

  const outOfStock = product.stockQuantity <= 0;

  const handleBuy = () => {
    dispatch(selectProduct({ productId: product.id, quantity }));
    dispatch(openPaymentInfoStep());
  };

  return (
    <section className="card" aria-label="Detalle del producto">
      <img className="product-image" src={product.imageUrl} alt={product.name} />

      <div>
        <div className="card-brand-row">
          <h2 style={{ margin: 0, fontSize: '1.15rem' }}>{product.name}</h2>
          {outOfStock ? (
            <span className="badge badge-danger">Agotado</span>
          ) : (
            <span className="badge badge-success">{product.stockQuantity} disponibles</span>
          )}
        </div>
        <p style={{ color: 'var(--color-text-muted)' }}>{product.description}</p>
        <p style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
          {formatCentsAsCurrency(product.priceInCents)}
        </p>
      </div>

      {!outOfStock && (
        <div className="field">
          <label htmlFor="quantity">Cantidad</label>
          <select
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          >
            {Array.from({ length: Math.min(product.stockQuantity, 5) }, (_, i) => i + 1).map(
              (n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ),
            )}
          </select>
        </div>
      )}

      <button className="btn btn-primary" onClick={handleBuy} disabled={outOfStock}>
        {outOfStock ? 'Sin stock' : 'Pagar con tarjeta de crédito'}
      </button>
    </section>
  );
}
