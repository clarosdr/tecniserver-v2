
import React, { useState, useEffect, useCallback } from 'react';
import { Cliente, Equipo, getClient, listEquipos } from '../services/clients';
import ClientSearch from '../components/clients/ClientSearch';
import ClientForm from '../components/clients/ClientForm';
import EquipoForm from '../components/equipos/EquipoForm';

type ViewState = 'search' | 'client_form' | 'equipo_form';

export default function ClientsPage() {
    const [view, setView] = useState<ViewState>('search');
    const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
    const [clientForEdit, setClientForEdit] = useState<Cliente | null>(null);
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [loadingEquipos, setLoadingEquipos] = useState(false);
    
    const fetchEquipos = useCallback(async (clientId: string) => {
        setLoadingEquipos(true);
        try {
            const data = await listEquipos(clientId);
            setEquipos(data);
        } catch (error) {
            console.error(error);
            alert('Error al cargar los equipos del cliente.');
        } finally {
            setLoadingEquipos(false);
        }
    }, []);

    const handleSelectClient = async (clientId: string) => {
        try {
            const clientData = await getClient(clientId);
            setSelectedClient(clientData);
            if (clientData) {
                fetchEquipos(clientData.id);
            }
        } catch (error) {
            alert('No se pudo cargar la información del cliente.');
        }
    };

    const handleClientSaved = (clientId: string) => {
        alert('Cliente guardado con éxito.');
        handleSelectClient(clientId);
        setView('search');
        setClientForEdit(null);
    };
    
    const handleEquipoSaved = () => {
        alert('Equipo guardado con éxito.');
        if (selectedClient) {
            fetchEquipos(selectedClient.id);
        }
        setView('search');
    };

    const openNewClientForm = () => {
        setClientForEdit(null);
        setView('client_form');
    }
    
    const pageStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(400px, 40%) 1fr', gap: '2rem', alignItems: 'start' };
    const columnStyle: React.CSSProperties = { backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' };
    const listItemStyle: React.CSSProperties = { padding: '0.5rem', borderBottom: '1px solid #eee' };

    return (
        <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Gestión de Clientes y Equipos</h1>
            <div style={pageStyle}>
                {/* --- Left Column --- */}
                <div style={columnStyle}>
                    {view === 'client_form' ? (
                        <ClientForm
                            initialData={clientForEdit}
                            onSaved={handleClientSaved}
                            onCancel={() => setView('search')}
                        />
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 style={{ margin: 0 }}>Buscar Cliente</h2>
                                <button onClick={openNewClientForm}>Nuevo Cliente</button>
                            </div>
                            <ClientSearch onSelect={handleSelectClient} />
                        </>
                    )}
                </div>

                {/* --- Right Column --- */}
                <div style={columnStyle}>
                    {view === 'equipo_form' && selectedClient ? (
                        <EquipoForm
                            clienteId={selectedClient.id}
                            onSaved={handleEquipoSaved}
                            onCancel={() => setView('search')}
                        />
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 style={{ margin: 0 }}>
                                    Equipos de: {selectedClient ? selectedClient.full_name : '...'}
                                </h2>
                                <button onClick={() => setView('equipo_form')} disabled={!selectedClient}>
                                    Agregar Equipo
                                </button>
                            </div>
                            
                            {!selectedClient ? (
                                <p>Seleccione un cliente de la lista para ver sus equipos.</p>
                            ) : loadingEquipos ? (
                                <p>Cargando equipos...</p>
                            ) : (
                                <ul>
                                    {equipos.length > 0 ? (
                                        equipos.map(eq => (
                                          <li key={eq.id} style={listItemStyle}>
                                            <strong>{eq.display_name}</strong> (S/N: {eq.serial})
                                            {eq.observations && <p style={{fontSize: '0.8rem', color: '#666', margin: '0.2rem 0 0'}}>Notas: {eq.observations}</p>}
                                          </li>
                                        ))
                                    ) : (
                                        <p>Este cliente no tiene equipos registrados.</p>
                                    )}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
