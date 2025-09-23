# [Sección 2] — Módulo de Gestión de Usuarios y Roles

## 1. Resumen del Módulo

Este módulo es la columna vertebral del sistema de autenticación, permisos y control de acceso en TecniServer V3. Establece la estructura fundamental para diferenciar los tipos de usuarios y asegurar que cada uno solo pueda ver y realizar las acciones que le corresponden.

La arquitectura se basa en el sistema de autenticación de Supabase (`auth.users`) y lo extiende con tablas públicas para perfiles de usuario, catálogos de roles y asignaciones granulares. Esto permite una gestión de permisos robusta y escalable a través de Políticas de Seguridad a Nivel de Fila (RLS).

**Componentes Clave:**
- **Perfiles Extendidos:** Una tabla `public.users` que replica y amplía la información de `auth.users`.
- **Trigger de Sincronización:** Un trigger que crea automáticamente un perfil en `public.users` cuando un nuevo usuario se registra en `auth.users`.
- **Catálogo de Roles:** Una tabla `public.roles` que define los roles disponibles en el sistema.
- **Asignación Múltiple (Opcional):** La tabla `public.user_roles` permite que un usuario tenga múltiples roles, ofreciendo mayor flexibilidad.
- **Vistas de Conveniencia:** Vistas SQL (`v_is_admin`, `v_is_tecnico`, etc.) que simplifican la escritura de políticas RLS.

---

## 2. Diagrama de Entidades (Mermaid)

El siguiente diagrama ilustra las relaciones entre las tablas y vistas principales de este módulo.

```mermaid
erDiagram
    "auth.users" {
        UUID id PK "Primary key (from Supabase Auth)"
        TEXT email
        TEXT phone
    }

    "public.users" {
        UUID id PK,FK "FK to auth.users.id"
        TEXT full_name
        TEXT email
        TEXT phone
        TEXT role "Default role, check constraint"
    }

    "public.roles" {
        TEXT slug PK "e.g., 'admin', 'tecnico'"
    }

    "public.user_roles" {
        UUID user_id PK,FK "FK to auth.users.id"
        TEXT role_slug PK,FK "FK to public.roles.slug"
    }

    "auth.users" ||--o{ "public.users" : "Crea perfil via Trigger"
    "auth.users" ||--|{ "public.user_roles" : "Tiene roles"
    "public.roles" ||--|{ "public.user_roles" : "Es asignado a"

    subgraph "Vistas (Views) para RLS"
        direction LR
        "public.v_user_roles"
        "public.v_is_admin"
        "public.v_is_tecnico"
        "public.v_is_cliente"
    end

    "public.user_roles" ..> "public.v_user_roles" : "Deriva en"
    "public.v_user_roles" ..> "public.v_is_admin" : "Simplifica a"
    "public.v_user_roles" ..> "public.v_is_tecnico" : "Simplifica a"
    "public.v_user_roles" ..> "public.v_is_cliente" : "Simplifica a"

```

---

## 3. Pasos de Implementación y Verificación

Para aplicar esta estructura en tu proyecto de Supabase, sigue estos pasos:

1.  **Navegar al Editor SQL:**
    -   En el dashboard de tu proyecto Supabase, ve a la sección `SQL Editor`.
    -   Haz clic en `+ New query`.

2.  **Ejecutar el Script:**
    -   Copia todo el contenido del archivo `supabase/sql/01_usuarios_roles.sql`.
    -   Pégalo en la ventana del editor de consultas.
    -   Haz clic en el botón `RUN`. El script es idempotente, por lo que se puede ejecutar varias veces sin causar errores.

3.  **Verificar la Implementación:**

    a. **Confirmar que RLS está activado:**
       -   Ve a `Authentication` -> `Policies`.
       -   En el selector de esquemas, elige `public`.
       -   Busca las tablas `users` y `user_roles`. Deberías ver un escudo verde y el texto "RLS enabled" junto a cada una.
       -   Deberías ver la política `[Admins] Pueden leer todos los perfiles` y `[Admins] Pueden leer todas las asignaciones de roles` ya creadas.

    b. **Verificar los roles base:**
       -   En el `SQL Editor`, ejecuta la siguiente consulta:
         ```sql
         SELECT * FROM public.roles;
         ```
       -   El resultado debe mostrar las 5 filas: `admin`, `tecnico`, `recepcionista`, `cliente`, `empresa`.

    c. **Probar el trigger de creación de perfil:**
       -   Ve a `Authentication` -> `Users`.
       -   Haz clic en `+ Invite user` o `+ Add user` y crea un usuario de prueba (ej. `test@example.com` con una contraseña temporal).
       -   Vuelve al `SQL Editor` y ejecuta:
         ```sql
         SELECT * FROM public.users WHERE email = 'test@example.com';
         ```
       -   Deberías ver una nueva fila para este usuario, con el `role` por defecto establecido en `'cliente'`.
       -   **Limpieza:** Elimina el usuario de prueba desde la sección `Authentication` -> `Users` para mantener la base de datos limpia.

---

## 4. Checklist para Futuras Políticas RLS

Este es el plan de acción para asegurar los módulos que se crearán a continuación. Cada ítem representa una política RLS que debe ser implementada.

-   [ ] **Módulo de Clientes (`public.clients`)**
    -   [ ] **Admins/Recepcionistas:** Pueden ver y gestionar todos los clientes.
    -   [ ] **Técnicos:** Pueden ver los datos de clientes asociados a las Órdenes de Trabajo que tienen asignadas.
    -   [ ] **Clientes:** Solo pueden ver y editar su propio perfil (`auth.uid() = id`).
    -   [ ] **Empresas Socias:** Pueden ver los clientes que han comprado sus productos.

-   [ ] **Módulo de Órdenes de Trabajo (`public.ordenes_trabajo`)**
    -   [ ] **Admins/Recepcionistas:** Acceso total a todas las OTs.
    -   [ ] **Técnicos:** Acceso de lectura/escritura solo a OTs asignadas a ellos (`auth.uid() = tecnico_id`).
    -   [ ] **Clientes:** Acceso de solo lectura a OTs vinculadas a su `cliente_id`.

-   [ ] **Módulo de Inventario (`public.inventario`)**
    -   [ ] **Admins/Recepcionistas/Técnicos:** Acceso de lectura a toda la tabla de inventario.
    -   [ ] **Admins:** Acceso de escritura (crear, actualizar, eliminar) a los ítems.
    -   [ ] Se creará una función `public.adjust_stock` con `SECURITY DEFINER` para que los técnicos puedan descontar stock de forma controlada.

-   [ ] **Módulo de Marketplace (`public.productos`, `public.ordenes_compras`)**
    -   [ ] **Empresas Socias:** Pueden gestionar (`CRUD`) solo los productos vinculados a su `empresa_id`. Pueden ver solo las órdenes de sus productos.
    -   [ ] **Clientes:** Pueden ver todos los productos activos, pero solo sus propias órdenes de compra.
    -   [ ] **Admins:** Acceso total a todos los productos y órdenes del marketplace.

---

## 5. Tareas Pendientes (TODOs)

-   [ ] **Implementar Políticas RLS:** Escribir y aplicar los `CREATE POLICY` para cada uno de los puntos del checklist anterior a medida que se desarrollen los módulos.
-   [ ] **Desarrollar UI de Administración:** Crear las páginas en el panel de administración (`/user-management`) que permitan a un `Admin` asignar y revocar roles de la tabla `public.user_roles` de forma visual.
-   [ ] **Pruebas de Seguridad:** Configurar pruebas unitarias para la base de datos (ej. con `pgTAP`) para verificar que las políticas RLS funcionan como se espera para cada rol, bloqueando y permitiendo el acceso correctamente.
