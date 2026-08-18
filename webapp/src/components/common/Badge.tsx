import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  status?: string;
  variant?: 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, children }) => {
  let effectiveVariant = variant || 'gray';

  if (status) {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'verified' || s === 'true') effectiveVariant = 'green';
    else if (s === 'pending' || s === 'requested' || s === 'pending_approval' || s === 'more_info_requested') effectiveVariant = 'amber';
    else if (s === 'rejected' || s === 'suspended' || s === 'false') effectiveVariant = 'red';
  }

  const styles = {
    green: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    amber: 'bg-amber-100 text-amber-800 border-amber-300',
    red: 'bg-rose-100 text-rose-800 border-rose-300',
    blue: 'bg-sky-100 text-sky-800 border-sky-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    gray: 'bg-slate-100 text-slate-700 border-slate-300',
  }[effectiveVariant];

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wide',
        styles
      )}
    >
      {children || status}
    </span>
  );
};
