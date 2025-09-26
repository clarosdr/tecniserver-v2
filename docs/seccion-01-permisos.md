# Sección 01: Sistema de Permisos Granulares

## Descripción General

Este módulo implementa un sistema de permisos granulares que complementa el sistema de roles base. Permite definir permisos específicos para acciones individuales y asignarlos a roles de forma flexible, proporcionando un control de acceso más fino que el sistema de roles básico.

## Archivo SQL

- **Archivo**: `supabase/sql/03_permisos.sql`
- **Orden de ejecución**: 3 (después de usuarios, roles y políticas RLS base)
- **Dependencias**: `01_usuarios_roles.sql`, `02_rls_politicas.sql`

## Componentes Principales

### 1. Tabla de Permisos

#### `permissions`
Catálogo maestro de todos los permisos disponibles en el sistema:

```sql
CREATE TABLE public.permissions (
    slug TEXT PRIMARY KEY,              -- Identificador único (ej: "usuarios.read")
    name TEXT NOT NULL,                 -- Nombre legible del permiso
    category TEXT NOT NULL,             -- Categoría de agrupación
    description TEXT                    -- Descripción detallada
);
```

**Campos:**
- `slug`: Identificador único usando convención punto (módulo.acción)
- `name`: Nombre descriptivo para interfaces de usuario
- `category`: Agrupación lógica (usuarios, ot, inventario, etc.)
- `description`: Explicación detallada del permiso

### 2. Tabla de Asignación Rol-Permiso

#### `role_permissions`
Tabla de enlace many-to-many entre roles y permisos:

```sql
CREATE TABLE public.role_permissions (
    role_slug TEXT NOT NULL REFERENCES public.roles(slug) ON DELETE CASCADE,
    permission_slug TEXT NOT NULL REFERENCES public.permissions(slug) ON DELETE CASCADE,
    PRIMARY KEY (role_slug, permission_slug)
);
```

## Permisos Predefinidos

### Categoría: Usuarios
- `usuarios.read`: Leer lista y detalles de usuarios
- `usuarios.update_self`: Actualizar propio perfil

### Categoría: Roles
- `roles.assign`: Asignar y revocar roles a usuarios
- `roles.read`: Ver lista de roles y permisos

### Categoría: Clientes
- `clientes.read`: Ver lista y detalles de clientes
- `clientes.write`: Crear y editar clientes

### Categoría: Equipos
- `equipos.read`: Ver equipos registrados
- `equipos.write`: Registrar y editar equipos

### Categoría: Órdenes de Trabajo
- `ot.read`: Ver todas las órdenes de trabajo
- `ot.write`: Crear y editar órdenes de trabajo
- `ot.historial.write`: Añadir notas y diagnósticos al historial

### Categoría: Inventario
- `inventario.read`: Ver stock de productos e insumos
- `inventario.write`: Gestionar inventario y movimientos
- `inventario.ajustes`: Realizar ajustes de stock

### Categoría: POS
- `pos.ventas`: Realizar ventas y facturación
- `pos.caja`: Gestionar apertura/cierre de caja
- `pos.reportes`: Ver reportes de ventas

### Categoría: Presupuestos
- `presupuestos.read`: Ver presupuestos
- `presupuestos.write`: Crear y editar presupuestos
- `presupuestos.approve`: Aprobar presupuestos

## Asignación de Permisos por Rol

### Administrador (`admin`)
- **Permisos**: TODOS los permisos del sistema
- **Implementación**: Asignación automática de todos los permisos existentes

### Recepcionista (`recepcionista`)
- `usuarios.read`
- `usuarios.update_self`
- `clientes.read`, `clientes.write`
- `equipos.read`, `equipos.write`
- `ot.read`, `ot.write`
- `inventario.read`
- `presupuestos.read`, `presupuestos.write`

### Técnico (`tecnico`)
- `usuarios.update_self`
- `clientes.read`
- `equipos.read`
- `ot.read`, `ot.write`, `ot.historial.write`
- `inventario.read`
- `presupuestos.read`

### Cliente (`cliente`)
- `usuarios.update_self`
- Acceso limitado a sus propios datos a través de RLS

## Funciones de Utilidad

### `fn_has_permission(permission_slug TEXT)`
Verifica si el usuario actual tiene un permiso específico:

```sql
CREATE OR REPLACE FUNCTION public.fn_has_permission(permission_slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar si es admin (acceso total)
  IF public.fn_has_role('admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar permiso específico
  RETURN EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.v_user_roles vur ON vur.role_slug = rp.role_slug
    WHERE vur.user_id = auth.uid() 
    AND rp.permission_slug = permission_slug
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `fn_user_permissions()`
Obtiene todos los permisos del usuario actual:

```sql
CREATE OR REPLACE FUNCTION public.fn_user_permissions()
RETURNS TABLE(permission_slug TEXT, permission_name TEXT, category TEXT) AS $$
BEGIN
  -- Si es admin, devolver todos los permisos
  IF public.fn_has_role('admin') THEN
    RETURN QUERY SELECT p.slug, p.name, p.category FROM public.permissions p;
  ELSE
    -- Devolver permisos específicos del usuario
    RETURN QUERY 
    SELECT p.slug, p.name, p.category
    FROM public.permissions p
    JOIN public.role_permissions rp ON rp.permission_slug = p.slug
    JOIN public.v_user_roles vur ON vur.role_slug = rp.role_slug
    WHERE vur.user_id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Uso en Políticas RLS

```sql
-- Ejemplo: Política basada en permisos granulares
CREATE POLICY permission_based_access ON public.clientes
  FOR SELECT USING (public.fn_has_permission('clientes.read'));

CREATE POLICY permission_based_write ON public.clientes
  FOR INSERT WITH CHECK (public.fn_has_permission('clientes.write'));
```

## Uso en la Aplicación

### Frontend (React/TypeScript)
```typescript
// Hook para verificar permisos
const { hasPermission } = usePermissions();

// Renderizado condicional
{hasPermission('clientes.write') && (
  <Button onClick={handleCreateClient}>Crear Cliente</Button>
)}
```

### Backend (API Routes)
```typescript
// Middleware de verificación de permisos
export const requirePermission = (permission: string) => {
  return async (req, res, next) => {
    const hasPermission = await checkUserPermission(req.user.id, permission);
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permiso insuficiente' });
    }
    next();
  };
};
```

## Características Técnicas

### Idempotencia
- Utiliza `INSERT ... ON CONFLICT DO NOTHING` para permisos
- Script completamente idempotente y re-ejecutable

### Rendimiento
- Índices optimizados en tablas de enlace
- Funciones eficientes con `SECURITY DEFINER`
- Cache de permisos en aplicación frontend

### Escalabilidad
- Fácil adición de nuevos permisos
- Sistema flexible de categorías
- Asignación dinámica de permisos a roles

## Migración y Mantenimiento

### Agregar Nuevos Permisos
```sql
INSERT INTO public.permissions (slug, name, category, description) VALUES
  ('nuevo_modulo.read', 'Leer Nuevo Módulo', 'Nuevo Módulo', 'Descripción del permiso')
ON CONFLICT (slug) DO NOTHING;
```

### Asignar Permisos a Roles
```sql
INSERT INTO public.role_permissions (role_slug, permission_slug) VALUES
  ('tecnico', 'nuevo_modulo.read')
ON CONFLICT DO NOTHING;
```

## Orden de Ejecución

Este archivo debe ejecutarse **después** de:
1. `01_usuarios_roles.sql` - Define usuarios y roles base
2. `02_rls_politicas.sql` - Define funciones RLS base

Y **antes** de:
- Archivos que utilicen `fn_has_permission()` en políticas RLS
- Implementación de módulos específicos que requieran permisos granulares