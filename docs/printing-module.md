# Módulo de Impresión - Print Builders

## Descripción General

El módulo de impresión ha sido refactorizado para incluir funciones "builder" que normalizan y procesan los datos antes de enviarlos al servicio de impresión. Esto garantiza que todos los documentos tengan un formato consistente y que los cálculos sean precisos.

## Arquitectura

```
src/services/print-builders.ts  ← Funciones builder y tipos
src/services/print.ts          ← Servicio de impresión principal
prints/templates/              ← Plantillas HTML
prints/styles/                 ← Estilos CSS
```

## Tipos de Datos

### OTRecord
Representa una orden de trabajo normalizada para impresión:
```typescript
interface OTRecord {
  id: string;
  numero: string;
  cliente_nombre: string;
  equipo_marca: string;
  equipo_modelo: string;
  problema_reportado: string;
  diagnostico: string;
  solucion: string;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  total_items: number;
  created_at: string;
  estado: string;
}
```

### PresupuestoRecord
Representa un presupuesto normalizado para impresión:
```typescript
interface PresupuestoRecord {
  id: string;
  numero: string;
  cliente_nombre: string;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  total_items: number;
  total: number;
  created_at: string;
  vence_at: string;
  estado: string;
}
```

### VentaRecord
Representa una venta/factura normalizada para impresión:
```typescript
interface VentaRecord {
  venta_id: string;
  cliente: {
    nombre: string;
    documento?: string;
    telefono?: string;
    email?: string;
  };
  items: Array<{
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  total_items: number;
  payments: Array<{
    metodo: string;
    monto: number;
  }>;
  total: number;
  fecha: string;
}
```

## Funciones Builder

### buildOtPrintData(order: any): OTRecord
Normaliza los datos de una orden de trabajo:
- Convierte strings a números donde sea necesario
- Calcula subtotales de items automáticamente
- Calcula el total general de items
- Normaliza strings para evitar valores null/undefined

**Uso:**
```typescript
import { buildOtPrintData } from '../services/print-builders';

const data = buildOtPrintData(order);
printDocument('ot', data);
```

### buildBudgetPrintData(budget: any): PresupuestoRecord
Normaliza los datos de un presupuesto:
- Procesa items y calcula subtotales
- Calcula el total de items
- Normaliza fechas y strings
- Mantiene información de estado y vencimiento

**Uso:**
```typescript
import { buildBudgetPrintData } from '../services/print-builders';

const data = buildBudgetPrintData(budget);
printDocument('presupuesto', data);
```

### buildInvoicePrintData(saleData: any): VentaRecord
Normaliza los datos de una factura/venta:
- Procesa items del carrito
- Calcula subtotales y total de items
- Normaliza información del cliente
- Procesa métodos de pago
- Formatea fechas

**Uso:**
```typescript
import { buildInvoicePrintData } from '../services/print-builders';

const data = buildInvoicePrintData(lastSaleData);
printDocument('factura', data);
```

## Conexión con printDocument()

Las funciones builder actúan como una capa de procesamiento antes de llamar a `printDocument()`:

1. **Datos originales** → **Builder function** → **Datos normalizados** → **printDocument()**
2. Los builders garantizan que los datos tengan el formato esperado por las plantillas
3. Calculan automáticamente totales y subtotales
4. Normalizan strings y números para evitar errores de renderizado

## Funciones Auxiliares

### normalizeString(value: any): string
Convierte cualquier valor a string, manejando casos null/undefined.

### normalizeNumber(value: any): number
Convierte cualquier valor a número, retornando 0 para valores inválidos.

## Plantillas y Estilos

- **Plantillas HTML**: `prints/templates/` contiene las plantillas para cada tipo de documento
- **Estilos CSS**: `prints/styles/print.css` contiene los estilos de impresión
- **Datos de ejemplo**: `prints/samples/` contiene ejemplos de datos para testing

## Implementación en Componentes

### WorkOrderDetail.tsx
```typescript
const data = buildOtPrintData(order);
printDocument('ot', data);
```

### BudgetTable.tsx
```typescript
const data = buildBudgetPrintData(b);
printDocument('presupuesto', data);
```

### PosPage.tsx
```typescript
const data = buildInvoicePrintData(lastSaleData);
printDocument('factura', data);
```

## Beneficios

1. **Consistencia**: Todos los documentos usan el mismo formato de datos
2. **Cálculos automáticos**: Los totales se calculan automáticamente
3. **Robustez**: Manejo de datos null/undefined
4. **Mantenibilidad**: Lógica centralizada en un solo archivo
5. **Extensibilidad**: Fácil agregar nuevos tipos de documentos

## Notas Importantes

- Siempre usar las funciones builder antes de llamar a `printDocument()`
- Los builders manejan automáticamente los cálculos de totales
- Las plantillas HTML esperan los datos en el formato definido por los tipos
- Para debugging, revisar los datos de ejemplo en `prints/samples/`
