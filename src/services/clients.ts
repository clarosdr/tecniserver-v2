

import { supabase } from './supabase';

// --- TYPE DEFINITIONS ---

export interface Cliente {
  id: string;
  full_name: string;
  fiscal_id: string;
  email: string | null;
  phone: string | null;
}

export interface Equipo {
  id: string;
  cliente_id: string;
  tipo_equipo_slug: string;
  marca_slug: string;
  modelo_slug: string;
  serial: string;
  observations: string | null;
  // From view
  display_name?: string;
}

export interface CatalogoTipoEquipo {
  slug: string;
  nombre: string;
}
export interface CatalogoMarca {
  slug: string;
  nombre: string;
}
export interface CatalogoModelo {
  slug: string;
  marca_slug: string;
  nombre: string;
}

export interface CatalogosCompletos {
    tipos: CatalogoTipoEquipo[];
    marcas: CatalogoMarca[];
    modelos: CatalogoModelo[];
}


// --- API FUNCTIONS ---

/**
 * Lists clients with pagination and search.
 */
export async function listClients({ search = '', limit = 10, offset = 0 }): Promise<{ data: Cliente[], count: number }> {
  let query = supabase
    .from('clientes')
    .select('id, full_name, fiscal_id, email, phone', { count: 'exact' });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,fiscal_id.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order('full_name')
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

/**
 * Gets a single client by their ID.
 */
export async function getClient(id: string): Promise<Cliente | null> {
    if (!id) return null;
    const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
}

/**
 * Creates a new client.
 */
export async function createClient(input: { full_name: string, fiscal_id: string, email?: string | null, phone?: string | null }): Promise<Cliente> {
    const { data, error } = await supabase.from('clientes').insert(input).select().single();
    if (error) throw error;
    return data;
}

/**
 * Updates an existing client.
 */
export async function updateClient(id: string, patch: Partial<Omit<Cliente, 'id'>>): Promise<Cliente> {
    const { data, error } = await supabase.from('clientes').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

/**
 * Lists equipment for a specific client.
 */
export async function listEquipos(clienteId: string): Promise<Equipo[]> {
    if (!clienteId) return [];
    // Using the view to get a nice display name for the equipment
    const { data, error } = await supabase
        .from('v_equipos_cliente_display')
        // FIX: Added missing fields to the select statement to match the `Equipo` type.
        .select('id, cliente_id, tipo_equipo_slug, marca_slug, modelo_slug, serial, display_name, observations')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Creates a new piece of equipment for a client.
 */
export async function createEquipo(input: { cliente_id: string; tipo_equipo_slug: string; marca_slug: string; modelo_slug: string; serial: string; observations?: string | null }): Promise<Equipo> {
    const { data, error } = await supabase.from('equipos_cliente').insert(input).select().single();
    if (error) throw error;
    return data;
}

/**
 * Fetches all catalogs needed for forms.
 */
export async function getCatalogos(): Promise<CatalogosCompletos> {
    const [tiposRes, marcasRes, modelosRes] = await Promise.all([
        supabase.from('catalogo_tipo_equipo').select('slug, nombre'),
        supabase.from('catalogo_marcas').select('slug, nombre'),
        supabase.from('catalogo_modelos').select('slug, marca_slug, nombre')
    ]);

    if (tiposRes.error) throw tiposRes.error;
    if (marcasRes.error) throw marcasRes.error;
    if (modelosRes.error) throw modelosRes.error;

    return {
        tipos: tiposRes.data || [],
        marcas: marcasRes.data || [],
        modelos: modelosRes.data || [],
    };
}