import { supabase } from './supabase';
import { getJwt } from './session';

// Based on supabase/sql/17_portal_modelo.sql
export interface PortalIdentity {
  user_id: string;
  cliente_id: string | null;
  empresa_id: string | null;
  empresa_rol: string | null;
}

// Simplified types for the portal view
export interface ClientEquipo {
    id: string;
    serial_normalizado: string;
    display_name: string; // Combination of type, brand, model
}

export interface ClientOT {
    id: string;
    ot_code: string;
    estado: string;
    equipo_display: string;
}

export interface ClientPresupuesto {
    id: string;
    numero: string;
    estado: string;
    total: number;
}

export interface ClientVenta {
    id: string;
    numero: string;
    total: number;
    fecha: string;
}


export async function myIdentity(): Promise<PortalIdentity | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('v_portal_identity')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error fetching portal identity:', error);
        return null;
    }
    return data;
}

export async function myEquipos(cliente_id: string): Promise<ClientEquipo[]> {
    const { data, error } = await supabase
        .from('v_equipos_cliente_display') // Using a view for the display name
        .select('id, serial_normalizado, display_name')
        .eq('cliente_id', cliente_id);
    
    if (error) throw error;
    return data || [];
}

export async function myOTs(cliente_id: string): Promise<ClientOT[]> {
    const { data, error } = await supabase
        .from('v_ot_detalle') // Using the detail view
        .select('id, ot_code, estado, equipo_display')
        .eq('cliente_id', cliente_id)
        .order('fecha_recepcion', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function myPresupuestos(cliente_id: string): Promise<ClientPresupuesto[]> {
    const { data, error } = await supabase
        .from('presupuestos')
        .select('id, numero, estado, total')
        .eq('cliente_id', cliente_id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function myVentas(cliente_id: string): Promise<ClientVenta[]> {
    const { data, error } = await supabase
        .from('ventas')
        .select('id, numero, total, fecha')
        .eq('cliente_id', cliente_id)
        .order('fecha', { ascending: false });
        
    if (error) throw error;
    return data || [];
}
