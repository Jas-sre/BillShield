import { MotionConfig, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { useBillShield } from '../../hooks/useBillShield';
import { cx } from '../../utils/cx';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { DemoWalkthrough } from '../common/DemoWalkthrough';
import { NotificationDrawer } from '../common/NotificationDrawer';
import { ToastViewport } from '../common/Toast';
import { PaymentModals } from '../payments/PaymentModals';
import { DesktopSidebar } from './DesktopSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { TopHeader } from './TopHeader';

export function AppShell() {
  const { state } = useBillShield();
  const location = useLocation();
  const { accessibility } = state;

  return (
    <MotionConfig reducedMotion={accessibility.reduceMotion ? 'always' : 'user'}>
      <div className="min-h-screen bg-canvas">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-xl focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>

        <DesktopSidebar />

        <div className="flex min-h-screen flex-col lg:pl-72">
          <TopHeader />
          <main
            id="main-content"
            className={cx(
              'mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-12',
              accessibility.largeText && 'a11y-large-text',
              accessibility.highContrast && 'a11y-high-contrast',
            )}
          >
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <Outlet />
            </motion.div>
          </main>
          <DisclaimerBanner variant="bar" />
        </div>

        <MobileBottomNav />
        <NotificationDrawer />
        <PaymentModals />
        <ToastViewport />
        <DemoWalkthrough />
      </div>
    </MotionConfig>
  );
}

export default AppShell;
