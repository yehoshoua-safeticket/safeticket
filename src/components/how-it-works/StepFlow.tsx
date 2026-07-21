'use client';

import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Tag, CreditCard, Lock, DoorOpen, Wallet } from 'lucide-react';
import { useLocale } from '@/i18n/LocaleProvider';

const FLOW_ICONS = [Tag, CreditCard, Lock, DoorOpen, Wallet];

const FLOW_SCHEME = {
  activeIcon: '#000000',
  doneIcon: '#4a4a4a',
};

/** The escrow flow — simple 5-step sequence that auto-advances. */
export default function StepFlow() {
  const { t } = useLocale();
  const [flowStep, setFlowStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFlowStep((s) => (s + 1) % 6), 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="py-4 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto flex max-w-2xl flex-row flex-wrap items-start justify-center gap-x-0 gap-y-6 sm:gap-y-8">
          {FLOW_ICONS.map((Icon, i) => {
            const active = i === flowStep;
            const done = i < flowStep;
            const s = FLOW_SCHEME;
            return (
              <div key={i} className="flex basis-1/3 flex-col items-center">
                <motion.div
                  animate={{ scale: active ? 1.06 : 1, opacity: active || done ? 1 : 0.85 }}
                  transition={{ duration: 0.4 }}
                  className="flex w-full flex-col items-center gap-3 text-center"
                >
                  <div className="relative flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20">
                    {/* Smoke halo */}
                    {active && (
                      <motion.span
                        aria-hidden
                        animate={{ scale: [1, 1.25, 1.1, 1.3, 1], opacity: [0.7, 0.95, 0.8, 1, 0.7] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                        className="pointer-events-none absolute -inset-5 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.14) 40%, transparent 70%)',
                          filter: 'blur(14px)',
                        }}
                      />
                    )}
                    <Icon
                      className="relative h-12 w-12 transition-colors duration-300 sm:h-16 sm:w-16"
                      strokeWidth={1}
                      style={{
                        color: active ? s.activeIcon : done ? s.doneIcon : 'var(--muted)',
                        filter: active
                          ? 'drop-shadow(0 0 12px rgba(0,0,0,0.32)) drop-shadow(0 0 26px rgba(0,0,0,0.22))'
                          : 'none',
                      }}
                    />
                    {/* Check merged into the icon, white — stroke draws itself */}
                    {(active || done) && (
                      <svg
                        className="absolute h-7 w-7"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.45))' }}
                      >
                        <motion.path
                          d="M4 12l5 5L20 6"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.45, ease: 'easeOut' }}
                        />
                      </svg>
                    )}
                  </div>
                  <p className="mt-3 max-w-[7.5rem] px-1 text-sm font-bold leading-snug text-[var(--foreground)] sm:max-w-[9rem] sm:text-base">
                    {t.home.flowSteps[i]}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
