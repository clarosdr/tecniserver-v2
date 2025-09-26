import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw, Activity } from 'lucide-react';

// Importar servicios
import { listOT } from '../services/ot';
import { listVentas } from '../services/pos';
import { listClients } from '../services/clients';
import { listProducts } from '../services/mk';
import { listMyReminders } from '../services/reminders';
import { listRuns } from '../services/ai';

interface HealthCheck {
  name: string;
  status: 'OK' | 'FAIL' | 'CHECKING';
  message: string;
  lastChecked?: Date;
}

export default function DevHealthPage() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    { name: 'Órdenes de Trabajo', status: 'CHECKING', message: 'Verificando...' },
    { name: 'Ventas POS', status: 'CHECKING', message: 'Verificando...' },
    { name: 'Clientes', status: 'CHECKING', message: 'Verificando...' },
    { name: 'Productos Marketplace', status: 'CHECKING', message: 'Verificando...' },
    { name: 'Recordatorios', status: 'CHECKING', message: 'Verificando...' },
    { name: 'AI Runs', status: 'CHECKING', message: 'Verificando...' },
  ]);
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runHealthCheck = async (
    name: string,
    checkFunction: () => Promise<any>,
    index: number
  ) => {
    try {
      const result = await checkFunction();
      const count = Array.isArray(result) ? result.length : 
                   (result?.data ? result.data.length : 
                   (result?.items ? result.items.length : 0));
      
      setHealthChecks(prev => prev.map((check, i) => 
        i === index ? {
          ...check,
          status: 'OK' as const,
          message: `Servicio funcionando correctamente. ${count} registros encontrados.`,
          lastChecked: new Date()
        } : check
      ));
    } catch (error: any) {
      setHealthChecks(prev => prev.map((check, i) => 
        i === index ? {
          ...check,
          status: 'FAIL' as const,
          message: `Error: ${error.message || 'Error desconocido'}`,
          lastChecked: new Date()
        } : check
      ));
    }
  };

  const runAllChecks = async () => {
    setIsRefreshing(true);
    
    // Reset all to checking state
    setHealthChecks(prev => prev.map(check => ({
      ...check,
      status: 'CHECKING' as const,
      message: 'Verificando...'
    })));

    const checks = [
      () => listOT({ limit: 1 }),
      () => listVentas({ limit: 1 }),
      () => listClients({ limit: 1 }),
      () => listProducts({ limit: 1 }),
      () => listMyReminders({}),
      () => listRuns({ limit: 1 }),
    ];

    // Run all checks in parallel
    await Promise.all(
      checks.map((checkFn, index) => 
        runHealthCheck(healthChecks[index].name, checkFn, index)
      )
    );

    setIsRefreshing(false);
  };

  useEffect(() => {
    runAllChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAIL':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'CHECKING':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OK':
        return <Badge variant="default" className="bg-green-100 text-green-800">OK</Badge>;
      case 'FAIL':
        return <Badge variant="destructive">FAIL</Badge>;
      case 'CHECKING':
        return <Badge variant="secondary">CHECKING</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  const overallStatus = healthChecks.every(check => check.status === 'OK') ? 'OK' :
                       healthChecks.some(check => check.status === 'FAIL') ? 'FAIL' :
                       'CHECKING';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Check del Sistema</h1>
          <p className="text-gray-600">Estado de los servicios principales</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            <span className="font-medium">
              Estado General: {getStatusBadge(overallStatus)}
            </span>
          </div>
          <Button 
            onClick={runAllChecks} 
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {healthChecks.map((check, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{check.name}</CardTitle>
                {getStatusIcon(check.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado:</span>
                  {getStatusBadge(check.status)}
                </div>
                
                <div className="text-sm text-gray-600">
                  <strong>Mensaje:</strong>
                  <p className="mt-1">{check.message}</p>
                </div>
                
                {check.lastChecked && (
                  <div className="text-xs text-gray-500">
                    Última verificación: {check.lastChecked.toLocaleString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resumen del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {healthChecks.filter(check => check.status === 'OK').length}
              </div>
              <div className="text-sm text-green-700">Servicios OK</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {healthChecks.filter(check => check.status === 'FAIL').length}
              </div>
              <div className="text-sm text-red-700">Servicios con Fallas</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {healthChecks.filter(check => check.status === 'CHECKING').length}
              </div>
              <div className="text-sm text-blue-700">Verificando</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}