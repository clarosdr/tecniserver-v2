# Guía de Uso y Pruebas de la UI del Portal del Cliente

Este documento detalla los componentes creados para el portal del cliente y los pasos necesarios para probar su funcionalidad y seguridad.

## 1. Componentes Implementados

### `src/pages/PortalClientPage.tsx`
Es la página principal del portal. Su lógica es la siguiente:
1.  Al cargar, llama al servicio `myIdentity()` para verificar si el usuario que ha iniciado sesión está vinculado a un `cliente_id`.
2.  Si no hay un `cliente_id`, muestra un mensaje pidiendo al usuario que contacte a soporte.
3.  Si existe un `cliente_id`, procede a llamar a las demás funciones del servicio (`myEquipos`, `myOTs`, etc.) para obtener todos los datos del cliente.
4.  Renderiza los componentes de UI (`ClientSummaryCards` y `ClientLists`) pasándoles los datos obtenidos.
5.  Gestiona los estados de carga y error.

### `src/components/portal/ClientSummaryCards.tsx`
Un componente de "dashboard" que muestra cuatro métricas clave en tarjetas visuales:
-   Número total de equipos registrados del cliente.
-   Conteo de Órdenes de Trabajo (OT) que están en un estado "activo".
-   Conteo de Presupuestos que están "pendientes" (en borrador o enviados).
-   El monto, fecha y número de la última factura registrada.

### `src/components/portal/ClientLists.tsx`
Este componente organiza y muestra la información detallada en cuatro listas separadas:
-   **Mis Equipos:** Muestra el nombre descriptivo y el serial de cada equipo.
-   **Mis Órdenes de Trabajo:** Muestra el código de la OT, el equipo asociado y su estado actual.
-   **Mis Presupuestos:** Muestra el número, total y estado de cada presupuesto.
-   **Mis Facturas:** Muestra el número, fecha y total de cada venta.

### `src/services/portal.ts`
Capa de datos dedicada al portal. Las funciones se apoyan en las políticas RLS de Supabase, que son la verdadera barrera de seguridad, para asegurar que las consultas solo devuelvan los datos que le pertenecen al `cliente_id` asociado al usuario.

## 2. Cómo Probar la Funcionalidad

**Paso 1: Vincular un Usuario a un Cliente**
Para probar el portal, necesitas un usuario de `auth.users` que esté explícitamente vinculado a un registro en `public.clientes`.

Ejecuta el siguiente script en el `SQL Editor` de tu proyecto de Supabase. **Asegúrate de reemplazar los UUIDs con valores reales de tu base de datos.**

```sql
-- 1. Asegúrate de tener un usuario de prueba en auth.users
--    Si no lo tienes, créalo desde el dashboard: Authentication > Users > Add User
--    Ej: cliente@local, con una contraseña.

-- 2. Asegúrate de tener un cliente de prueba y algunos datos asociados (OTs, equipos).
--    Reemplaza este UUID con el de tu cliente de prueba.
--    'a1b2c3d4-0000-0000-0000-000000000001'
DECLARE
  test_client_id UUID := (SELECT id FROM public.clientes LIMIT 1);
BEGIN
  -- Crear un equipo para este cliente si no tiene
  INSERT INTO public.equipos_cliente (cliente_id, tipo_equipo_slug, marca_slug, modelo_slug, serial)
  VALUES (test_client_id, 'laptop', 'dell', 'xps-13', 'CLIENTE_DELL_SN123')
  ON CONFLICT (serial_normalizado) DO NOTHING;
  
  -- Crear una OT para este cliente si no tiene
  INSERT INTO public.ot (cliente_id, equipo_id, estado, diagnostico_preliminar)
  SELECT test_client_id, id, 'abierta', 'Prueba para portal cliente'
  FROM public.equipos_cliente WHERE cliente_id = test_client_id LIMIT 1
  ON CONFLICT DO NOTHING;
END $$;


-- 3. Crea el vínculo en la tabla `cliente_users`
--    Reemplaza '<UUID_DEL_USUARIO_CLIENTE>' con el ID del usuario `cliente@local`.
--    Reemplaza '<UUID_DEL_CLIENTE_DE_PRUEBA>' con el ID del cliente al que quieres vincularlo.
INSERT INTO public.cliente_users (user_id, cliente_id)
VALUES ('<UUID_DEL_USUARIO_CLIENTE>', '<UUID_DEL_CLIENTE_DE_PRUEBA>')
ON CONFLICT (user_id, cliente_id) DO NOTHING;
```

**Paso 2: Probar en la Interfaz de Usuario**

1.  **Inicia sesión** en la aplicación con las credenciales del usuario `cliente@local`.
2.  **Navega** a la página `/portal`.
3.  **Verificación:**
    -   La página debe cargar sin errores.
    -   Las tarjetas de resumen deben mostrar los conteos correctos para el cliente que vinculaste (ej. "Equipos Registrados: 1", "Órdenes Activas: 1").
    -   Las listas detalladas deben mostrar únicamente los equipos, OTs, presupuestos y ventas que pertenecen a ese cliente. No deberías ver datos de ningún otro cliente.
4.  **Prueba de Falla (Opcional):**
    -   Crea un nuevo usuario de prueba, pero **NO** lo vincules en `cliente_users`.
    -   Inicia sesión con este nuevo usuario y navega a `/portal`.
    -   La página debería mostrar el mensaje: "Tu usuario no está asociado a un perfil de cliente...".

Si las pruebas son exitosas, significa que tanto la UI como las políticas RLS están funcionando correctamente para aislar los datos del cliente.
