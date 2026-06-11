import { ReactNode } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
};

/** Displays an animated spinner with an optional loading message. */
export function LoadingSpinner({
  message = 'Chargement...',
  size = 'md',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={`flex flex-col items-center gap-3 ${fullScreen ? '' : 'py-20'}`}>
      <span
        className={`${sizeClasses[size]} border-[#5EA8DA] border-t-transparent rounded-full animate-spin`}
      />
      {message && <p className="text-sm text-slate-500 font-sans">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
