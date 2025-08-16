
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Changed useHistory to useNavigate
import Card from '../components/common/Card.tsx';
import LoadingSpinner from '../components/common/LoadingSpinner.tsx';
import { getDashboardSummary, getPerformanceDataForChart, PerformanceChartDataItem } from '../services/apiService.ts';
import { ChartBarIcon, UsersIcon, WrenchScrewdriverIcon, ArchiveBoxIcon, BanknotesIcon, ClockIcon } from '../constants.tsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { formatCurrencyCOP } from '../utils/formatting.ts';
import Button from '../components/common/Button.tsx';

interface DashboardData {
  activeWorkOrders: number;
  pendingDiagnosis: number;
  pendingApproval: number; // New field for OTs awaiting client approval
  lowStockItems: number;
  totalClients: number;
  monthlyRevenue: number;
}

const recentActivity = [ // This should ideally become dynamic
  { time: 'Hace 5 min', action: 'Nueva OT creada (OT-1007)', user: 'Recepción' },
  { time: 'Hace 15 min', action: 'Estado de OT-1003 actualizado a "En Progreso"', user: 'Carlos P.' },
  { time: 'Hace 1 hora', action: 'Cliente "Nuevo Cliente SA" registrado', user: 'Recepción' },
  { time: 'Hace 2 horas', action: 'Cliente Bob The Builder Inc. aprobó presupuesto para OT-1004.', user: 'Portal Cliente' },
];

type ChartTimeRange = 'daily' | 'weekly' | 'monthly';


const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [performanceChartData, setPerformanceChartData] = useState<PerformanceChartDataItem[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [chartTimeRange, setChartTimeRange] = useState<ChartTimeRange>('weekly');
  const { theme } = useTheme();
  const navigate = useNavigate(); // Changed from useHistory

  const fetchSummaryData = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching summary data:", error);
      setSummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  const fetchChartData = useCallback(async (range: ChartTimeRange) => {
    setIsLoadingChart(true);
    try {
      const data = await getPerformanceDataForChart(range);
      setPerformanceChartData(data);
    } catch (error) {
      console.error(`Error fetching ${range} performance data:`, error);
      setPerformanceChartData([]);
    } finally {
      setIsLoadingChart(false);
    }
  }, []);

  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  useEffect(() => {
    fetchChartData(chartTimeRange);
  }, [chartTimeRange, fetchChartData]);

  const chartLineColor = theme === 'dark' ? '#a78bfa' : '#6d28d9'; // purple-400 and purple-700
  const chartGridColor = theme === 'dark' ? '#4b5563' : '#e5e7eb'; // gray-600 and gray-200
  const chartTextColor = theme === 'dark' ? '#d1d5db' : '#374151'; // gray-300 and gray-700

  const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-700 p-3 rounded shadow-lg border dark:border-slate-600">
          <p className="label text-sm font-semibold text-slate-800 dark:text-slate-100">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-xs">
              {`${entry.name}: ${entry.name === 'Reparaciones' ? entry.value : formatCurrencyCOP(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoadingSummary) {
    return <LoadingSpinner text="Cargando dashboard..." />;
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Card title="OTs Activas" icon={<WrenchScrewdriverIcon className="h-5 w-5 text-blue-500 dark:text-blue-400"/>} className="shadow-md">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary?.activeWorkOrders ?? '...'}</p>
        </Card>
        <Card title="Pend. Diagnóstico" icon={<ClockIcon className="h-5 w-5 text-amber-500 dark:text-amber-400"/>} className="shadow-md">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary?.pendingDiagnosis ?? '...'}</p>
        </Card>
         <Card title="Pend. Aprobación Cliente" icon={<ClockIcon className="h-5 w-5 text-fuchsia-500 dark:text-fuchsia-400"/>} className="shadow-md">
          <p className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400">{summary?.pendingApproval ?? '...'}</p>
        </Card>
        <Card title="Bajo Stock" icon={<ArchiveBoxIcon className="h-5 w-5 text-red-500 dark:text-red-400"/>} className="shadow-md">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary?.lowStockItems ?? '...'}</p>
        </Card>
        <Card title="Total Clientes" icon={<UsersIcon className="h-5 w-5 text-teal-500 dark:text-teal-400"/>} className="shadow-md">
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{summary?.totalClients ?? '...'}</p>
        </Card>
        <Card title="Ingresos del Mes" icon={<BanknotesIcon className="h-5 w-5 text-emerald-500 dark:text-emerald-400"/>} className="shadow-md">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrencyCOP(summary?.monthlyRevenue ?? 0)}</p>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card title="Rendimiento del Taller" className="shadow-lg mb-6">
        <div className="flex justify-end mb-4 space-x-2">
          {(['daily', 'weekly', 'monthly'] as ChartTimeRange[]).map(range => (
            <Button
              key={range}
              size="sm"
              variant={chartTimeRange === range ? 'primary' : 'secondary'}
              onClick={() => setChartTimeRange(range)}
            >
              {range === 'daily' ? 'Día' : range === 'weekly' ? 'Semana' : 'Mes'}
            </Button>
          ))}
        </div>
        {isLoadingChart ? <LoadingSpinner text="Cargando gráfico..." /> : (
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={performanceChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor}/>
                <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" stroke={chartLineColor} tick={{ fill: chartTextColor, fontSize: 12 }} tickFormatter={(value) => formatCurrencyCOP(value)} />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tick={{ fill: chartTextColor, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="revenue" fill={chartLineColor} name="Ingresos" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="left" dataKey="expenses" fill="#f43f5e" name="Egresos" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="right" dataKey="repairs" fill="#82ca9d" name="Reparaciones" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Recent Activity */}
      <Card title="Actividad Reciente (Simulada)" icon={<ChartBarIcon className="h-5 w-5 text-slate-500 dark:text-slate-400"/>} className="shadow-md">
        <ul className="divide-y divide-slate-200 dark:divide-slate-700 max-h-72 overflow-y-auto">
          {recentActivity.map((activity, index) => (
            <li key={index} className="py-3">
              <p className="text-sm text-slate-700 dark:text-slate-200">
                <span className="font-medium">{activity.action}</span> por <span className="font-semibold text-primary dark:text-primary-light">{activity.user}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{activity.time}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default DashboardPage;
