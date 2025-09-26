import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Search, Filter, Eye, Clock, Zap, DollarSign, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { listRuns, type AIRun, type ListRunsParams } from '../../services/ai';
import { toast } from 'sonner';

const ESTADOS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'completed', label: 'Completado' },
  { value: 'error', label: 'Error' }
];

const FILTROS_RAPIDOS = [
  { label: 'Hoy', value: 'today' },
  { label: 'Ayer', value: 'yesterday' },
  { label: 'Última semana', value: 'week' },
  { label: 'Último mes', value: 'month' }
];

export default function AIRunsPage() {
  const [runs, setRuns] = useState<AIRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [viewingRun, setViewingRun] = useState<AIRun | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRuns, setTotalRuns] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    loadRuns();
  }, [currentPage, selectedEstado, selectedDate]);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const params: ListRunsParams = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      };

      if (selectedDate && selectedDate !== 'all') {
        params.fecha = getDateFromFilter(selectedDate);
      }

      const data = await listRuns(params);
      
      // Filtrar por estado en el frontend si es necesario
      let filteredData = data;
      if (selectedEstado !== 'all') {
        filteredData = data.filter(run => run.estado === selectedEstado);
      }

      setRuns(filteredData);
      setTotalRuns(filteredData.length);
    } catch (error) {
      console.error('Error loading runs:', error);
      toast.error('Error al cargar las ejecuciones');
    } finally {
      setLoading(false);
    }
  };

  const getDateFromFilter = (filter: string): string => {
    const today = new Date();
    switch (filter) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo.toISOString().split('T')[0];
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo.toISOString().split('T')[0];
      default:
        return '';
    }
  };

  const applyQuickFilter = (filter: string) => {
    setSelectedDate(filter);
    setCurrentPage(1);
  };

  const filteredRuns = runs.filter(run => {
    const matchesSearch = 
      run.input_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.output_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.prompt?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.provider?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pending':
        return <Loader className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      pending: 'Pendiente',
      completed: 'Completado',
      error: 'Error'
    };

    return (
      <Badge className={variants[estado as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {labels[estado as keyof typeof labels] || estado}
      </Badge>
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Ejecuciones de AI</h1>
          <p className="text-gray-600">Historial de interacciones con proveedores de AI</p>
        </div>
        <Button onClick={loadRuns} variant="outline">
          Actualizar
        </Button>
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedDate === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => applyQuickFilter('')}
        >
          Todos
        </Button>
        {FILTROS_RAPIDOS.map(filtro => (
          <Button
            key={filtro.value}
            variant={selectedDate === filtro.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyQuickFilter(filtro.value)}
          >
            {filtro.label}
          </Button>
        ))}
      </div>

      {/* Controles de filtro */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar en texto, prompts, providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedEstado} onValueChange={setSelectedEstado}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS.map(estado => (
              <SelectItem key={estado.value} value={estado.value}>
                {estado.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={selectedDate === 'today' || selectedDate === 'yesterday' || selectedDate === 'week' || selectedDate === 'month' ? '' : selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Runs</p>
                <p className="text-2xl font-bold">{filteredRuns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Exitosos</p>
                <p className="text-2xl font-bold">
                  {filteredRuns.filter(r => r.estado === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Duración Promedio</p>
                <p className="text-2xl font-bold">
                  {filteredRuns.length > 0 
                    ? formatDuration(filteredRuns.reduce((acc, r) => acc + r.duracion_ms, 0) / filteredRuns.length)
                    : '0ms'
                  }
                </p>
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
                <p className="text-2xl font-bold">
                  {formatCost(filteredRuns.reduce((acc, r) => acc + r.costo_estimado, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de runs */}
      <Card>
        <CardHeader>
          <CardTitle>Ejecuciones ({filteredRuns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Input</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getEstadoIcon(run.estado)}
                        {getEstadoBadge(run.estado)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(run.created_at).toLocaleDateString()}</div>
                        <div className="text-gray-500">
                          {new Date(run.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{run.provider?.nombre || 'N/A'}</div>
                        <div className="text-gray-500">{run.provider?.tipo || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {run.prompt?.nombre || 'Sin prompt'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-xs">
                        {truncateText(run.input_text)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>In: {run.tokens_input.toLocaleString()}</div>
                        <div>Out: {run.tokens_output.toLocaleString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDuration(run.duracion_ms)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {formatCost(run.costo_estimado)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingRun(run)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRuns.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No se encontraron ejecuciones</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para ver detalles del run */}
      <Dialog open={!!viewingRun} onOpenChange={() => setViewingRun(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Ejecución #{viewingRun?.id}</DialogTitle>
          </DialogHeader>
          {viewingRun && (
            <div className="space-y-6">
              {/* Información general */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Estado:</Label>
                  <div className="mt-1">{getEstadoBadge(viewingRun.estado)}</div>
                </div>
                <div>
                  <Label>Provider:</Label>
                  <p className="mt-1">{viewingRun.provider?.nombre} ({viewingRun.provider?.tipo})</p>
                </div>
                <div>
                  <Label>Duración:</Label>
                  <p className="mt-1">{formatDuration(viewingRun.duracion_ms)}</p>
                </div>
                <div>
                  <Label>Costo:</Label>
                  <p className="mt-1 font-mono">{formatCost(viewingRun.costo_estimado)}</p>
                </div>
              </div>

              {/* Prompt usado */}
              {viewingRun.prompt && (
                <div>
                  <Label>Prompt utilizado:</Label>
                  <div className="mt-1 p-3 bg-blue-50 rounded border">
                    <p className="font-medium">{viewingRun.prompt.nombre}</p>
                  </div>
                </div>
              )}

              {/* Input */}
              <div>
                <Label>Texto de entrada ({viewingRun.tokens_input.toLocaleString()} tokens):</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded border max-h-40 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">{viewingRun.input_text}</pre>
                </div>
              </div>

              {/* Output */}
              <div>
                <Label>Respuesta ({viewingRun.tokens_output.toLocaleString()} tokens):</Label>
                <div className="mt-1 p-3 bg-green-50 rounded border max-h-40 overflow-y-auto">
                  {viewingRun.output_text ? (
                    <pre className="whitespace-pre-wrap text-sm">{viewingRun.output_text}</pre>
                  ) : (
                    <p className="text-gray-500 italic">Sin respuesta</p>
                  )}
                </div>
              </div>

              {/* Error si existe */}
              {viewingRun.error_message && (
                <div>
                  <Label>Error:</Label>
                  <div className="mt-1 p-3 bg-red-50 rounded border">
                    <pre className="whitespace-pre-wrap text-sm text-red-700">{viewingRun.error_message}</pre>
                  </div>
                </div>
              )}

              {/* Metadatos */}
              <div className="text-sm text-gray-500 border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p>Creado: {new Date(viewingRun.created_at).toLocaleString()}</p>
                    <p>Usuario: {viewingRun.user_id}</p>
                  </div>
                  <div>
                    <p>Key ID: {viewingRun.key_id}</p>
                    {viewingRun.empresa_id && <p>Empresa ID: {viewingRun.empresa_id}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}