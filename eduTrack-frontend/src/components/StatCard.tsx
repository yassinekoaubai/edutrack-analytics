import { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  accentColor: string;
  footer: ReactNode;
}

/** KPI card showing a metric label, value, and contextual footer row. */
export function StatCard({ label, value, accentColor, footer }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: accentColor }} />
      <p className="text-slate-500 text-xs uppercase tracking-wider font-bold font-sans">{label}</p>
      <h3 className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">{value}</h3>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 font-sans">{footer}</div>
    </div>
  );
}
