import { ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface DataLoaderProps {
  loading: boolean;
  error: string | null;
  children: ReactNode;
}

/** Wraps page content with loading spinner and API error display states. */
export function DataLoader({ loading, error, children }: DataLoaderProps) {
  if (loading) {
    return (
      <LoadingSpinner message="Chargement des données depuis la base..." />
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-8 text-center">
        <p className="text-sm font-semibold text-rose-800 font-sans">Impossible de charger les données</p>
        <p className="text-xs text-rose-600 mt-2 font-sans">{error}</p>
      </div>
    );
  }

  return <>{children}</>;
}
