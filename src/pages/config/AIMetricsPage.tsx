import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, DollarSign, Zap, Clock, Target, Download, Filter } from 'lucide-react';
import { listDailyMetrics, getGeneralStats, type AIMetric, type ListDailyMetricsParams } from '../../services/ai';
import { toast } from 'sonner';

const PERIODOS_RAPIDOS = [
  { label: 'Últimos 7 días', dias: 7 },
  { label: 'Últimos 30 días', dias: 30 },
  { label: 'Últimos 90 días', dias: 90 }
];

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AIMetricsPage() {
  const [metrics, setMetrics] = useState<AIMetric[]>([]);
  const [generalStats, setGeneralStats] = useState({
    total_runs: 0,
    total_prompts: 0,
    total_providers: 0,
    total_keys: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'charts'>('charts');

  useEffect(() => {
    // Establecer fechas por defecto (últimos 30 días)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      loadData();
    }
  }, [dateFrom, dateTo, selectedEmpresa]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: ListDailyMetricsParams = {
        desde: dateFrom,
        hasta: dateTo
      };

      if (selectedEmpresa !== 'all') {
        params.empresa_id = parseInt(selectedEmpresa);
      }

      const [metricsData, statsData] = await Promise.all([
        listDailyMetrics(params),
        getGeneralStats()
      ]);

      setMetrics(metricsData);
      setGeneralStats(statsData);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error('Error al cargar las métricas');
    } finally {
      setLoading(false);
    }
  };

  const applyQuickPeriod = (dias: number) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - dias);
    
    setDateFrom(startDate.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  const getTotals = () => {
    return metrics.reduce((acc, metric) => ({
      total_runs: acc.total_runs + metric.total_runs,
      total_tokens_input: acc.total_tokens_input + metric.total_tokens_input,
      total_tokens_output: acc.total_tokens_output + metric.total_tokens_output,
      total_costo: acc.total_costo + metric.total_costo,
      runs_exitosos: acc.runs_exitosos + metric.runs_exitosos,
      runs_error: acc.runs_error + metric.runs_error
    }), {
      total_runs: 0,
      total_tokens_input: 0,
      total_tokens_output: 0,
      total_costo: 0,
      runs_exitosos: 0,
      runs_error: 0
    });
  };

  const getSuccessRate = () => {
    const totals = getTotals();
    return totals.total_runs > 0 ? (totals.runs_exitosos / totals.total_runs * 100).toFixed(1) : '0';
  };

  const getAverageCost = () => {
    const totals = getTotals();
    return totals.total_runs > 0 ? (totals.total_costo / totals.total_runs).toFixed(4) : '0';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const chartData = metrics.map(metric => ({
    fecha: new Date(metric.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    runs: metric.total_runs,
    costo: metric.total_costo,
    tokens_input: metric.total_tokens_input,
    tokens_output: metric.total_tokens_output,
    exitosos: metric.runs_exitosos,
    errores: metric.runs_error,
    duracion_promedio: metric.promedio_duracion_ms
  }));

  const successRateData = metrics.map(metric => ({
    fecha: new Date(metric.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    tasa_exito: metric.total_runs > 0 ? (metric.runs_exitosos / metric.total_runs * 100) : 0
  }));

  const totals = getTotals();
  const pieData = [
    { name: 'Exitosos', value: totals.runs_exitosos, color: '#10b981' },
    { name: 'Errores', value: totals.runs_error, color: '#ef4444' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Métricas de AI</h1>
          <p className="text-gray-600">Análisis de uso y rendimiento de servicios de AI</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'charts' ? 'default' : 'outline'}
            onClick={() => setViewMode('charts')}
          >
            Gráficos
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
          >
            Tabla
          </Button>
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2">
        {PERIODOS_RAPIDOS.map(periodo => (
          <Button
            key={periodo.dias}
            variant="outline"
            size="sm"
            onClick={() => applyQuickPeriod(periodo.dias)}
          >
            {periodo.label}
          </Button>
        ))}
      </div>

      {/* Controles de filtro */}
      <div className="flex items-center space-x-4">
        <div>
          <Label htmlFor="dateFrom">Desde:</Label>
          <Input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label htmlFor="dateTo">Hasta:</Label>
          <Input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <Label htmlFor="empresa">Empresa:</Label>
          <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las empresas</SelectItem>
              {/* Aquí se pueden agregar empresas específicas si están disponibles */}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={loadData} variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Aplicar
        </Button>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Ejecuciones</p>
                <p className="text-2xl font-bold">{formatNumber(totals.total_runs)}</p>
                <p className="text-xs text-gray-500">Global: {formatNumber(generalStats.total_runs)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Tasa de Éxito</p>
                <p className="text-2xl font-bold">{getSuccessRate()}%</p>
                <p className="text-xs text-gray-500">{formatNumber(totals.runs_exitosos)} exitosos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Costo Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.total_costo)}</p>
                <p className="text-xs text-gray-500">Promedio: ${getAverageCost()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Tokens Totales</p>
                <p className="text-2xl font-bold">
                  {formatNumber(totals.total_tokens_input + totals.total_tokens_output)}
                </p>
                <p className="text-xs text-gray-500">
                  In: {formatNumber(totals.total_tokens_input)} | Out: {formatNumber(totals.total_tokens_output)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de ejecuciones por día */}
          <Card>
            <CardHeader>
              <CardTitle>Ejecuciones por Día</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="runs" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de costos */}
          <Card>
            <CardHeader>
              <CardTitle>Costos por Día</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(4)}`, 'Costo']} />
                  <Line type="monotone" dataKey="costo" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de tasa de éxito */}
          <Card>
            <CardHeader>
              <CardTitle>Tasa de Éxito (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={successRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Tasa de Éxito']} />
                  <Line type="monotone" dataKey="tasa_exito" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico circular de éxito vs errores */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Vista de tabla */
        <Card>
          <CardHeader>
            <CardTitle>Métricas Diarias Detalladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total Runs</TableHead>
                    <TableHead>Exitosos</TableHead>
                    <TableHead>Errores</TableHead>
                    <TableHead>Tasa Éxito</TableHead>
                    <TableHead>Tokens Input</TableHead>
                    <TableHead>Tokens Output</TableHead>
                    <TableHead>Costo Total</TableHead>
                    <TableHead>Duración Prom.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((metric) => (
                    <TableRow key={metric.fecha}>
                      <TableCell>
                        {new Date(metric.fecha).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>{formatNumber(metric.total_runs)}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          {formatNumber(metric.runs_exitosos)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">
                          {formatNumber(metric.runs_error)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {metric.total_runs > 0 
                          ? `${(metric.runs_exitosos / metric.total_runs * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </TableCell>
                      <TableCell>{formatNumber(metric.total_tokens_input)}</TableCell>
                      <TableCell>{formatNumber(metric.total_tokens_output)}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(metric.total_costo)}
                      </TableCell>
                      <TableCell>
                        {metric.promedio_duracion_ms < 1000 
                          ? `${metric.promedio_duracion_ms}ms`
                          : `${(metric.promedio_duracion_ms / 1000).toFixed(1)}s`
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {metrics.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No hay métricas para el período seleccionado</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}