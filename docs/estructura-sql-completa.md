# Estructura SQL Completa - TecniServer V3

## Descripción General

Este documento proporciona una vista completa de todos los archivos SQL del proyecto TecniServer V3, su orden de ejecución, dependencias y correspondencia con la documentación.

## Orden de Ejecución Recomendado

### Fase 1: Infraestructura Base (01-03)
1. **`01_usuarios_roles.sql`** → `seccion-02-usuarios-roles.md`
   - Sistema de usuarios, roles y autenticación base
   - Tablas: `users`, `roles`, `user_roles`

2. **`02_rls_politicas.sql`** → `seccion-01-rls-politicas.md`
   - Políticas RLS base y vistas de conveniencia
   - Funciones: `fn_has_role()`, `v_user_roles`, etc.

3. **`03_permisos.sql`** → `seccion-01-permisos.md`
   - Sistema de permisos granulares
   - Tablas: `permissions`, `role_permissions`

### Fase 2: Módulos de Negocio (04-15)
4. **`04_clientes_equipos.sql`** → `seccion-03-clientes-equipos.md`
   - Gestión de clientes y equipos
   - Tablas: `clientes`, `equipos`

5. **`05_rls_clientes_equipos.sql`** → `seccion-03-clientes-equipos.md`
   - Políticas RLS para clientes y equipos

6. **`06_ot_modelo.sql`** → `seccion-04-ot.md`
   - Órdenes de trabajo
   - Tablas: `ot`, `ot_historial`

7. **`07_rls_ot.sql`** → `seccion-04-ot.md`
   - Políticas RLS para órdenes de trabajo

8. **`08_mantenimientos_modelo.sql`** → `seccion-05-mantenimientos.md`
   - Sistema de mantenimientos preventivos
   - Tablas: `mantenimientos`, `mantenimiento_historial`

9. **`09_rls_mantenimientos.sql`** → `seccion-05-mantenimientos.md`
   - Políticas RLS para mantenimientos

10. **`10_inventario_modelo.sql`** → `seccion-06-inventario.md`
    - Gestión de inventario y stock
    - Tablas: `productos`, `lotes`, `movimientos`

11. **`11_rls_inventario.sql`** → `seccion-06-inventario.md`
    - Políticas RLS para inventario

12. **`12_pos_modelo.sql`** → `seccion-07-pos.md`
    - Punto de venta y facturación
    - Tablas: `cajas`, `ventas`, `venta_items`, `pagos`

13. **`13_rls_pos.sql`** → `seccion-07-pos.md`
    - Políticas RLS para POS

14. **`14_presupuestos_modelo.sql`** → `seccion-08-presupuestos-ot.md`
    - Sistema de presupuestos
    - Tablas: `presupuestos`, `presupuesto_items`

15. **`15_rls_presupuestos.sql`** → `seccion-08-presupuestos-ot.md`
    - Políticas RLS para presupuestos

### Fase 3: Servicios Adicionales (16-24)
16. **`16_print_jobs.sql`** → `seccion-09-impresion.md`
    - Sistema de impresión y generación de documentos
    - Tabla: `print_jobs`

17. **`17_portal_modelo.sql`** → `seccion-10-portal-cliente.md`
    - Portal del cliente
    - Tablas: `empresas`, `empresa_users`, `cliente_users`, `portal_tokens`

18. **`18_rls_portal.sql`** → `seccion-10-portal-cliente.md`
    - Políticas RLS para portal del cliente

19. **`19_marketplace_modelo.sql`** → `seccion-11-marketplace.md`
    - Marketplace de productos
    - Tablas: `mk_products`, `mk_orders`, `mk_order_items`

20. **`20_rls_marketplace.sql`** → `seccion-11-marketplace.md`
    - Políticas RLS para marketplace

21. **`21_fidelizacion_modelo.sql`** → `seccion-12-fidelizacion.md`
    - Sistema de fidelización y puntos
    - Tablas: `points_ledger`, `points_balance`, `coupons`

22. **`22_rls_fidelizacion.sql`** → `seccion-12-fidelizacion.md`
    - Políticas RLS para fidelización

23. **`23_ai_config_modelo.sql`** → `seccion-13-ai-config.md`
    - Configuración de IA y prompts
    - Tablas: `ai_providers`, `ai_prompts`, `ai_runs`

24. **`24_rls_ai_config.sql`** → `seccion-13-ai-config.md`
    - Políticas RLS para configuración de IA

### Fase 4: Datos de Prueba (99)
99. **`99_seed_demo.sql`** → `seed-demo.md`
    - Datos de demostración para todas las tablas

99. **`99_seed_cleanup.sql`** → `seed-demo.md`
    - Limpieza de datos de demostración

## Mapa de Correspondencia Documentación-SQL

| Sección Documentación | Archivos SQL | Descripción |
|----------------------|--------------|-------------|
| `seccion-01-rls-politicas.md` | `02_rls_politicas.sql` | Políticas RLS base |
| `seccion-01-permisos.md` | `03_permisos.sql` | Sistema de permisos granulares |
| `seccion-02-usuarios-roles.md` | `01_usuarios_roles.sql` | Usuarios y roles base |
| `seccion-03-clientes-equipos.md` | `04_clientes_equipos.sql`, `05_rls_clientes_equipos.sql` | Clientes y equipos |
| `seccion-04-ot.md` | `06_ot_modelo.sql`, `07_rls_ot.sql` | Órdenes de trabajo |
| `seccion-05-mantenimientos.md` | `08_mantenimientos_modelo.sql`, `09_rls_mantenimientos.sql` | Mantenimientos |
| `seccion-06-inventario.md` | `10_inventario_modelo.sql`, `11_rls_inventario.sql` | Inventario |
| `seccion-07-pos.md` | `12_pos_modelo.sql`, `13_rls_pos.sql` | Punto de venta |
| `seccion-08-presupuestos-ot.md` | `14_presupuestos_modelo.sql`, `15_rls_presupuestos.sql` | Presupuestos |
| `seccion-09-impresion.md` | `16_print_jobs.sql` | Sistema de impresión |
| `seccion-10-portal-cliente.md` | `17_portal_modelo.sql`, `18_rls_portal.sql` | Portal del cliente |
| `seccion-11-marketplace.md` | `19_marketplace_modelo.sql`, `20_rls_marketplace.sql` | Marketplace |
| `seccion-12-fidelizacion.md` | `21_fidelizacion_modelo.sql`, `22_rls_fidelizacion.sql` | Fidelización |
| `seccion-13-ai-config.md` | `23_ai_config_modelo.sql`, `24_rls_ai_config.sql` | Configuración IA |
| `seed-demo.md` | `99_seed_demo.sql`, `99_seed_cleanup.sql` | Datos de prueba |

## Dependencias entre Archivos

### Dependencias Críticas
- **Todos los archivos RLS** dependen de `01_usuarios_roles.sql` y `02_rls_politicas.sql`
- **Archivos de modelo** deben ejecutarse antes que sus correspondientes archivos RLS
- **Portal y Marketplace** dependen de `04_clientes_equipos.sql`
- **Fidelización** depende de `04_clientes_equipos.sql` y `12_pos_modelo.sql`

### Dependencias por Foreign Keys
```
01_usuarios_roles.sql
├── 02_rls_politicas.sql
├── 03_permisos.sql
├── 04_clientes_equipos.sql
│   ├── 06_ot_modelo.sql
│   ├── 08_mantenimientos_modelo.sql
│   ├── 17_portal_modelo.sql
│   └── 21_fidelizacion_modelo.sql
├── 10_inventario_modelo.sql
│   └── 12_pos_modelo.sql
│       └── 21_fidelizacion_modelo.sql
├── 14_presupuestos_modelo.sql
├── 16_print_jobs.sql
├── 19_marketplace_modelo.sql
└── 23_ai_config_modelo.sql
```

## Archivos Documentados vs No Documentados

### ✅ Archivos Completamente Documentados
- `01_usuarios_roles.sql` → `seccion-02-usuarios-roles.md`
- `04_clientes_equipos.sql` + `05_rls_clientes_equipos.sql` → `seccion-03-clientes-equipos.md`
- `06_ot_modelo.sql` + `07_rls_ot.sql` → `seccion-04-ot.md`
- `08_mantenimientos_modelo.sql` + `09_rls_mantenimientos.sql` → `seccion-05-mantenimientos.md`
- `10_inventario_modelo.sql` + `11_rls_inventario.sql` → `seccion-06-inventario.md`
- `12_pos_modelo.sql` + `13_rls_pos.sql` → `seccion-07-pos.md`
- `14_presupuestos_modelo.sql` + `15_rls_presupuestos.sql` → `seccion-08-presupuestos-ot.md`
- `17_portal_modelo.sql` + `18_rls_portal.sql` → `seccion-10-portal-cliente.md`
- `19_marketplace_modelo.sql` + `20_rls_marketplace.sql` → `seccion-11-marketplace.md`
- `21_fidelizacion_modelo.sql` + `22_rls_fidelizacion.sql` → `seccion-12-fidelizacion.md`
- `23_ai_config_modelo.sql` + `24_rls_ai_config.sql` → `seccion-13-ai-config.md`
- `99_seed_demo.sql` + `99_seed_cleanup.sql` → `seed-demo.md`

### ✅ Archivos Recientemente Documentados
- `02_rls_politicas.sql` → `seccion-01-rls-politicas.md` *(nuevo)*
- `03_permisos.sql` → `seccion-01-permisos.md` *(nuevo)*
- `16_print_jobs.sql` → `seccion-09-impresion.md` *(nuevo)*

## Inconsistencias Resueltas

### ❌ Inconsistencias Anteriores (Resueltas)
1. **Archivos SQL sin documentación**:
   - `02_rls_politicas.sql` - ✅ Documentado en `seccion-01-rls-politicas.md`
   - `03_permisos.sql` - ✅ Documentado en `seccion-01-permisos.md`
   - `16_print_jobs.sql` - ✅ Documentado en `seccion-09-impresion.md`

2. **Referencias a archivos inexistentes**:
   - Documentación mencionaba `16_portal_cliente_modelo.sql` y `18_marketplace_modelo.sql`
   - ✅ Los archivos reales son `17_portal_modelo.sql` y `19_marketplace_modelo.sql`
   - ✅ La documentación ya referencia correctamente los archivos existentes

## Comando de Ejecución Completa

Para ejecutar todos los archivos SQL en Supabase en el orden correcto:

```sql
-- Fase 1: Infraestructura Base
\i 01_usuarios_roles.sql
\i 02_rls_politicas.sql
\i 03_permisos.sql

-- Fase 2: Módulos de Negocio
\i 04_clientes_equipos.sql
\i 05_rls_clientes_equipos.sql
\i 06_ot_modelo.sql
\i 07_rls_ot.sql
\i 08_mantenimientos_modelo.sql
\i 09_rls_mantenimientos.sql
\i 10_inventario_modelo.sql
\i 11_rls_inventario.sql
\i 12_pos_modelo.sql
\i 13_rls_pos.sql
\i 14_presupuestos_modelo.sql
\i 15_rls_presupuestos.sql

-- Fase 3: Servicios Adicionales
\i 16_print_jobs.sql
\i 17_portal_modelo.sql
\i 18_rls_portal.sql
\i 19_marketplace_modelo.sql
\i 20_rls_marketplace.sql
\i 21_fidelizacion_modelo.sql
\i 22_rls_fidelizacion.sql
\i 23_ai_config_modelo.sql
\i 24_rls_ai_config.sql

-- Fase 4: Datos de Prueba (Opcional)
\i 99_seed_demo.sql
```

## Verificación de Integridad

### Script de Verificación
```sql
-- Verificar que todas las tablas fueron creadas
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verificar que todas las políticas RLS están activas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Verificar funciones creadas
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;
```

## Estado Actual

✅ **Todas las inconsistencias han sido resueltas**
✅ **Todos los archivos SQL están documentados**
✅ **La estructura está completamente mapeada**
✅ **Las dependencias están clarificadas**

El proyecto TecniServer V3 ahora tiene una estructura SQL completamente consistente y documentada.