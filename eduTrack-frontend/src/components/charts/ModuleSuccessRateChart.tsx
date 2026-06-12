import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BackendModuleStat } from '../../utils/apiMappers';

interface ModuleSuccessRateChartProps {
  data: BackendModuleStat[];
}

function getBarColor(value: number): string {
  if (value >= 70) return '#10B981';
  if (value >= 50) return '#F59E0B';
  return '#F43F5E';
}

/** Horizontal bar chart showing module success rates from dashboard stats. */
export function ModuleSuccessRateChart({ data }: ModuleSuccessRateChartProps) {
  const chartData = data.map((item) => ({
    name: item.module_name,
    taux_reussite: Math.round(100 - item.taux_echec),
  }));

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs h-full">
      <h3 className="text-base font-bold text-slate-800 font-sans">Taux de Réussite par Module</h3>
      <p className="text-slate-400 text-xs font-sans mt-0.5">Source: GET /dashboard/modules/stats</p>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" domain={[0, 100]} unit="%" fontSize={10} fontFamily="monospace" />
            <YAxis
              dataKey="name"
              type="category"
              fontSize={10}
              fontFamily="sans-serif"
              width={100}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, 'Taux de Réussite']}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="taux_reussite" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.taux_reussite)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
