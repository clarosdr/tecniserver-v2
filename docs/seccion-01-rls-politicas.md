# Sección 01: Políticas RLS Base

## Descripción General

Este módulo define las políticas de Row Level Security (RLS) base y vistas de conveniencia que son utilizadas por todos los demás módulos del sistema. Proporciona la infraestructura fundamental para el control de acceso basado en roles.

## Archivo SQL

- **Archivo**: `supabase/sql/02_rls_politicas.sql`
- **Orden de ejecución**: 2 (después de usuarios y roles)
- **Dependencias**: `01_usuarios_roles.sql`

## Componentes Principales

### 1. Vistas de Conveniencia para RLS

#### `v_user_roles`
Vista que consolida los roles de un usuario desde múltiples fuentes:
- Tabla `user_roles` (sistema de roles múltiples)
- Campo `users.role` (compatibilidad con sistema simple)

```sql
CREATE OR REPLACE VIEW public.v_user_roles AS
SELECT ur.user_id, ur.role_slug FROM public.user_roles ur
UNION
SELECT u.id AS user_id, u.role AS role_slug FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = u.id);
```

#### Vistas de Verificación de Roles
- `v_is_admin`: Verifica si un usuario tiene rol de administrador
- `v_is_tecnico`: Verifica si un usuario tiene rol de técnico
- `v_is_recepcionista`: Verifica si un usuario tiene rol de recepcionista
- `v_is_cliente`: Verifica si un usuario tiene rol de cliente

### 2. Funciones de Utilidad RLS

#### `fn_has_role(role_slug TEXT)`
Función principal para verificar si el usuario actual tiene un rol específico:

```sql
CREATE OR REPLACE FUNCTION public.fn_has_role(role_slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.v_user_roles vur 
    WHERE vur.user_id = auth.uid() AND vur.role_slug = role_slug
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `fn_user_empresa_id()`
Función que obtiene el ID de empresa asociado al usuario actual:

```sql
CREATE OR REPLACE FUNCTION public.fn_user_empresa_id()
RETURNS UUID AS $$
BEGIN
  -- Lógica para obtener empresa_id del usuario actual
  -- Utilizada en políticas RLS para filtrar por empresa
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Funciones de Verificación de Acceso

#### `fn_can_access_cliente(cliente_id UUID)`
Verifica si el usuario actual puede acceder a un cliente específico:
- Administradores: acceso total
- Recepcionistas: acceso a clientes de su empresa
- Clientes: solo acceso a sus propios datos

#### `fn_can_access_ot(ot_id UUID)`
Verifica acceso a órdenes de trabajo específicas basado en:
- Rol del usuario
- Empresa asociada
- Asignación de técnico

## Características Técnicas

### Seguridad
- Todas las funciones utilizan `SECURITY DEFINER`
- Las vistas consolidan datos de múltiples fuentes de forma segura
- Verificación de roles basada en `auth.uid()`

### Rendimiento
- Índices optimizados en tablas de roles
- Vistas materializadas para consultas frecuentes
- Funciones eficientes para verificación de permisos

### Compatibilidad
- Soporte para sistema de roles múltiples y simple
- Migración transparente entre sistemas de roles
- Retrocompatibilidad con implementaciones anteriores

## Uso en Otros Módulos

Estas funciones y vistas son utilizadas por todos los módulos del sistema:

```sql
-- Ejemplo de uso en política RLS
CREATE POLICY cliente_access ON public.clientes
  FOR ALL USING (public.fn_can_access_cliente(id));

-- Ejemplo de uso en función
CREATE POLICY admin_full_access ON public.equipos
  FOR ALL USING (public.fn_has_role('admin'));
```

## Orden de Ejecución

Este archivo debe ejecutarse **después** de:
1. `01_usuarios_roles.sql` - Define las tablas base de usuarios y roles

Y **antes** de:
- Todos los demás archivos RLS específicos de módulos
- Cualquier archivo que defina políticas RLS

## Notas de Implementación

- Script completamente idempotente
- Utiliza `CREATE OR REPLACE` para todas las funciones y vistas
- Manejo de errores robusto
- Comentarios detallados en el código SQL