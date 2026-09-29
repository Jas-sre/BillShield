import { useContext } from 'react';
import { BillShieldContext, type BillShieldContextValue } from '../context/BillShieldContext';

/** Access the BillShield demo store. Must be used inside <BillShieldProvider>. */
export function useBillShield(): BillShieldContextValue {
  const context = useContext(BillShieldContext);
  if (!context) {
    throw new Error('useBillShield must be used inside a BillShieldProvider');
  }
  return context;
}

/** Shorthand for pushing a toast. */
export function useToast() {
  const { pushToast } = useBillShield();
  return pushToast;
}

/** Formatted "today" for the demo. */
export function useDemoToday() {
  const { todaysDate } = useBillShield();
  return todaysDate;
}
