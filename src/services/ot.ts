import { supabase } from './supabase';

export interface WorkOrder {
  id: number;
  created_at: string;
  // Client info
  client_name: string;
  client_phone?: string;
  client_email?: string;
  // Device info
  device_type: string;
  device_brand?: string;
  device_model?: string;
  device_serial?: string;
  // Issue and status
  issue_description: string;
  status: 'Ingresado' | 'En revisión' | 'Presupuestado' | 'Aprobado' | 'Rechazado' | 'En reparación' | 'Reparado' | 'Entregado';
  // Technician and repair info
  technician_notes?: string;
  final_report?: string;
  total_cost?: number;
}

export interface OTAccessory {
  id: number;
  ot_id: number;
  descripcion: string;
  created_at: string;
}

export interface OTHistory {
  id: number;
  ot_id: number;
  evento: string;
  detalle?: string;
  created_at: string;
}

export interface OTDetailed extends WorkOrder {
  accesorios: OTAccessory[];
  historial: OTHistory[];
}

export interface ListOTParams {
  estado?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListOTResult {
  items: WorkOrder[];
  total: number;
}

/**
 * Lista órdenes de trabajo desde la vista v_ot_detalle
 */
export async function listOT(params: ListOTParams = {}): Promise<ListOTResult> {
  try {
    const { estado, search, limit = 20, offset = 0 } = params;
    
    let query = supabase
      .from('v_ot_detalle')
      .select('*', { count: 'exact' });

    // Filtro por estado
    if (estado) {
      query = query.eq('estado', estado);
    }

    // Filtro de búsqueda
    if (search) {
      query = query.or(`ot_code.ilike.%${search}%,cliente_nombre.ilike.%${search}%,equipo_serial.ilike.%${search}%`);
    }

    // Ordenamiento y paginación
    query = query
      .order('fecha_recepcion', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error listing work orders:', error);
      throw new Error(`Error al listar órdenes de trabajo: ${error.message}`);
    }

    return {
      items: data || [],
      total: count || 0
    };
  } catch (error) {
    console.error('Error in listOT:', error);
    throw error;
  }
}

/**
 * Obtiene una orden de trabajo específica con accesorios e historial
 */
export async function getOT(id: string): Promise<OTDetailed | null> {
  try {
    // Obtener datos principales de la OT
    const { data: otData, error: otError } = await supabase
      .from('v_ot_detalle')
      .select('*')
      .eq('id', id)
      .single();

    if (otError) {
      if (otError.code === 'PGRST116') {
        return null; // No encontrado
      }
      console.error('Error fetching work order:', otError);
      throw new Error(`Error al obtener orden de trabajo: ${otError.message}`);
    }

    // Obtener accesorios
    const { data: accesorios, error: accError } = await supabase
      .from('ot_accesorios')
      .select('*')
      .eq('ot_id', id)
      .order('created_at', { ascending: true });

    if (accError) {
      console.error('Error fetching accessories:', accError);
      throw new Error(`Error al obtener accesorios: ${accError.message}`);
    }

    // Obtener historial
    const { data: historial, error: histError } = await supabase
      .from('ot_historial')
      .select('*')
      .eq('ot_id', id)
      .order('created_at', { ascending: true });

    if (histError) {
      console.error('Error fetching history:', histError);
      throw new Error(`Error al obtener historial: ${histError.message}`);
    }

    return {
      ...otData,
      accesorios: accesorios || [],
      historial: historial || []
    };
  } catch (error) {
    console.error('Error in getOT:', error);
    throw error;
  }
}

/**
 * Crea una nueva orden de trabajo
 */
export async function createOT(input: Omit<WorkOrder, 'id' | 'created_at'>): Promise<{ id: number }> {
  try {
    const { data, error } = await supabase
      .from('ot')
      .insert(input)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating work order:', error);
      throw new Error(`Error al crear orden de trabajo: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in createOT:', error);
    throw error;
  }
}

/**
 * Actualiza una orden de trabajo existente
 */
export async function updateOT(id: string, patch: Partial<Omit<WorkOrder, 'id' | 'created_at'>>): Promise<void> {
  try {
    const { error } = await supabase
      .from('ot')
      .update(patch)
      .eq('id', id);

    if (error) {
      console.error('Error updating work order:', error);
      throw new Error(`Error al actualizar orden de trabajo: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in updateOT:', error);
    throw error;
  }
}

/**
 * Agrega un accesorio a una orden de trabajo
 */
export async function addAccessory(ot_id: string, descripcion: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ot_accesorios')
      .insert({
        ot_id,
        descripcion
      });

    if (error) {
      console.error('Error adding accessory:', error);
      throw new Error(`Error al agregar accesorio: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in addAccessory:', error);
    throw error;
  }
}

/**
 * Agrega una entrada al historial de una orden de trabajo
 */
export async function addHistory(ot_id: string, evento: string, detalle?: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ot_historial')
      .insert({
        ot_id,
        evento,
        detalle
      });

    if (error) {
      console.error('Error adding history:', error);
      throw new Error(`Error al agregar historial: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in addHistory:', error);
    throw error;
  }
}

// Mantener compatibilidad con funciones existentes
export async function getWorkOrders(): Promise<WorkOrder[]> {
  const result = await listOT();
  return result.items;
}

export async function getWorkOrderById(id: number): Promise<WorkOrder | null> {
  const ot = await getOT(id.toString());
  if (!ot) return null;
  
  // Extraer solo los campos de WorkOrder
  const { accesorios, historial, ...workOrder } = ot;
  return workOrder;
}
