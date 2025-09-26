import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Search, Settings, Key, Eye, EyeOff, Server, AlertCircle, CheckCircle } from 'lucide-react';
import { listProviders, listKeysVisible, AIProvider, AIKey } from '../../services/ai';
import { toast } from 'sonner';

export default function AIProvidersPage() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [keys, setKeys] = useState<AIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('providers');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [providersData, keysData] = await Promise.all([
          listProviders(),
        listKeysVisible()
      ]);
      setProviders(providersData);
      setKeys(keysData);
    } catch (error) {
      console.error('Error loading AI data:', error);
      toast.error('Error al cargar los datos de AI');
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter(provider =>
    provider.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredKeys = keys.filter(key =>
    key.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.provider?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProviderTypeColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'openai': return 'bg-green-100 text-green-800';
      case 'anthropic': return 'bg-blue-100 text-blue-800';
      case 'google': return 'bg-yellow-100 text-yellow-800';
      case 'azure': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Proveedores de AI</h1>
          <p className="text-gray-600">Gestión de proveedores y claves de API</p>
        </div>
        <Button onClick={loadData} variant="outline">
          Actualizar
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar proveedores o claves..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Proveedores ({providers.length})
          </TabsTrigger>
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Claves API ({keys.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          {filteredProviders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No se encontraron proveedores</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProviders.map((provider) => (
                <Card key={provider.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{provider.nombre}</CardTitle>
                      {provider.activo ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tipo:</span>
                      <Badge className={getProviderTypeColor(provider.tipo)}>
                        {provider.tipo}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estado:</span>
                      <Badge variant={provider.activo ? 'default' : 'secondary'}>
                        {provider.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>

                    <div className="text-xs text-gray-500">
                      <p>Creado: {new Date(provider.created_at).toLocaleDateString()}</p>
                      <p>Actualizado: {new Date(provider.updated_at).toLocaleDateString()}</p>
                    </div>

                    {provider.configuracion && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                        <p className="font-medium text-gray-700 mb-1">Configuración:</p>
                        <pre className="text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(provider.configuracion, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          {filteredKeys.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Key className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No se encontraron claves API</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredKeys.map((key) => (
                <Card key={key.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Key className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="font-medium">{key.nombre}</h3>
                          <p className="text-sm text-gray-600">
                            Provider: {key.provider?.nombre || 'N/A'}
                          </p>
                        </div>
                      </div>
                      {key.activa ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Clave:</span>
                        <p className="font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                          ****{key.key_visible}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-gray-600">Tipo Provider:</span>
                        <Badge className={`mt-1 ${getProviderTypeColor(key.provider?.tipo || '')}`}>
                          {key.provider?.tipo || 'N/A'}
                        </Badge>
                      </div>

                      <div>
                        <span className="text-gray-600">Estado:</span>
                        <Badge 
                          variant={key.activa ? 'default' : 'secondary'}
                          className="mt-1"
                        >
                          {key.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>

                      <div>
                        <span className="text-gray-600">Creada:</span>
                        <p className="text-gray-800 mt-1">
                          {new Date(key.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}