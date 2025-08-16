
import React, { useState, useContext } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TextArea from '../components/common/TextArea';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { generateDiagnosticTemplate, getWebSearchResults } from '../services/geminiService';
import { UserRole, GroundingChunk } from '../types';
import { AuthContext } from '../contexts/AuthContext'; // Updated import path

const SettingsPage: React.FC = () => {
  const auth = useContext(AuthContext);
  const [problemDescription, setProblemDescription] = useState('');
  const [diagnosticTemplate, setDiagnosticTemplate] = useState('');
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [webSearchResults, setWebSearchResults] = useState('');
  const [webSearchSources, setWebSearchSources] = useState<GroundingChunk[]>([]);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);

  // Simulated states for Client Portal Settings
  const [portalEnabled, setPortalEnabled] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("Bienvenido al portal de clientes de TecniServer Pro. Aquí puede gestionar sus servicios.");
  const [featureRequestService, setFeatureRequestService] = useState(true);
  const [featureViewEquipment, setFeatureViewEquipment] = useState(true);
  const [featureViewOrders, setFeatureViewOrders] = useState(true);

  const handleGenerateTemplate = async () => {
    if (!problemDescription.trim()) {
      alert('Por favor, ingrese una descripción del problema.');
      return;
    }
    setIsGeneratingTemplate(true);
    setDiagnosticTemplate('');
    try {
      const template = await generateDiagnosticTemplate(problemDescription);
      setDiagnosticTemplate(template);
    } catch (error) {
      console.error("Error in AI template generation:", error);
      setDiagnosticTemplate('Error al generar la plantilla. Verifique la consola.');
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const handleWebSearch = async () => {
    if (!webSearchQuery.trim()) {
        alert('Por favor, ingrese un término de búsqueda.');
        return;
    }
    setIsSearchingWeb(true);
    setWebSearchResults('');
    setWebSearchSources([]);
    try {
        const { text, sources } = await getWebSearchResults(webSearchQuery);
        setWebSearchResults(text);
        setWebSearchSources(sources);
    } catch (error) {
        console.error("Error in web search:", error);
        setWebSearchResults('Error al realizar la búsqueda. Verifique la consola.');
    } finally {
        setIsSearchingWeb(false);
    }
  };

  const roles = [UserRole.Admin, UserRole.Technician, UserRole.Receptionist, UserRole.Accountant];
  const permissions = {
    [UserRole.Admin]: ['Todo el acceso', 'Gestionar usuarios', 'Configuraciones avanzadas'],
    [UserRole.Technician]: ['Gestionar OTs', 'Usar inventario', 'Ver clientes'],
    [UserRole.Receptionist]: ['Crear OTs', 'Gestionar clientes', 'Ver inventario básico'],
    [UserRole.Accountant]: ['Acceso a Contabilidad', 'Generar reportes financieros'],
  };

  if (auth?.user?.role !== UserRole.Admin) {
    return (
        <Card title="Acceso Denegado">
            <p className="text-slate-700 dark:text-slate-300">Esta sección es solo para administradores.</p>
        </Card>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-6">Configuraciones Avanzadas</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Configuración del Portal de Clientes" id="client-portal-config">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Administre las funcionalidades y apariencia del portal accesible para sus clientes. (Configuraciones simuladas)
            </p>
            <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 dark:text-slate-200">Habilitar Portal de Clientes Globalmente</span>
                <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${portalEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}>
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${portalEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
                    <input type="checkbox" className="absolute opacity-0 w-0 h-0" checked={portalEnabled} onChange={() => setPortalEnabled(!portalEnabled)} />
                </div>
                </label>
                <TextArea label="Mensaje de Bienvenida del Portal" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={2} placeholder="Mensaje que verán los clientes al ingresar al portal."/>
                
                <fieldset className="border border-slate-200 dark:border-slate-700 p-3 rounded">
                    <legend className="text-xs font-medium text-slate-500 dark:text-slate-400 px-1">Módulos Habilitados en Portal (Ejemplos)</legend>
                    <div className="space-y-2 mt-1">
                        <label className="flex items-center">
                            <input type="checkbox" className="form-checkbox h-4 w-4 text-primary rounded" checked={featureRequestService} onChange={() => setFeatureRequestService(!featureRequestService)}/>
                            <span className="ml-2 text-sm text-slate-700 dark:text-slate-200">Permitir Solicitud de Nuevos Servicios</span>
                        </label>
                         <label className="flex items-center">
                            <input type="checkbox" className="form-checkbox h-4 w-4 text-primary rounded" checked={featureViewEquipment} onChange={() => setFeatureViewEquipment(!featureViewEquipment)}/>
                            <span className="ml-2 text-sm text-slate-700 dark:text-slate-200">Permitir Ver Mis Equipos</span>
                        </label>
                         <label className="flex items-center">
                            <input type="checkbox" className="form-checkbox h-4 w-4 text-primary rounded" checked={featureViewOrders} onChange={() => setFeatureViewOrders(!featureViewOrders)}/>
                            <span className="ml-2 text-sm text-slate-700 dark:text-slate-200">Permitir Ver Mis Órdenes y Presupuestos</span>
                        </label>
                    </div>
                </fieldset>
                <Button variant="primary" size="sm" onClick={() => alert("Configuración del portal guardada (simulado).")}>Guardar Configuración Portal</Button>
            </div>
        </Card>

        <Card title="Generador de Plantillas de Diagnóstico (IA)">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Ingrese una descripción del problema técnico para generar una plantilla de diagnóstico detallada.
          </p>
          <TextArea
            label="Descripción del Problema Técnico"
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="Ej: Laptop no enciende, pantalla azul al iniciar Windows, impresora no imprime..."
            rows={3}
          />
          <Button onClick={handleGenerateTemplate} isLoading={isGeneratingTemplate} disabled={isGeneratingTemplate} className="mt-2">
            {isGeneratingTemplate ? 'Generando...' : 'Generar Plantilla'}
          </Button>
          {isGeneratingTemplate && <LoadingSpinner text="Procesando con IA..." className="mt-4" />}
          {diagnosticTemplate && !isGeneratingTemplate && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Plantilla Generada:</h4>
              <pre className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300 font-mono">{diagnosticTemplate}</pre>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Búsqueda Web Asistida por IA (Google Search)">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Realiza búsquedas web para obtener información actualizada sobre problemas técnicos, componentes, etc.
            </p>
            <Input
                label="Consulta de Búsqueda"
                value={webSearchQuery}
                onChange={(e) => setWebSearchQuery(e.target.value)}
                placeholder="Ej: Últimos drivers Nvidia RTX 4070, solución error 0x80070057 Windows..."
            />
            <Button onClick={handleWebSearch} isLoading={isSearchingWeb} disabled={isSearchingWeb} className="mt-2">
                {isSearchingWeb ? 'Buscando...' : 'Buscar en la Web'}
            </Button>
            {isSearchingWeb && <LoadingSpinner text="Buscando en la web..." className="mt-4" />}
            {webSearchResults && !isSearchingWeb && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 max-h-96 overflow-y-auto">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Resultados de la Búsqueda:</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{webSearchResults}</p>
                    {webSearchSources.length > 0 && (
                        <div className="mt-3">
                            <h5 className="font-semibold text-xs text-slate-600 dark:text-slate-400 mb-1">Fuentes:</h5>
                            <ul className="list-disc list-inside space-y-1">
                                {webSearchSources.map((source, index) => (
                                    <li key={index} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                        <a href={source.web?.uri || source.retrievedContext?.uri} target="_blank" rel="noopener noreferrer">
                                            {source.web?.title || source.retrievedContext?.title || source.web?.uri || source.retrievedContext?.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </Card>

        <Card title="Seguridad y Permisos" className="lg:col-span-1"> {/* Changed col-span */}
          <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-3">Autenticación de Dos Factores (2FA)</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            La autenticación de dos factores (2FA) está actualmente <span className="font-semibold text-emerald-600 dark:text-emerald-400">Activada (Simulado)</span>.
          </p>
          <Button variant="secondary" size="sm">Configurar 2FA</Button>

          <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mt-6 mb-3">Gestión de Roles y Permisos</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Rol</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Permisos Asignados</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {roles.map(role => (
                  <tr key={role}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{role}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      <ul className="list-disc list-inside">
                        {(permissions[role as keyof typeof permissions] || []).map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="primary" className="mt-4" onClick={() => alert('Navegar a Gestión de Usuarios y Roles (Simulado).')}>Administrar Usuarios y Roles</Button>
        </Card>
      </div>

      <Card title="Otras Innovaciones y Automatización" className="lg:col-span-2">
            <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-3">Mantenimientos Preventivos Programados</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Configure la creación automática de Órdenes de Trabajo para mantenimientos periódicos basados en el historial de equipos.
            </p>
            <Button variant="secondary" onClick={() => alert('Ir a Configuración de Mantenimientos Preventivos (Simulado).')}>Configurar Preventivos</Button>
      </Card>

    </div>
  );
};

export default SettingsPage;