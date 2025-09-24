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

export async function getWorkOrders(): Promise<WorkOrder[]> {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching work orders:', error);
    throw error;
  }

  return data || [];
}

export async function getWorkOrderById(id: number): Promise<WorkOrder | null> {
    if (isNaN(id)) return null;
    const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error fetching work order with id ${id}:`, error.message);
        // .single() throws an error if no row is found, which is expected.
        // We'll return null in that case instead of propagating the error.
        return null;
    }

    return data;
}
