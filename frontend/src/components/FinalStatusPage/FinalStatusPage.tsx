import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { resetCheckout } from '@/store/slices/checkoutSlice';
import { fetchProducts } from '@/store/slices/productsSlice';
import { formatCentsAsCurrency } from '@/domain/money';
import type { TransactionStatus } from '@/api/types';

const STATUS_COPY: Record<TransactionStatus, { icon: string; title: string; className: string }> = {
  APPROVED: { icon: '✓', title: 'Pago aprobado', className: 'approved' },
  DECLINED: { icon: '✕', title: 'Pago rechazado', className: 'declined' },
  ERROR: { icon: '!', title: 'Ocurrió un error procesando el pago', className: 'error' },
  VOIDED: { icon: '✕', title: 'Pago anulado', className: 'declined' },
  PENDING: { icon: '…', title: 'Pago pendiente', className: 'error' },
};

export default function FinalStatusPage() {
  const dispatch = useAppDispatch();
  const transaction = useAppSelector((state) => state.checkout.transaction);

  if (!transaction) return null;

  const copy = STATUS_COPY[transaction.status];

  function handleBackToStore() {
    dispatch(resetCheckout());
    dispatch(fetchProducts());
  }

  return (
    <section className="card text-center" aria-label="Resultado del pago">
      <div className={`status-icon ${copy.className}`}>{copy.icon}</div>
      <h2 style={{ margin: 0 }}>{copy.title}</h2>
      <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
        Referencia: <strong>{transaction.reference}</strong>
      </p>
      <p style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
        {formatCentsAsCurrency(transaction.amountInCents)}
      </p>
      <button className="btn btn-primary" onClick={handleBackToStore}>
        Volver a la tienda
      </button>
    </section>
  );
}
