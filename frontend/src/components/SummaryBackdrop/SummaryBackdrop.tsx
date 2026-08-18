import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { payCurrentTransaction } from '@/store/slices/checkoutSlice';
import { formatCentsAsCurrency } from '@/domain/money';
import CardBrandIcon from '@/components/CardBrandIcon/CardBrandIcon';
import type { CardBrand } from '@/domain/cardValidation';

/**
 * Material Design "backdrop" pattern: a persistent front layer (the
 * summary) sits above a back layer, surfaced from the bottom, per the
 * test brief's reference to https://m2.material.io/components/backdrop.
 */
export default function SummaryBackdrop() {
  const dispatch = useAppDispatch();
  const { transaction, cardDisplay, isProcessing, error } = useAppSelector(
    (state) => state.checkout,
  );

  if (!transaction) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Resumen de pago">
      <div className="modal-sheet">
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Resumen de tu compra</h2>

        {cardDisplay && (
          <div className="card-brand-row">
            <CardBrandIcon brand={cardDisplay.brand as CardBrand} />
            <span style={{ color: 'var(--color-text-muted)' }}>
              Terminada en •••• {cardDisplay.lastFour}
            </span>
          </div>
        )}

        <div>
          <div className="summary-row">
            <span>Valor del producto</span>
            <span>{formatCentsAsCurrency(transaction.productAmountInCents)}</span>
          </div>
          <div className="summary-row">
            <span>Fee base</span>
            <span>{formatCentsAsCurrency(transaction.baseFeeInCents)}</span>
          </div>
          <div className="summary-row">
            <span>Fee de envío</span>
            <span>{formatCentsAsCurrency(transaction.deliveryFeeInCents)}</span>
          </div>
          <div className="summary-row total">
            <span>Total a pagar</span>
            <span>{formatCentsAsCurrency(transaction.amountInCents)}</span>
          </div>
        </div>

        {error && <p className="field-error">{error}</p>}

        <button
          className="btn btn-primary"
          disabled={isProcessing}
          onClick={() => dispatch(payCurrentTransaction())}
        >
          {isProcessing ? <span className="spinner" /> : 'Pagar ahora'}
        </button>
      </div>
    </div>
  );
}
