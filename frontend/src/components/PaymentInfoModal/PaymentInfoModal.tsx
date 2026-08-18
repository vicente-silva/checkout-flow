import { FormEvent, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { backToProductStep, submitCheckoutInfo } from '@/store/slices/checkoutSlice';
import {
  detectCardBrand,
  formatCardNumberForDisplay,
  isValidCardHolder,
  isValidCardNumber,
  isValidCvc,
  isValidExpiry,
} from '@/domain/cardValidation';
import CardBrandIcon from '@/components/CardBrandIcon/CardBrandIcon';

interface FormState {
  cardNumber: string;
  cardHolder: string;
  expMonth: string;
  expYear: string;
  cvc: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  documentType: string;
  documentNumber: string;
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
}

const EMPTY_FORM: FormState = {
  cardNumber: '',
  cardHolder: '',
  expMonth: '',
  expYear: '',
  cvc: '',
  fullName: '',
  email: '',
  phoneNumber: '',
  documentType: 'CC',
  documentNumber: '',
  addressLine: '',
  city: '',
  region: '',
  postalCode: '',
};

type FormErrors = Partial<Record<keyof FormState, string>>;

export default function PaymentInfoModal() {
  const dispatch = useAppDispatch();
  const { isProcessing, error, selectedProductId, quantity } = useAppSelector(
    (state) => state.checkout,
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const brand = useMemo(() => detectCardBrand(form.cardNumber), [form.cardNumber]);

  const update = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!isValidCardNumber(form.cardNumber)) next.cardNumber = 'Número de tarjeta inválido';
    if (!isValidCardHolder(form.cardHolder)) next.cardHolder = 'Ingresa el nombre del titular';
    if (!isValidExpiry(form.expMonth, form.expYear)) next.expMonth = 'Fecha de vencimiento inválida';
    if (!isValidCvc(form.cvc)) next.cvc = 'CVC inválido';

    if (!form.fullName.trim()) next.fullName = 'Requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Email inválido';
    if (!/^\+?\d{7,15}$/.test(form.phoneNumber)) next.phoneNumber = 'Teléfono inválido';
    if (!form.documentNumber.trim()) next.documentNumber = 'Requerido';

    if (!form.addressLine.trim()) next.addressLine = 'Requerido';
    if (!form.city.trim()) next.city = 'Requerido';
    if (!form.region.trim()) next.region = 'Requerido';
    if (!form.postalCode.trim()) next.postalCode = 'Requerido';

    return next;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0 || !selectedProductId) return;

    dispatch(
      submitCheckoutInfo({
        productId: selectedProductId,
        quantity,
        customer: {
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          documentType: form.documentType,
          documentNumber: form.documentNumber,
        },
        delivery: {
          addressLine: form.addressLine,
          city: form.city,
          region: form.region,
          postalCode: form.postalCode,
        },
        card: {
          number: form.cardNumber,
          cvc: form.cvc,
          expMonth: form.expMonth,
          expYear: form.expYear,
          cardHolder: form.cardHolder,
        },
      }),
    );
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Datos de pago">
      <form className="modal-sheet" onSubmit={handleSubmit}>
        <div className="card-brand-row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Datos de la tarjeta</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => dispatch(backToProductStep())}
            style={{ border: 'none', background: 'none', fontSize: '1.3rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div className="field">
          <label htmlFor="cardNumber">Número de tarjeta</label>
          <div className="card-brand-row">
            <input
              id="cardNumber"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              value={formatCardNumberForDisplay(form.cardNumber)}
              onChange={update('cardNumber')}
              maxLength={23}
            />
            <CardBrandIcon brand={brand} />
          </div>
          {errors.cardNumber && <span className="field-error">{errors.cardNumber}</span>}
        </div>

        <div className="field">
          <label htmlFor="cardHolder">Nombre del titular</label>
          <input id="cardHolder" value={form.cardHolder} onChange={update('cardHolder')} />
          {errors.cardHolder && <span className="field-error">{errors.cardHolder}</span>}
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="expMonth">Vencimiento (MM/AA)</label>
            <div className="card-brand-row">
              <input
                id="expMonth"
                inputMode="numeric"
                placeholder="MM"
                maxLength={2}
                value={form.expMonth}
                onChange={update('expMonth')}
              />
              <input
                aria-label="Año de vencimiento"
                inputMode="numeric"
                placeholder="AA"
                maxLength={2}
                value={form.expYear}
                onChange={update('expYear')}
              />
            </div>
            {errors.expMonth && <span className="field-error">{errors.expMonth}</span>}
          </div>
          <div className="field">
            <label htmlFor="cvc">CVC</label>
            <input
              id="cvc"
              inputMode="numeric"
              maxLength={4}
              value={form.cvc}
              onChange={update('cvc')}
            />
            {errors.cvc && <span className="field-error">{errors.cvc}</span>}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Datos del comprador</h3>

        <div className="field">
          <label htmlFor="fullName">Nombre completo</label>
          <input id="fullName" value={form.fullName} onChange={update('fullName')} />
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={update('email')} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="phoneNumber">Teléfono</label>
            <input id="phoneNumber" value={form.phoneNumber} onChange={update('phoneNumber')} />
            {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
          </div>
          <div className="field">
            <label htmlFor="documentNumber">Documento</label>
            <input
              id="documentNumber"
              value={form.documentNumber}
              onChange={update('documentNumber')}
            />
            {errors.documentNumber && <span className="field-error">{errors.documentNumber}</span>}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
        <h3 style={{ margin: 0, fontSize: '1rem' }}>Datos de entrega</h3>

        <div className="field">
          <label htmlFor="addressLine">Dirección</label>
          <input id="addressLine" value={form.addressLine} onChange={update('addressLine')} />
          {errors.addressLine && <span className="field-error">{errors.addressLine}</span>}
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="city">Ciudad</label>
            <input id="city" value={form.city} onChange={update('city')} />
            {errors.city && <span className="field-error">{errors.city}</span>}
          </div>
          <div className="field">
            <label htmlFor="region">Departamento</label>
            <input id="region" value={form.region} onChange={update('region')} />
            {errors.region && <span className="field-error">{errors.region}</span>}
          </div>
        </div>

        <div className="field">
          <label htmlFor="postalCode">Código postal</label>
          <input id="postalCode" value={form.postalCode} onChange={update('postalCode')} />
          {errors.postalCode && <span className="field-error">{errors.postalCode}</span>}
        </div>

        {error && <p className="field-error">{error}</p>}

        <button className="btn btn-primary" type="submit" disabled={isProcessing}>
          {isProcessing ? <span className="spinner" /> : 'Continuar'}
        </button>
      </form>
    </div>
  );
}
