import type { CardBrand } from '@/domain/cardValidation';

export default function CardBrandIcon({ brand }: { brand: CardBrand }) {
  if (brand === 'visa') {
    return (
      <span
        data-testid="card-brand-visa"
        style={{
          fontWeight: 800,
          fontStyle: 'italic',
          color: '#1a1f71',
          fontSize: '1.1rem',
          letterSpacing: '-0.5px',
        }}
      >
        VISA
      </span>
    );
  }

  if (brand === 'mastercard') {
    return (
      <span data-testid="card-brand-mastercard" style={{ display: 'inline-flex' }}>
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#eb001b',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#f79e1b',
            display: 'inline-block',
            marginLeft: -8,
            opacity: 0.85,
          }}
        />
      </span>
    );
  }

  return null;
}
