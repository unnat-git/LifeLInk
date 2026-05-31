'use client';

import { motion } from 'framer-motion';
import { Siren } from 'lucide-react';
import { useNavigationStore } from '@/store';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

export default function SOSFloatingButton() {
  const { currentPage, setCurrentPage } = useNavigationStore();
  const { data: session } = useSession();
  const user = session?.user;

  // Only show for patients, and not when already on SOS page
  const isVisible = user?.role === 'PATIENT' && currentPage !== 'sos';

  if (!isVisible) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        // Navigate to SOS page — user must go through proper hold → confirm → countdown flow
        setCurrentPage('sos');
      }}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'w-14 h-14 sm:w-14 sm:h-14',
        'rounded-full',
        'bg-emergency text-emergency-foreground',
        'flex items-center justify-center',
        'shadow-lg shadow-emergency/30',
        'hover:shadow-xl hover:shadow-emergency/50',
        'transition-shadow duration-300',
        'group cursor-pointer',
        'border-0 outline-none',
      )}
      aria-label="Go to SOS Emergency page"
    >
      {/* Pulse ring 1 */}
      <span className="absolute inset-0 rounded-full bg-emergency animate-ping opacity-20" />

      {/* Pulse ring 2 */}
      <span className="absolute inset-0 rounded-full bg-emergency sos-ring-1 opacity-20" />

      <Siren className="h-6 w-6 relative z-10" />

      {/* Glow effect on hover */}
      <span className="absolute inset-0 rounded-full bg-emergency opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl" />
    </motion.button>
  );
}
