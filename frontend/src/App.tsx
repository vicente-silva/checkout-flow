import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProducts } from '@/store/slices/productsSlice';
import ProductPage from '@/components/ProductPage/ProductPage';
import PaymentInfoModal from '@/components/PaymentInfoModal/PaymentInfoModal';
import SummaryBackdrop from '@/components/SummaryBackdrop/SummaryBackdrop';
import FinalStatusPage from '@/components/FinalStatusPage/FinalStatusPage';

export default function App() {
  const dispatch = useAppDispatch();
  const step = useAppSelector((state) => state.checkout.step);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Tienda Checkout</h1>
        <p>Onboarding de pago con tarjeta de crédito</p>
      </header>

      <main className="app-content">
        {step === 'FINAL_STATUS' ? <FinalStatusPage /> : <ProductPage />}
      </main>

      {step === 'PAYMENT_INFO' && <PaymentInfoModal />}
      {step === 'SUMMARY' && <SummaryBackdrop />}
    </div>
  );
}
