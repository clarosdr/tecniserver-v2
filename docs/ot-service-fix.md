# OT Service Fix - Documentación

## Nombres Reales de Tablas y Vistas

### Tablas Base
- **`ot`** - Tabla principal de órdenes de trabajo (para INSERT/UPDATE)
- **`ot_accesorios`** - Tabla de accesorios asociados a OT
- **`ot_historial`** - Tabla de historial de eventos de OT

### Vistas
- **`v_ot_detalle`** - Vista con datos completos de OT (para SELECT/LISTAR)
  - Incluye joins con clientes, equipos y otros datos relacionados
  - Campos calculados y normalizados
  - Optimizada para consultas de listado y detalle

## Errores PGRST205 Típicos

### Error: "relation 'public.work_orders' does not exist"
**Causa**: Referencia a tabla inexistente `work_orders` en lugar de `ot`
**Solución**: Usar `ot` para operaciones de escritura y `v_ot_detalle` para lectura

### Error: "column 'work_orders.id' does not exist"
**Causa**: Intentar hacer SELECT en tabla `work_orders` que no existe
**Solución**: Cambiar a vista `v_ot_detalle` para consultas

### Error: "permission denied for table ot"
**Causa**: RLS (Row Level Security) no configurado correctamente
**Solución**: Verificar políticas RLS en Supabase Dashboard

### Error: "PGRST116 - The result contains 0 rows"
**Causa**: `.single()` en consulta que no devuelve resultados
**Solución**: Manejar error específico y devolver `null`

## Mapeo de Operaciones

| Operación | Tabla/Vista Correcta | Función |
|-----------|---------------------|---------|
| Listar OT | `v_ot_detalle` | `listOT()` |
| Obtener OT | `v_ot_detalle` | `getOT()` |
| Crear OT | `ot` | `createOT()` |
| Actualizar OT | `ot` | `updateOT()` |
| Agregar Accesorio | `ot_accesorios` | `addAccessory()` |
| Agregar Historial | `ot_historial` | `addHistory()` |

## Checklist de Validación

### 1. Verificar SQL Ejecutados
```sql
-- Verificar que existen las tablas/vistas
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ot', 'ot_accesorios', 'ot_historial', 'v_ot_detalle');

-- Verificar estructura de la vista
\d v_ot_detalle

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('ot', 'ot_accesorios', 'ot_historial');
```

### 2. Verificar .env.local
```bash
# Verificar que las variables están configuradas
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Verificar Permisos de Usuario
- Usuario autenticado tiene acceso a las tablas
- Políticas RLS permiten operaciones CRUD
- Roles asignados correctamente

### 4. Pruebas de Funciones

#### Test listOT()
```typescript
// Sin filtros
const result1 = await listOT();
console.log('Total OT:', result1.total);

// Con filtros
const result2 = await listOT({ 
  estado: 'En revisión', 
  search: 'cliente', 
  limit: 10 
});
console.log('OT filtradas:', result2.items.length);
```

#### Test getOT()
```typescript
const ot = await getOT('1');
console.log('OT completa:', ot);
console.log('Accesorios:', ot?.accesorios.length);
console.log('Historial:', ot?.historial.length);
```

#### Test createOT()
```typescript
const newOT = await createOT({
  client_name: 'Test Cliente',
  device_type: 'Laptop',
  issue_description: 'No enciende',
  status: 'Ingresado'
});
console.log('Nueva OT ID:', newOT.id);
```

### 5. Verificar Logs de Error
- Revisar consola del navegador
- Verificar logs de Supabase
- Comprobar Network tab en DevTools

## Notas Importantes

1. **Vista vs Tabla**: Usar `v_ot_detalle` para lectura, `ot` para escritura
2. **Manejo de Errores**: Siempre capturar y manejar errores específicos de Supabase
3. **Paginación**: Implementada con `range(offset, offset + limit - 1)`
4. **Búsqueda**: Usar `or()` con `ilike` para búsqueda en múltiples campos
5. **Compatibilidad**: Mantener funciones legacy para no romper código existente

## Troubleshooting Rápido

### Si las consultas fallan:
1. Verificar que `v_ot_detalle` existe en Supabase
2. Comprobar que el usuario tiene permisos de SELECT
3. Revisar que los nombres de columnas coinciden
4. Verificar conexión a Supabase

### Si los INSERT/UPDATE fallan:
1. Verificar que las tablas `ot`, `ot_accesorios`, `ot_historial` existen
2. Comprobar políticas RLS para INSERT/UPDATE
3. Verificar que los campos requeridos están presentes
4. Revisar tipos de datos en el schema