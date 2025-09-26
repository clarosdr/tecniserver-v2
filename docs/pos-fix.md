# POS Service Fix Documentation

## Tablas Utilizadas

### Tablas Principales
- **`ventas`**: Tabla principal de ventas
- **`ventas_items`**: Items/productos de cada venta
- **`ventas_pagos`**: Pagos asociados a cada venta
- **`cajas_aperturas`**: Aperturas de cajas registradoras

### Tablas de Referencia
- **`productos`**: Catálogo de productos
- **`clientes`**: Información de clientes
- **`ot`**: Órdenes de trabajo (opcional)

## Funciones Implementadas

### Gestión de Cajas
- `cajas()`: Lista cajas disponibles
- `openCaja(caja_id, saldo_inicial)`: Abre una caja registradora
- `myCajaAbierta()`: Obtiene la caja abierta del usuario actual

### Gestión de Ventas
- `createVenta({cliente_id?, ot_id?, caja_apertura_id})`: Crea una nueva venta
- `listVentas({estado?, search?, limit?, offset?})`: Lista ventas con filtros
- `getVenta(id)`: Obtiene una venta específica
- `cancelarVenta(id)`: Cancela una venta

### Gestión de Items
- `addItem(venta_id, {producto_id, lote_id?, cantidad, precio_unit, iva_pct?})`: Agrega item a venta
- `removeItem(item_id)`: Elimina item de venta

### Gestión de Pagos
- `addPago(venta_id, {metodo, monto, referencia?})`: Agrega pago a venta

## Errores Comunes RLS (Row Level Security)

### Error PGRST116 - Permisos Insuficientes
```
"message": "JWT expired" o "insufficient_privilege"
```
**Solución**: Verificar que el usuario tenga permisos para las tablas `ventas`, `ventas_items`, `ventas_pagos`

### Error PGRST204 - Recurso No Encontrado
```
"message": "The result contains 0 rows"
```
**Solución**: 
- Verificar que el ID existe en la tabla
- Confirmar que el usuario tiene acceso a ese registro específico

### Error PGRST205 - Tabla/Vista No Encontrada
```
"message": "relation \"public.tabla_nombre\" does not exist"
```
**Solución**: Verificar nombres de tablas en el esquema de base de datos

### Error de Validación de Datos
```
"message": "new row violates check constraint"
```
**Solución**: 
- Verificar que `cantidad > 0`
- Verificar que `precio_unit >= 0`
- Verificar que `monto > 0` en pagos

## Pasos de Prueba

### 1. Verificar Apertura de Caja
```javascript
// Verificar cajas disponibles
const cajas = await cajas();
console.log('Cajas disponibles:', cajas);

// Abrir caja
const apertura = await openCaja(caja_id, 1000.00);
console.log('Caja abierta:', apertura);

// Verificar caja abierta
const miCaja = await myCajaAbierta();
console.log('Mi caja:', miCaja);
```

### 2. Crear Venta Completa
```javascript
// 1. Crear venta
const venta = await createVenta({
    cliente_id: 1,
    caja_apertura_id: apertura.id
});

// 2. Agregar items
const item = await addItem(venta.id, {
    producto_id: 1,
    cantidad: 2,
    precio_unit: 50.00,
    iva_pct: 21
});

// 3. Agregar pago
const pago = await addPago(venta.id, {
    metodo: 'efectivo',
    monto: 100.00
});

// 4. Verificar venta
const ventaCompleta = await getVenta(venta.id);
console.log('Venta completa:', ventaCompleta);
```

### 3. Verificar Estados de Venta
```javascript
// Listar ventas pendientes
const ventasPendientes = await listVentas({ estado: 'pendiente' });

// Listar ventas pagadas
const ventasPagadas = await listVentas({ estado: 'pagada' });

// Buscar ventas por cliente
const ventasCliente = await listVentas({ search: 'nombre_cliente' });
```

### 4. Pruebas de Cancelación
```javascript
// Cancelar venta
await cancelarVenta(venta.id);

// Verificar estado
const ventaCancelada = await getVenta(venta.id);
console.log('Estado:', ventaCancelada.estado); // debe ser 'cancelada'
```

## Validaciones Importantes

### Antes de Crear Venta
- [ ] Verificar que hay una caja abierta
- [ ] Validar que el cliente existe
- [ ] Confirmar permisos de usuario

### Antes de Agregar Items
- [ ] Verificar que la venta existe y está en estado 'pendiente'
- [ ] Validar que el producto existe
- [ ] Confirmar stock disponible (si aplica)
- [ ] Verificar que cantidad > 0 y precio_unit >= 0

### Antes de Agregar Pagos
- [ ] Verificar que la venta existe
- [ ] Validar que monto > 0
- [ ] Confirmar método de pago válido

### Actualización Automática de Estados
- La venta se marca como 'pagada' automáticamente cuando la suma de pagos >= total
- Los totales se recalculan automáticamente al agregar/quitar items

## Variables de Entorno Requeridas

Verificar en `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Notas de Compatibilidad

- Las funciones legacy (`createSale`, `getActiveCashDrawer`, `openCashDrawer`) se mantienen para compatibilidad
- El botón "Imprimir Factura" sigue funcionando con `printDocument('factura', ...)`
- Los datos de impresión se almacenan en `lastSaleData` en formato legacy