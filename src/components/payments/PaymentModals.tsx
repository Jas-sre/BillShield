import { ManageMandateModal } from '../mandates/ManageMandateModal';
import { SimulatePauseModal } from '../mandates/SimulatePauseModal';
import { PaymentDetailModal } from './PaymentDetailModal';

/**
 * Single host for the three payment/mandate modals so every page can open them
 * through the store instead of duplicating modal state.
 */
export function PaymentModals() {
  return (
    <>
      <PaymentDetailModal />
      <SimulatePauseModal />
      <ManageMandateModal />
    </>
  );
}

export default PaymentModals;
