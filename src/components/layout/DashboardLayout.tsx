'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import MobileSidebar from '@/components/layout/MobileSidebar';
import Topbar from '@/components/layout/Topbar';
import SOSAlertBanner from '@/components/dashboard/SOSAlertBanner';
import MedicalChatbot from '@/components/ai/MedicalChatbot';
import { useNavigationStore } from '@/store';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDemoNotifications } from '@/hooks/use-demo-notifications';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen } = useNavigationStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Seed mock notifications for demo accounts only
  useDemoNotifications();

  return (
    <div className="min-h-screen bg-background">
      {/* Global SOS Alert Banner */}
      <SOSAlertBanner />

      {/* Global AI Medical Chatbot */}
      <MedicalChatbot />


      {/* Desktop Sidebar */}
      <AnimatePresence>
        {!isMobile && <Sidebar key="desktop-sidebar" />}
      </AnimatePresence>

      {/* Mobile Sidebar (Sheet) */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <motion.div
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : (sidebarOpen ? 260 : 72),
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'flex flex-col min-h-screen',
        )}
      >
        <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </motion.div>
    </div>
  );
}
