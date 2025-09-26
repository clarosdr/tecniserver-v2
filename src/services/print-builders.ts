// Tipos para los registros de impresión
export interface OTRecord {
  id: number;
  numero_ot: string;
  cliente_id: string;
  equipo_id: string;
  problema_reportado: string;
  diagnostico?: string;
  solucion?: string;
  estado: string;
  prioridad: string;
  fecha_creacion: string;
  fecha_actualizacion?: string;
  tecnico_asignado?: string;
  costo_mano_obra?: number;
  costo_repuestos?: number;
  total?: number;
  observaciones?: string;
  cliente?: {
    full_name: string;
    fiscal_id: string;
    email?: string;
    phone?: string;
  };
  equipo?: {
    marca: string;
    modelo: string;
    numero_serie: string;
    tipo: string;
  };
  items?: Array<{
    id: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    total_item?: number;
  }>;
}

export interface PresupuestoRecord {
  id: number;
  numero_presupuesto: string;
  cliente_id: string;
  descripcion: string;
  estado: string;
  fecha_creacion: string;
  fecha_vencimiento?: string;
  subtotal?: number;
  impuestos?: number;
  descuento?: number;
  total?: number;
  observaciones?: string;
  cliente?: {
    full_name: string;
    fiscal_id: string;
    email?: string;
    phone?: string;
  };
  items?: Array<{
    id: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    total_item?: number;
  }>;
}

export interface VentaRecord {
  venta_id: number;
  fecha: string;
  total: number;
  cliente: {
    id: string;
    full_name: string;
    fiscal_id: string;
    email?: string;
    phone?: string;
  };
  items: Array<{
    product: {
      id: string;
      nombre: string;
    };
    quantity: number;
    unit_price: number;
    discount_pct: number;
    total_item?: number;
  }>;
  payments: Array<{
    method: string;
    amount: number;
  }>;
}

// Función para normalizar valores nulos a cadena vacía
const normalizeString = (value: any): string => {
  return value ?? "";
};

// Función para normalizar valores numéricos
const normalizeNumber = (value: any): number => {
  return typeof value === 'number' ? value : 0;
};

// Builder para datos de Orden de Trabajo
export function buildOtPrintData(ot: OTRecord) {
  const normalizedOt = {
    ...ot,
    numero_ot: normalizeString(ot.numero_ot),
    problema_reportado: normalizeString(ot.problema_reportado),
    diagnostico: normalizeString(ot.diagnostico),
    solucion: normalizeString(ot.solucion),
    estado: normalizeString(ot.estado),
    prioridad: normalizeString(ot.prioridad),
    fecha_creacion: normalizeString(ot.fecha_creacion),
    fecha_actualizacion: normalizeString(ot.fecha_actualizacion),
    tecnico_asignado: normalizeString(ot.tecnico_asignado),
    observaciones: normalizeString(ot.observaciones),
    costo_mano_obra: normalizeNumber(ot.costo_mano_obra),
    costo_repuestos: normalizeNumber(ot.costo_repuestos),
    total: normalizeNumber(ot.total),
    cliente: ot.cliente ? {
      full_name: normalizeString(ot.cliente.full_name),
      fiscal_id: normalizeString(ot.cliente.fiscal_id),
      email: normalizeString(ot.cliente.email),
      phone: normalizeString(ot.cliente.phone),
    } : {
      full_name: "",
      fiscal_id: "",
      email: "",
      phone: "",
    },
    equipo: ot.equipo ? {
      marca: normalizeString(ot.equipo.marca),
      modelo: normalizeString(ot.equipo.modelo),
      numero_serie: normalizeString(ot.equipo.numero_serie),
      tipo: normalizeString(ot.equipo.tipo),
    } : {
      marca: "",
      modelo: "",
      numero_serie: "",
      tipo: "",
    },
    items: (ot.items || []).map(item => ({
      ...item,
      id: normalizeString(item.id),
      nombre: normalizeString(item.nombre),
      cantidad: normalizeNumber(item.cantidad),
      precio_unitario: normalizeNumber(item.precio_unitario),
      total_item: normalizeNumber(item.cantidad) * normalizeNumber(item.precio_unitario),
    })),
  };

  return normalizedOt;
}

// Builder para datos de Presupuesto
export function buildBudgetPrintData(presupuesto: PresupuestoRecord) {
  const normalizedPresupuesto = {
    ...presupuesto,
    numero_presupuesto: normalizeString(presupuesto.numero_presupuesto),
    descripcion: normalizeString(presupuesto.descripcion),
    estado: normalizeString(presupuesto.estado),
    fecha_creacion: normalizeString(presupuesto.fecha_creacion),
    fecha_vencimiento: normalizeString(presupuesto.fecha_vencimiento),
    observaciones: normalizeString(presupuesto.observaciones),
    subtotal: normalizeNumber(presupuesto.subtotal),
    impuestos: normalizeNumber(presupuesto.impuestos),
    descuento: normalizeNumber(presupuesto.descuento),
    total: normalizeNumber(presupuesto.total),
    cliente: presupuesto.cliente ? {
      full_name: normalizeString(presupuesto.cliente.full_name),
      fiscal_id: normalizeString(presupuesto.cliente.fiscal_id),
      email: normalizeString(presupuesto.cliente.email),
      phone: normalizeString(presupuesto.cliente.phone),
    } : {
      full_name: "",
      fiscal_id: "",
      email: "",
      phone: "",
    },
    items: (presupuesto.items || []).map(item => ({
      ...item,
      id: normalizeString(item.id),
      descripcion: normalizeString(item.descripcion),
      cantidad: normalizeNumber(item.cantidad),
      precio_unitario: normalizeNumber(item.precio_unitario),
      total_item: normalizeNumber(item.cantidad) * normalizeNumber(item.precio_unitario),
    })),
  };

  return normalizedPresupuesto;
}

// Builder para datos de Factura/Venta
export function buildInvoicePrintData(venta: VentaRecord) {
  const normalizedVenta = {
    ...venta,
    venta_id: normalizeNumber(venta.venta_id),
    fecha: normalizeString(venta.fecha),
    total: normalizeNumber(venta.total),
    cliente: {
      id: normalizeString(venta.cliente.id),
      full_name: normalizeString(venta.cliente.full_name),
      fiscal_id: normalizeString(venta.cliente.fiscal_id),
      email: normalizeString(venta.cliente.email),
      phone: normalizeString(venta.cliente.phone),
    },
    items: (venta.items || []).map(item => ({
      ...item,
      product: {
        id: normalizeString(item.product.id),
        nombre: normalizeString(item.product.nombre),
      },
      quantity: normalizeNumber(item.quantity),
      unit_price: normalizeNumber(item.unit_price),
      discount_pct: normalizeNumber(item.discount_pct),
      total_item: normalizeNumber(item.quantity) * normalizeNumber(item.unit_price) * (1 - normalizeNumber(item.discount_pct) / 100),
    })),
    payments: (venta.payments || []).map(payment => ({
      method: normalizeString(payment.method),
      amount: normalizeNumber(payment.amount),
    })),
  };

  return normalizedVenta;
}