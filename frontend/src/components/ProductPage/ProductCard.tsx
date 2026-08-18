import { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { openPaymentInfoStep, selectProduct } from '@/store/slices/checkoutSlice';
import { formatCentsAsCurrency } from '@/domain/money';
import type { Product } from '@/api/types';

export default function ProductCard({ product }: { product: Product }) {
  const dispatch = useAppDispatch();
  const [quantity, setQuantity] = useState(1);
  const outOfStock = product.stockQuantity <= 0;

  const handleBuy = () => {
    dispatch(selectProduct({ productId: product.id, quantity }));
    dispatch(openPaymentInfoStep());
  };

  return (
    <article className="card" aria-label={product.name}>
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
          <label htmlFor={`quantity-${product.id}`}>Cantidad</label>
          <select
            id={`quantity-${product.id}`}
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
    </article>
  );
}
