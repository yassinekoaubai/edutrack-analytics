import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AcademicAlert } from '../../types';

interface RiskLevelPieChartProps {
  alerts: AcademicAlert[];
  totalStudents: number;
}

interface PieSlice {
  name: string;
  value: number;
  color: string;
}

/** Pie chart showing student risk distribution derived from active alerts. */
export function RiskLevelPieChart({ alerts, totalStudents }: RiskLevelPieChartProps) {
  const counts = {
    critique: 0,
    moyenneFaible: 0,
    absencesExcessives: 0,
  };

  alerts.forEach((alert) => {
    if (alert.severity === 'haute') {
      counts.critique++;
    } else if (alert.type === 'GPA') {
      counts.moyenneFaible++;
    } else if (alert.type === 'ABSENCE') {
      counts.absencesExcessives++;
    }
  });

  const atRiskCount = counts.critique + counts.moyenneFaible + counts.absencesExcessives;
  const safeCount = Math.max(0, totalStudents - atRiskCount);

  const chartData: PieSlice[] = [
    { name: 'Critique', value: counts.critique, color: '#F43F5E' },
    { name: 'Moyenne faible', value: counts.moyenneFaible, color: '#F59E0B' },
    { name: 'Absences excessives', value: counts.absencesExcessives, color: '#EAB308' },
    { name: 'En sécurité', value: safeCount, color: '#10B981' },
  ].filter((item) => item.value > 0);

  const RADIAN = Math.PI / 180;

  const renderLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={10}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs h-full">
      <h3 className="text-base font-bold text-slate-800 font-sans">Répartition des Niveaux de Risque</h3>
      <p className="text-slate-400 text-xs font-sans mt-0.5">Source: GET /alerts/</p>
      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
