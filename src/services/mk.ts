import { supabase } from './supabase';

// Based on supabase/sql/19_marketplace_modelo.sql
export interface MkProduct {
  id: string; // uuid
  empresa_id: string; // uuid
  sku: string;
  nombre: string;
  descripcion: string;
  precio: number;
  iva_pct: number;
  activo: boolean;
  stock_publicado?: number;
  media?: {
    images?: string[];
    videos?: string[];
  };
  created_at: string;
  // Joined from empresas table
  empresa_nombre: string;
}

export interface MkCompany {
  id: string; // uuid
  nombre: string;
}

export type OrderStatus = 'pendiente' | 'en_proceso' | 'enviada' | 'entregada' | 'cancelada';

export interface MkOrder {
    id: string;
    numero: string;
    cliente_id: string;
    empresa_id: string;
    estado: OrderStatus;
    total: number;
    created_at: string;
    cliente_nombre: string;
}

export interface MkOrderItem {
    id: number;
    // ... other fields
}

interface ListProductsParams {
  search?: string;
  empresaId?: string;
  min?: number;
  max?: number;
  limit?: number;
  offset?: number;
}

export async function listProducts({
  search,
  empresaId,
  min,
  max,
  limit = 12,
  offset = 0,
}: ListProductsParams): Promise<{ data: MkProduct[], count: number }> {
  let query = supabase
    .from('mk_products')
    .select(`
      id,
      empresa_id,
      sku,
      nombre,
      descripcion,
      precio,
      iva_pct,
      media,
      stock_publicado,
      activo,
      created_at,
      empresa:empresas(nombre)
    `, { count: 'exact' })
    .eq('activo', true);

  if (search) {
    query = query.or(`nombre.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  if (empresaId) {
    query = query.eq('empresa_id', empresaId);
  }

  if (min !== undefined && min > 0) {
    query = query.gte('precio', min);
  }

  if (max !== undefined && max > 0) {
    query = query.lte('precio', max);
  }

  const { data, error, count } = await query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching marketplace products:', error);
    throw error;
  }

  const transformedData = data.map((p: any) => ({
      ...p,
      empresa_nombre: p.empresa?.nombre || 'Desconocida'
  }));

  return { data: transformedData || [], count: count || 0 };
}


export async function getProduct(id: string): Promise<MkProduct | null> {
  const { data, error } = await supabase
    .from('mk_products')
    .select(`*`)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data;
}

export async function listCompanies(): Promise<MkCompany[]> {
  const { data, error } = await supabase
    .from('empresas')
    .select('id, nombre')
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }

  return data || [];
}

// --- Partner-specific functions ---

let companyIdCache: string | null = null;

export async function myCompanyId(): Promise<string | null> {
  if (companyIdCache) return companyIdCache;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('v_portal_identity')
    .select('empresa_id')
    .eq('user_id', user.id)
    .single();

  if (error || !data?.empresa_id) {
    console.warn('User is not associated with any company.');
    return null;
  }
  
  companyIdCache = data.empresa_id;
  return data.empresa_id;
}

export async function myProducts(): Promise<MkProduct[]> {
    const companyId = await myCompanyId();
    if (!companyId) return [];

    const { data, error } = await supabase
        .from('mk_products')
        .select('*')
        .eq('empresa_id', companyId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching my products:', error);
        throw error;
    }
    return data || [];
}

export async function updateProduct(id: string, patch: Partial<MkProduct>) {
    const companyId = await myCompanyId();
    if (!companyId) throw new Error("User not associated with a company");
    
    const { data, error } = await supabase
        .from('mk_products')
        .update(patch)
        .eq('id', id)
        .eq('empresa_id', companyId) // Security check
        .select()
        .single();
    
    if (error) {
        console.error('Error updating product:', error);
        throw error;
    }
    return data;
}

export async function createProduct(input: Omit<MkProduct, 'id' | 'created_at' | 'empresa_id' | 'empresa_nombre'>) {
    const companyId = await myCompanyId();
    if (!companyId) throw new Error("User not associated with a company");

    const { data, error } = await supabase
        .from('mk_products')
        .insert([{ ...input, empresa_id: companyId }])
        .select()
        .single();
    
    if (error) {
        console.error('Error creating product:', error);
        throw error;
    }
    return data;
}

export async function myOrders(): Promise<MkOrder[]> {
    const companyId = await myCompanyId();
    if (!companyId) return [];

    const { data, error } = await supabase
        .from('mk_orders')
        .select(`
            *,
            cliente:clientes(full_name)
        `)
        .eq('empresa_id', companyId)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching my orders:', error);
        throw error;
    }

    const transformedData = data.map((o: any) => ({
        ...o,
        cliente_nombre: o.cliente?.full_name || 'Cliente no encontrado'
    }));

    return transformedData || [];
}

export async function updateOrderStatus(id: string, estado: OrderStatus): Promise<MkOrder> {
    const companyId = await myCompanyId();
    if (!companyId) throw new Error("User not associated with a company");

    const { data, error } = await supabase
        .from('mk_orders')
        .update({ estado })
        .eq('id', id)
        .eq('empresa_id', companyId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
    return data;
}
