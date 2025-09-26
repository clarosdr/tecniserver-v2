
import { supabase } from './supabase';

// --- TYPE DEFINITIONS ---

export interface PosProduct {
  id: string; // Could be from inventory or marketplace
  nombre: string;
  precio: number;
  iva_pct: number;
  tipo: 'producto' | 'servicio';
}

export interface CartItem {
  product: PosProduct;
  quantity: number;
  unit_price: number; // Price can be overridden
  discount_pct: number;
}

export interface Payment {
  method: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  amount: number;
}

export interface Venta {
    id: string;
    // ... other fields
}

export interface CajaApertura {
    id: string;
    usuario_apertura_id: string;
    fecha_apertura: string;
    monto_inicial: number;
    // ...
}

/**
 * Searches for products and services available for sale.
 */
export async function searchPosProducts(search: string): Promise<PosProduct[]> {
  const { data, error } = await supabase.rpc('fn_search_pos_products', { p_search_term: search });
  if (error) {
    console.error('Error searching products for POS:', error);
    throw error;
  }
  return data || [];
}

/**
 * Gets details from a work order to pre-populate the cart.
 */
export async function getWorkOrderForPos(otId: number): Promise<{ client_id: string, items: unknown[] } | null> {
    const { data, error } = await supabase.rpc('fn_get_ot_for_pos', { p_ot_id: otId });
    if (error) {
        console.error('Error fetching work order for POS:', error);
        throw error;
    }
    // We expect the function to return a client ID and a list of items to add to the cart.
    return data;
}

/**
 * Creates a sale transaction.
 */
export async function createSale(
  payload: {
    cliente_id: string;
    items: { product_id: string; quantity: number; unit_price: number; discount_pct: number }[];
    payments: { method: string; amount: number }[];
    ot_id?: number | null;
    caja_apertura_id: string;
  }
): Promise<{ venta_id: string }> {
  const { data, error } = await supabase.rpc('fn_create_sale', {
    p_cliente_id: payload.cliente_id,
    p_items: payload.items,
    p_payments: payload.payments,
    p_ot_id: payload.ot_id,
    p_caja_apertura_id: payload.caja_apertura_id,
  });

  if (error) {
    console.error('Error creating sale:', error);
    throw new Error(`Error al crear la venta: ${error.message}`);
  }

  return data;
}

/**
 * Gets the current active cash drawer session for the logged-in user.
 */
export async function getActiveCashDrawer(): Promise<CajaApertura | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('cajas_aperturas')
        .select('*')
        .is('usuario_cierre_id', null) // not closed
        .eq('usuario_apertura_id', user.id)
        .order('fecha_apertura', { ascending: false })
        .limit(1)
        .single();
    
    if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error
        console.error('Error getting active cash drawer:', error);
        return null;
    }
    
    return data;
}

/**
 * Opens a new cash drawer session.
 */
export async function openCashDrawer(initialAmount: number): Promise<CajaApertura> {
    const { data, error } = await supabase.rpc('fn_open_caja', { p_monto_inicial: initialAmount });
    if (error) {
        console.error('Error opening cash drawer:', error);
        throw new Error(`Error al abrir caja: ${error.message}`);
    }
    return data;
}
