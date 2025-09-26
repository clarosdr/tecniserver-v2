import { supabase } from './supabase';

export type BudgetStatus = 'borrador' | 'enviado' | 'aprobado' | 'rechazado' | 'vencido' | 'convertido';

export interface Budget {
  id: string; // uuid
  numero: string;
  cliente_id: string;
  cliente_nombre: string;
  total: number;
  estado: BudgetStatus;
  vence_at: string; // date
  created_at: string;
}

interface ListBudgetsParams {
  estado?: BudgetStatus;
}

/**
 * Lista los presupuestos, opcionalmente filtrados por estado.
 */
export async function listBudgets({ estado }: ListBudgetsParams = {}): Promise<Budget[]> {
  let query = supabase
    .from('v_presupuestos_detalle') // Usamos una vista que ya une el nombre del cliente
    .select('id, numero, cliente_id, cliente_nombre, total, estado, vence_at, created_at')
    .order('created_at', { ascending: false });

  if (estado) {
    query = query.eq('estado', estado);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching budgets:', error);
    throw error;
  }

  return data || [];
}

/**
 * Llama a la función RPC para convertir un presupuesto en una venta.
 * @param presupuestoId El UUID del presupuesto a convertir.
 * @param cajaAperturaId (Opcional) El UUID de la apertura de caja actual.
 * @returns El UUID de la nueva venta creada.
 */
export async function convertToSale(presupuestoId: string, cajaAperturaId?: string): Promise<string> {
  const { data, error } = await supabase.rpc('fn_convert_presupuesto_to_venta', {
    p_presupuesto_id: presupuestoId,
    p_caja_apertura_id: cajaAperturaId || null,
  });

  if (error) {
    console.error('Error converting budget to sale:', error);
    // Provide a more user-friendly error message
    if (error.message.includes('Presupuesto no encontrado o no está en estado "aprobado"')) {
        throw new Error('El presupuesto no se puede convertir. Asegúrate de que existe y está en estado "aprobado".');
    }
    throw new Error('Ocurrió un error al convertir el presupuesto a venta.');
  }

  return data; // This should be the new venta_id
}
