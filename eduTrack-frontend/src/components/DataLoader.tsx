/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface DataLoaderProps {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
}

export const DataLoader: React.FC<DataLoaderProps> = ({ loading, error, children }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="w-8 h-8 border-2 border-[#5EA8DA] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-sans">Chargement des données depuis la base...</p>
      </div>
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
};
