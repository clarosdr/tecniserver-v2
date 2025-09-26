# UI del Portal de Socios del Marketplace

Este documento describe la funcionalidad de la nueva interfaz para socios (empresas) y cómo probarla.

## 1. Funcionalidad Implementada

### `src/pages/MarketplacePartnerPage.tsx`
Esta es la página de entrada para cualquier usuario que pertenezca a una empresa socia.
- **Vista Tabulada:** Presenta dos pestañas: "Mis Publicaciones" y "Mis Pedidos".
- **Identificación:** Muestra el nombre de la empresa del usuario en el encabezado para confirmar la identidad.

### `src/components/marketplace/PartnerProductsTable.tsx`
Componente que se muestra en la pestaña "Mis Publicaciones".
- **Listado:** Muestra únicamente los productos creados por la empresa del usuario.
- **Edición en Línea:** Permite editar el precio y el stock de un producto directamente en la tabla.
- **Gestión de Estado:** Permite activar o desactivar una publicación para que sea visible o no en el marketplace público.
- **Creación:** (Funcionalidad futura, botón presente) Permitirá añadir nuevos productos.

### `src/components/marketplace/PartnerOrdersTable.tsx`
Componente que se muestra en la pestaña "Mis Pedidos".
- **Listado:** Muestra únicamente los pedidos que los clientes han realizado de los productos de la empresa.
- **Gestión de Pedidos:** Permite al socio actualizar el estado de un pedido, siguiendo el flujo `en_proceso` -> `enviada` -> `entregada`.
- **Seguridad:** Las acciones para cambiar el estado de un pedido están protegidas y solo son visibles para usuarios con el rol `empresa` o `admin_empresa`.

### `src/services/mk.ts` (Extendido)
Se han añadido funciones clave que se apoyan en la vista `v_portal_identity` para asegurar que un usuario solo pueda acceder y modificar los recursos de su propia empresa.
- `myCompanyId()`: Identifica la empresa del usuario actual.
- `myProducts()`, `myOrders()`: Leen datos filtrados por la empresa del usuario.
- `updateProduct()`, `updateOrderStatus()`: Modifican datos, pero incluyen una cláusula `eq('empresa_id', ...)` como una capa de seguridad adicional a nivel de API para prevenir accesos no autorizados.

## 2. Cómo Probar la Funcionalidad

**Paso 1: Configurar un Usuario de Prueba**
Necesitamos un usuario en Supabase que esté vinculado a una empresa. Ejecuta el siguiente script en el `SQL Editor`.

```sql
-- 1. Asegúrate de tener una empresa de prueba
INSERT INTO public.empresas (id, nombre, nit)
VALUES ('a1b2c3d4-0001-0001-0001-000000000002', 'PC Gamers Colombia', '900.333.444-2')
ON CONFLICT (id) DO NOTHING;

-- 2. Asegúrate de tener un usuario de prueba en auth.users
--    Crea uno desde el dashboard de Supabase: Authentication > Users > Add User
--    Ej: empresa@local, con una contraseña.

-- 3. Vincula el usuario a la empresa con un rol
--    Reemplaza '<UUID_DEL_USUARIO_EMPRESA>' con el ID del usuario que creaste.
INSERT INTO public.empresa_users (user_id, empresa_id, rol)
VALUES ('<UUID_DEL_USUARIO_EMPRESA>', 'a1b2c3d4-0001-0001-0001-000000000002', 'empresa')
ON CONFLICT (user_id, empresa_id) DO NOTHING;
```

**Paso 2: Crear Datos de Prueba (Pedidos y Productos)**
Ahora, crea un producto y un pedido para la empresa "PC Gamers Colombia".

```sql
-- 1. Un producto para la empresa
INSERT INTO public.mk_products (empresa_id, sku, nombre, precio, stock_publicado, activo)
VALUES ('a1b2c3d4-0001-0001-0001-000000000002', 'PCG-MON-01', 'Monitor Curvo 27"', 1200000, 15, true)
ON CONFLICT (sku) DO NOTHING;

-- 2. Un pedido para ese producto (asegúrate de que exista un cliente)
-- Reemplaza '<UUID_DE_UN_CLIENTE>' con el ID de un cliente existente.
INSERT INTO public.mk_orders (empresa_id, cliente_id, numero, estado, total)
VALUES ('a1b2c3d4-0001-0001-0001-000000000002', '<UUID_DE_UN_CLIENTE>', 'MK-2024-00010', 'en_proceso', 1200000)
ON CONFLICT (numero) DO NOTHING;
```

**Paso 3: Pruebas en la Interfaz de Usuario**

1.  **Inicia sesión** en la aplicación con las credenciales del usuario `empresa@local`.
2.  **Navega** a la página del portal de socio (ej. `/marketplace/partner`).
3.  **Verificación del Encabezado:** Confirma que el nombre "PC Gamers Colombia" aparece en la parte superior.
4.  **Pestaña "Mis Publicaciones":**
    -   Verifica que solo ves el producto "Monitor Curvo 27"" y no los de otras empresas.
    -   Haz clic en "Editar". Cambia el precio a `1250000` y el stock a `14`. Haz clic en "Guardar". La tabla debería actualizarse.
    -   Haz clic en "Desactivar". El estado debería cambiar a "Inactivo". Vuelve a hacer clic en "Activar".
5.  **Pestaña "Mis Pedidos":**
    -   Verifica que ves el pedido `MK-2024-00010`.
    -   El estado inicial debe ser "en proceso". Deberías ver un botón "Marcar Enviada".
    -   Haz clic en "Marcar Enviada". El estado del pedido debería cambiar a "enviada" y el botón ahora debería ser "Marcar Entregada".
    -   Haz clic en "Marcar Entregada". El estado debería cambiar a "entregada" y ya no deberían aparecer más botones de acción.

Si todas estas pruebas son exitosas, la implementación de la UI y las políticas de seguridad a nivel de fila (RLS) están funcionando correctamente.
