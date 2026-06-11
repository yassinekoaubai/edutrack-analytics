import { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'progress';

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  warning: 'bg-amber-50 text-amber-600 border border-amber-100',
  danger: 'bg-rose-50 text-rose-500 border border-rose-100',
  info: 'bg-sky-50 text-sky-600 border border-sky-100',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
  progress: 'bg-[#B9DDF5]/40 text-slate-800 border border-[#83C5F1]/30',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
}

/** Small pill badge for status labels and alert type tags. */
export function Badge({ children, variant = 'neutral', pulse = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase leading-none ${variantClasses[variant]} ${pulse ? 'animate-pulse' : ''} ${className}`}
    >
      {children}
    </span>
  );
}

export function getStudentStatusVariant(
  status: string
): { variant: BadgeVariant; pulse: boolean } {
  switch (status) {
    case 'Excellent':
      return { variant: 'success', pulse: false };
    case 'Régulier':
      return { variant: 'info', pulse: false };
    case 'En progression':
      return { variant: 'progress', pulse: false };
    case 'Irrégulier':
      return { variant: 'warning', pulse: false };
    case 'À risque':
      return { variant: 'danger', pulse: true };
    default:
      return { variant: 'neutral', pulse: false };
  }
}
