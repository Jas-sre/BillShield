import { useCallback } from 'react';
import type { Payment } from '../types';
import type { MandateActionId } from '../components/mandates/MandateActionsMenu';
import { useBillShield } from './useBillShield';

/**
 * Single place where the eight mandate actions are wired to the store, so the
 * table, the mobile cards and any other surface behave identically.
 */
export function useMandateActions() {
  const {
    openModal,
    setPriority,
    toggleReminder,
    setHidden,
  } = useBillShield();

  return useCallback(
    (action: MandateActionId, payment: Payment) => {
      switch (action) {
        case 'view':
          openModal('detail', payment.id);
          break;
        case 'essential':
          setPriority(payment.id, 'Essential');
          break;
        case 'important':
          setPriority(payment.id, 'Important');
          break;
        case 'optional':
          setPriority(payment.id, 'Optional');
          break;
        case 'reminder':
          toggleReminder(payment.id);
          break;
        case 'pause':
          // Always goes through the confirmation modal first.
          openModal('pause', payment.id);
          break;
        case 'resume':
          // Same confirmation modal — it renders the resume copy and impact for
          // a paused-in-plan payment, so both directions behave identically.
          openModal('pause', payment.id);
          break;
        case 'upi':
          openModal('manage', payment.id);
          break;
        case 'hide':
          setHidden(payment.id, true);
          break;
        case 'unhide':
          setHidden(payment.id, false);
          break;
        default:
          break;
      }
    },
    [openModal, setPriority, toggleReminder, setHidden],
  );
}
