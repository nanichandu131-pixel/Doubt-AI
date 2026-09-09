'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function LandingReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="flex flex-col items-center h-full"
    >
      {children}
    </motion.div>
  );
}
