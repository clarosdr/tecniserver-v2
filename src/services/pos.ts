
import { supabase } from './supabase';

// --- TYPE DEFINITIONS ---

export interface PosProduct {
  id: string;
  nombre: string;
  precio: number;
  iva_pct: number;
  tipo: 'producto' | 'servicio';
}

export interface CartItem {
  product: PosProduct;
  quantity: number;
  unit_price: number;
  discount_pct: number;
}

export interface Payment {
  method: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  amount: number;
}

export interface Venta {
  id: string;
  cliente_id?: string;
  ot_id?: number;
  caja_apertura_id: string;
  fecha_venta: string;
  subtotal: number;
  iva_total: number;
  total: number;
  estado: 'pendiente' | 'pagada' | 'cancelada';
  created_at: string;
  updated_at: string;
}

export interface VentaItem {
  id: string;
  venta_id: string;
  producto_id: string;
  lote_id?: string;
  cantidad: number;
  precio_unit: number;
  iva_pct: number;
  subtotal: number;
  iva_monto: number;
  total: number;
}

export interface VentaPago {
  id: string;
  venta_id: string;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  monto: number;
  referencia?: string;
  fecha_pago: string;
}

export interface CajaApertura {
  id: string;
  usuario_apertura_id: string;
  fecha_apertura: string;
  monto_inicial: number;
  usuario_cierre_id?: string;
  fecha_cierre?: string;
  monto_final?: number;
}

export interface Caja {
  id: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
}

export interface ListVentasParams {
  estado?: 'pendiente' | 'pagada' | 'cancelada';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListVentasResult {
  data: Venta[];
  count: number;
}

// --- CASH REGISTER FUNCTIONS ---

/**
 * Gets all available cash registers.
 */
export async function cajas(): Promise<Caja[]> {
  const { data, error } = await supabase
    .from('cajas')
    .select('*')
    .eq('activa', true)
    .order('nombre');

  if (error) {
    console.error('Error fetching cash registers:', error);
    throw new Error(`Error al obtener cajas: ${error.message}`);
  }

  return data || [];
}

/**
 * Opens a cash register with initial balance.
 */
export async function openCaja(caja_id: string, saldo_inicial: number): Promise<CajaApertura> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('cajas_aperturas')
    .insert({
      caja_id,
      usuario_apertura_id: user.id,
      monto_inicial: saldo_inicial,
      fecha_apertura: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error opening cash register:', error);
    throw new Error(`Error al abrir caja: ${error.message}`);
  }

  return data;
}

/**
 * Gets the current user's open cash register session.
 */
export async function myCajaAbierta(): Promise<CajaApertura | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('cajas_aperturas')
    .select('*')
    .eq('usuario_apertura_id', user.id)
    .is('usuario_cierre_id', null)
    .order('fecha_apertura', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error getting open cash register:', error);
    throw new Error(`Error al obtener caja abierta: ${error.message}`);
  }

  return data;
}

// --- SALES FUNCTIONS ---

/**
 * Creates a new sale.
 */
export async function createVenta(params: {
  cliente_id?: string;
  ot_id?: number;
  caja_apertura_id: string;
}): Promise<Venta> {
  const { data, error } = await supabase
    .from('ventas')
    .insert({
      cliente_id: params.cliente_id,
      ot_id: params.ot_id,
      caja_apertura_id: params.caja_apertura_id,
      fecha_venta: new Date().toISOString(),
      subtotal: 0,
      iva_total: 0,
      total: 0,
      estado: 'pendiente'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating sale:', error);
    throw new Error(`Error al crear venta: ${error.message}`);
  }

  return data;
}

/**
 * Lists sales with optional filters.
 */
export async function listVentas(params: ListVentasParams = {}): Promise<ListVentasResult> {
  let query = supabase
    .from('ventas')
    .select('*', { count: 'exact' });

  if (params.estado) {
    query = query.eq('estado', params.estado);
  }

  if (params.search) {
    query = query.or(`id.ilike.%${params.search}%,cliente_id.ilike.%${params.search}%`);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  if (params.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error listing sales:', error);
    throw new Error(`Error al listar ventas: ${error.message}`);
  }

  return {
    data: data || [],
    count: count || 0
  };
}

/**
 * Gets a specific sale by ID.
 */
export async function getVenta(id: string): Promise<Venta | null> {
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error getting sale:', error);
    throw new Error(`Error al obtener venta: ${error.message}`);
  }

  return data;
}

/**
 * Cancels a sale.
 */
export async function cancelarVenta(id: string): Promise<void> {
  const { error } = await supabase
    .from('ventas')
    .update({ estado: 'cancelada' })
    .eq('id', id);

  if (error) {
    console.error('Error canceling sale:', error);
    throw new Error(`Error al cancelar venta: ${error.message}`);
  }
}

// --- SALES ITEMS FUNCTIONS ---

/**
 * Adds an item to a sale.
 */
export async function addItem(venta_id: string, params: {
  producto_id: string;
  lote_id?: string;
  cantidad: number;
  precio_unit: number;
  iva_pct?: number;
}): Promise<VentaItem> {
  const iva_pct = params.iva_pct || 0;
  const subtotal = params.cantidad * params.precio_unit;
  const iva_monto = subtotal * (iva_pct / 100);
  const total = subtotal + iva_monto;

  const { data, error } = await supabase
    .from('ventas_items')
    .insert({
      venta_id,
      producto_id: params.producto_id,
      lote_id: params.lote_id,
      cantidad: params.cantidad,
      precio_unit: params.precio_unit,
      iva_pct,
      subtotal,
      iva_monto,
      total
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding item to sale:', error);
    throw new Error(`Error al agregar item: ${error.message}`);
  }

  // Update sale totals
  await updateVentaTotals(venta_id);

  return data;
}

/**
 * Removes an item from a sale.
 */
export async function removeItem(item_id: string): Promise<void> {
  // Get the venta_id before deleting
  const { data: item } = await supabase
    .from('ventas_items')
    .select('venta_id')
    .eq('id', item_id)
    .single();

  const { error } = await supabase
    .from('ventas_items')
    .delete()
    .eq('id', item_id);

  if (error) {
    console.error('Error removing item:', error);
    throw new Error(`Error al eliminar item: ${error.message}`);
  }

  // Update sale totals if we have the venta_id
  if (item?.venta_id) {
    await updateVentaTotals(item.venta_id);
  }
}

// --- PAYMENTS FUNCTIONS ---

/**
 * Adds a payment to a sale.
 */
export async function addPago(venta_id: string, params: {
  metodo: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  monto: number;
  referencia?: string;
}): Promise<VentaPago> {
  const { data, error } = await supabase
    .from('ventas_pagos')
    .insert({
      venta_id,
      metodo: params.metodo,
      monto: params.monto,
      referencia: params.referencia,
      fecha_pago: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding payment:', error);
    throw new Error(`Error al agregar pago: ${error.message}`);
  }

  // Check if sale is fully paid and update status
  await checkAndUpdateVentaStatus(venta_id);

  return data;
}

// --- HELPER FUNCTIONS ---

/**
 * Updates sale totals based on items.
 */
async function updateVentaTotals(venta_id: string): Promise<void> {
  const { data: items } = await supabase
    .from('ventas_items')
    .select('subtotal, iva_monto, total')
    .eq('venta_id', venta_id);

  if (!items) return;

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const iva_total = items.reduce((sum, item) => sum + item.iva_monto, 0);
  const total = items.reduce((sum, item) => sum + item.total, 0);

  await supabase
    .from('ventas')
    .update({ subtotal, iva_total, total })
    .eq('id', venta_id);
}

/**
 * Checks if sale is fully paid and updates status.
 */
async function checkAndUpdateVentaStatus(venta_id: string): Promise<void> {
  const [ventaResult, pagosResult] = await Promise.all([
    supabase.from('ventas').select('total, estado').eq('id', venta_id).single(),
    supabase.from('ventas_pagos').select('monto').eq('venta_id', venta_id)
  ]);

  if (ventaResult.error || pagosResult.error) return;

  const venta = ventaResult.data;
  const pagos = pagosResult.data || [];
  
  const totalPagado = pagos.reduce((sum, pago) => sum + pago.monto, 0);
  
  if (totalPagado >= venta.total && venta.estado === 'pendiente') {
    await supabase
      .from('ventas')
      .update({ estado: 'pagada' })
      .eq('id', venta_id);
  }
}

// --- LEGACY FUNCTIONS (for compatibility) ---

export async function searchPosProducts(search: string): Promise<PosProduct[]> {
  const { data, error } = await supabase.rpc('fn_search_pos_products', { p_search_term: search });
  if (error) {
    console.error('Error searching products for POS:', error);
    throw error;
  }
  return data || [];
}

export async function getWorkOrderForPos(otId: number): Promise<{ client_id: string, items: unknown[] } | null> {
  const { data, error } = await supabase.rpc('fn_get_ot_for_pos', { p_ot_id: otId });
  if (error) {
    console.error('Error fetching work order for POS:', error);
    throw error;
  }
  return data;
}

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

export async function getActiveCashDrawer(): Promise<CajaApertura | null> {
  return myCajaAbierta();
}

export async function openCashDrawer(initialAmount: number): Promise<CajaApertura> {
  const cajasList = await cajas();
  if (cajasList.length === 0) {
    throw new Error('No hay cajas disponibles');
  }
  return openCaja(cajasList[0].id, initialAmount);
}
