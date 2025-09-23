# [Sección 2.1] — Guía de Pruebas para Políticas RLS

## 1. Escenario de Prueba

Para validar nuestras políticas de seguridad, trabajaremos con tres perfiles de usuario ficticios. **Nota:** Esta guía describe los perfiles; para las pruebas, deberás crear estos usuarios en tu instancia de Supabase (`Authentication > Users`) y asignarles sus roles correspondientes en la tabla `public.user_roles`.

-   **`admin@local` (Rol: `admin`)**
    -   **Objetivo:** Tiene control total y sin restricciones sobre todos los datos de usuarios y roles. Debería poder crear, leer, actualizar y eliminar cualquier registro en las tablas `public.users` y `public.user_roles`.

-   **`tecnico@local` (Rol: `tecnico`)**
    -   **Objetivo:** Es un usuario con privilegios limitados. Debería poder leer la lista de otros usuarios (`public.users`) para, por ejemplo, asignar órdenes de trabajo. Solo puede modificar su *propio perfil* en campos específicos (nombre, teléfono). **No** debe poder eliminar usuarios, crear usuarios nuevos ni modificar el rol de nadie.

-   **`recepcionista@local` (Rol: `recepcionista`)**
    -   **Objetivo:** Similar al técnico, tiene acceso de lectura a la información de usuarios para gestionar la atención al cliente. Sus permisos de escritura son igualmente restringidos a su propio perfil.

---

## 2. Pasos de Verificación en Supabase SQL Editor

Sigue estos pasos para ejecutar una suite de pruebas controlada directamente desde el editor SQL de Supabase.

### ✅ Paso 1: Aplicar Migraciones

Asegúrate de haber ejecutado exitosamente los siguientes scripts SQL en orden:
1.  `supabase/sql/01_usuarios_roles.sql`
2.  `supabase/sql/02_rls_politicas.sql`
3.  `supabase/sql/03_permisos.sql`

### ✅ Paso 2: Verificar Vistas y Helpers

Ejecuta estas consultas como `postgres` (el rol por defecto del editor) para confirmar que las vistas funcionan. Reemplaza los UUIDs con los que correspondan a tus usuarios de prueba.

```sql
-- Verifica la vista de roles efectivos (debería mostrar los roles de cada usuario)
SELECT * FROM public.v_user_roles LIMIT 5;

-- Verifica la vista de helper 'is_admin'
-- Reemplaza con el UUID de tu usuario admin y de un no-admin
SELECT * FROM public.v_is_admin
WHERE user_id IN ('<UUID_DEL_ADMIN>', '<UUID_DEL_TECNICO>');
-- Resultado esperado: (admin_uuid, true), (tecnico_uuid, false)

-- Verifica la vista de permisos efectivos
SELECT * FROM public.v_effective_permissions
WHERE user_id = '<UUID_DEL_TECNICO>';
-- Resultado esperado: Debe listar los permisos asignados al rol 'tecnico'.
```

### ✅ Paso 3: Simular Consultas como Usuario No-Admin (Pruebas de Fallo)

Usaremos un bloque `DO` para simular que las consultas son ejecutadas por `tecnico@local`. **Reemplaza `<UID_DEL_TECNICO>` por el ID real del usuario.**

Estas consultas **deben fallar** con un error de `violates row-level security policy`.

```sql
DO $$
BEGIN
  -- Simula la sesión como el usuario técnico
  SET LOCAL ROLE authenticator;
  SET LOCAL "request.jwt.claims" TO '{"sub": "<UID_DEL_TECNICO>", "role": "authenticated"}';

  -- ❌ INTENTO DE INSERTAR: Debería fallar
  RAISE NOTICE 'Intentando insertar un nuevo usuario como técnico...';
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (gen_random_uuid(), 'Usuario Malicioso', 'hacker@example.com', 'cliente');

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ÉXITO DE LA PRUEBA: La inserción falló como se esperaba. %', SQLERRM;
END $$;

DO $$
BEGIN
  -- Simula la sesión como el usuario técnico
  SET LOCAL ROLE authenticator;
  SET LOCAL "request.jwt.claims" TO '{"sub": "<UID_DEL_TECNICO>", "role": "authenticated"}';

  -- ❌ INTENTO DE MODIFICAR ROL PROPIO: Debería fallar por la cláusula WITH CHECK
  RAISE NOTICE 'Intentando cambiar el propio rol a admin...';
  UPDATE public.users SET role = 'admin' WHERE id = '<UID_DEL_TECNICO>';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ÉXITO DE LA PRUEBA: La actualización del rol falló como se esperaba. %', SQLERRM;
END $$;
```

### ✅ Paso 4: Simular Consultas (Pruebas de Éxito)

Estas consultas **deben funcionar** según lo esperado para cada rol.

```sql
-- 1. Un técnico PUEDE leer la lista de usuarios.
-- Reemplaza <UID_DEL_TECNICO> con el ID del usuario técnico.
DO $$
DECLARE
  user_count INT;
BEGIN
  SET LOCAL ROLE authenticator;
  SET LOCAL "request.jwt.claims" TO '{"sub": "<UID_DEL_TECNICO>", "role": "authenticated"}';

  RAISE NOTICE 'Intentando leer la lista de usuarios como técnico...';
  SELECT count(*) INTO user_count FROM public.users;
  RAISE NOTICE 'ÉXITO DE LA PRUEBA: El técnico pudo leer % usuarios.', user_count;
END $$;


-- 2. Un técnico PUEDE actualizar SU PROPIO nombre y teléfono.
DO $$
BEGIN
  SET LOCAL ROLE authenticator;
  SET LOCAL "request.jwt.claims" TO '{"sub": "<UID_DEL_TECNICO>", "role": "authenticated"}';

  RAISE NOTICE 'Intentando actualizar el perfil propio como técnico...';
  UPDATE public.users
  SET full_name = 'Nombre Actualizado Por Tecnico', phone = '123456789'
  WHERE id = '<UID_DEL_TECNICO>';
  RAISE NOTICE 'ÉXITO DE LA PRUEBA: El técnico actualizó su perfil correctamente.';

  -- Revertir el cambio para mantener los datos limpios
  UPDATE public.users
  SET full_name = 'Tecnico de Prueba', phone = '987654321'
  WHERE id = '<UID_DEL_TECNICO>';
  RAISE NOTICE 'Cambio revertido.';
END $$;


-- 3. Un admin PUEDE hacer de todo.
-- Reemplaza <UID_DEL_ADMIN> con el ID del usuario admin.
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  SET LOCAL ROLE authenticator;
  SET LOCAL "request.jwt.claims" TO '{"sub": "<UID_DEL_ADMIN>", "role": "authenticated"}';

  RAISE NOTICE 'Intentando crear un usuario como admin...';
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (new_user_id, 'Creado Por Admin', 'admin_created@test.com', 'cliente');
  RAISE NOTICE 'ÉXITO DE LA PRUEBA: Admin creó un usuario.';

  RAISE NOTICE 'Intentando eliminar el usuario creado como admin...';
  DELETE FROM public.users WHERE id = new_user_id;
  RAISE NOTICE 'ÉXITO DE LA PRUEBA: Admin eliminó el usuario.';
END $$;
```

---

## 3. Pruebas Futuras y Siguientes Pasos

La base de seguridad de usuarios y roles ya está validada. A medida que se construyan nuevos módulos, sus políticas RLS se apoyarán en las funciones y vistas creadas aquí:

-   **Módulo de Clientes:** Se usarán las vistas `v_is_admin` y `v_is_recepcionista` para dar acceso total, y se comparará `auth.uid()` con la columna `id` del cliente para que un cliente solo pueda ver su propia información.
-   **Módulo de Órdenes de Trabajo:** Las políticas RLS usarán `v_is_tecnico` y compararán `auth.uid()` con la columna `tecnico_id` para restringir el acceso solo a las órdenes asignadas.
-   **Permisos Granulares:** La vista `v_effective_permissions` será clave para políticas más complejas. Por ejemplo: `CHECK (EXISTS (SELECT 1 FROM v_effective_permissions WHERE permission_slug = 'clientes.write'))`.

---

## 4. Checklist de Verificación

Usa esta lista para confirmar que todas las pruebas se han realizado con éxito.

-   [ ] **Configuración:**
    -   [ ] Se han ejecutado los scripts `01`, `02` y `03` sin errores.
    -   [ ] Se han creado los 3 usuarios de prueba (`admin`, `tecnico`, `recepcionista`) en Supabase Auth.
    -   [ ] Se han asignado los roles correspondientes en `public.user_roles`.
-   [ ] **Verificación de Vistas:**
    -   [ ] La consulta a `v_user_roles` devuelve los roles esperados.
    -   [ ] La consulta a `v_is_admin` devuelve `true` para el admin y `false` para los demás.
    -   [ ] La consulta a `v_effective_permissions` muestra los permisos correctos para un técnico.
-   [ ] **Pruebas de Fallo (como `tecnico@local`):**
    -   [ ] `INSERT` en `public.users` falla.
    -   [ ] `DELETE` de otro usuario en `public.users` falla (no incluido, pero implícito).
    -   [ ] `UPDATE` del campo `role` en su propio perfil falla.
    -   [ ] `UPDATE` del campo `email` en su propio perfil falla.
-   [ ] **Pruebas de Éxito:**
    -   [ ] `tecnico@local` PUEDE ejecutar `SELECT` en `public.users`.
    -   [ ] `tecnico@local` PUEDE `UPDATE` su propio `full_name` y `phone`.
    -   [ ] `admin@local` PUEDE `INSERT` y `DELETE` en `public.users`.
