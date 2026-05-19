'use client';

import { useState, type ReactNode } from 'react';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleCard({ title, subtitle, children, defaultOpen = true, className = '' }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[16px] mb-3 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 sm:px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold text-gray-900 dark:text-gray-100">{title}</div>
          {subtitle && <div className="text-[11px] text-gray-400 dark:text-gray-300 mt-0.5">{subtitle}</div>}
        </div>
        <svg
          className={`text-gray-400 dark:text-gray-300 transition-transform shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 dark:border-gray-800 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
