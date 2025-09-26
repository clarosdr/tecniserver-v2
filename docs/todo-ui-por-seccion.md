# Hoja de Ruta de Desarrollo de la Interfaz de Usuario (UI)

Este documento es una lista de tareas pendientes (`TODO`) para la construcción de la interfaz de usuario, organizada por las secciones definidas en la documentación de la arquitectura.

## ✅ Completado

-   **Sección 1: Infraestructura de UI:**
    -   [x] Configuración de Vite, React y TypeScript.
    -   [x] Conexión a Supabase (`supabase.ts`).
    -   [x] Sistema de enrutamiento con `react-router-dom` (`routes.tsx`).
    -   [x] Layout principal con `Sidebar` y `Topbar`.
    -   [x] Helpers de sesión y roles (`session.ts`, `roles.ts`).
-   **Sección 3: Clientes y Equipos:**
    -   [x] Página de gestión con layout de 2 columnas.
    -   [x] Componente de búsqueda y paginación de clientes.
    -   [x] Formularios para crear/editar clientes y equipos.
    -   [x] Lógica de catálogos dependientes en el formulario de equipos.
-   **Sección 4: Órdenes de Trabajo (Vista):**
    -   [x] Página de listado de OTs.
    -   [x] Modal de detalles de OT (solo lectura).
-   **Sección 7: Punto de Venta (POS):**
    -   [x] Flujo de apertura de caja.
    -   [x] Página de POS con precarga desde OT.
    -   [x] Componentes de carrito, pagos y búsqueda de productos.
-   **Sección 8: Presupuestos (Vista):**
    -   [x] Página de listado y filtrado de presupuestos.
    -   [x] Botón para convertir presupuesto a venta.
-   **Sección 9: Impresión:**
    -   [x] Componente `PrintButton` reutilizable.
    -   [x] Integración en OTs y POS.
-   **Sección 10: Portal de Cliente:**
    -   [x] Página del portal con tarjetas de resumen y listas de datos.
-   **Sección 11: Marketplace:**
    -   [x] Página pública del marketplace con filtros y paginación.
    -   [x] Página del portal de socio con pestañas para productos y pedidos.
    -   [x] Tablas de gestión para publicaciones y pedidos del socio.

---

## 📝 Pendiente (TODO)

### Sección 2: Gestión de Usuarios
-   [ ] **Página de Administración de Usuarios:**
    -   [ ] Crear una nueva ruta y página en `/config/usuarios`.
    -   [ ] Tabla para listar todos los usuarios de `public.users`.
    -   [ ] Modal o formulario para editar un usuario y asignarle/revocarle roles desde `public.user_roles`. (Visible solo para `admin`).
-   [ ] **Página "Mi Perfil":**
    -   [ ] Crear una sección para que el usuario autenticado pueda editar su propio `full_name` y `phone`.

### Sección 4: Órdenes de Trabajo (Gestión)
-   [ ] **Formulario de Creación de OT:**
    -   [ ] Añadir un botón "Nueva OT" en `WorkOrdersPage`.
    -   [ ] El formulario debe permitir buscar y seleccionar un cliente y uno de sus equipos.
    -   [ ] Campos para `diagnostico_preliminar`, `observaciones`, `prioridad`, etc.
-   [ ] **Edición de OT:**
    -   [ ] En el modal `WorkOrderDetail`, habilitar la edición de campos según el rol del usuario.
    -   [ ] Un `tecnico` debe poder cambiar el estado (ej. a `en_proceso`) y añadir notas técnicas.
    -   [ ] Un `recepcionista` debe poder cambiar la `prioridad`.
-   [ ] **Gestión de Accesorios y Adjuntos:**
    -   [ ] En el modal `WorkOrderDetail`, añadir secciones para listar y agregar accesorios entregados con el equipo.
    -   [ ] Implementar la subida de archivos (fotos, documentos) a Supabase Storage y vincularlos a la OT.

### Sección 5: Mantenimientos Programados
-   [ ] **Página de Mantenimientos:**
    -   [ ] Crear una nueva ruta y página en `/mantenimientos`.
    -   [ ] Vista de calendario o tabla para mostrar los mantenimientos programados.
    -   [ ] Formulario para agendar un nuevo mantenimiento preventivo para un cliente/equipo.

### Sección 6: Inventario
-   [ ] **Página de Inventario:**
    -   [ ] Reemplazar el placeholder de `InventoryPage.tsx`.
    -   [ ] Tabla principal que muestre el stock actual de productos (`public.stock`).
    -   [ ] Filtros por almacén.
    -   [ ] Vista de detalle de un producto que muestre sus lotes, fechas de vencimiento y un historial de movimientos (Kardex).
-   [ ] **Formulario de Movimientos:**
    -   [ ] Modal para registrar nuevos movimientos de inventario (ej. `entrada` por compra, `ajuste` por conteo físico).

### Sección 8: Presupuestos (Gestión)
-   [ ] **Formulario de Creación/Edición de Presupuestos:**
    -   [ ] Botón "Nuevo Presupuesto" en `BudgetsPage`.
    -   [ ] Formulario para crear un presupuesto, opcionalmente a partir de una OT.
    -   [ ] Funcionalidad para buscar y añadir ítems (productos y servicios) al presupuesto.
-   [ ] **Vista de Aprobación para Cliente:**
    -   [ ] Crear una página pública (que use tokens de `portal_tokens`) donde un cliente pueda ver su presupuesto y aprobarlo con una firma simple.

### Sección 12: Fidelización
-   [ ] **Integración en Portal de Cliente:**
    -   [ ] Añadir una tarjeta de resumen con el saldo de puntos.
    -   [ ] Añadir una nueva lista o pestaña para ver el historial de movimientos de puntos.
-   [ ] **Integración en POS:**
    -   [ ] Añadir una opción en `PaymentsBox` para usar puntos como parte del pago.

### Sección 13: Configuración de IA
-   [ ] **Página de Administración de IA:**
    -   [ ] Crear una nueva ruta y página en `/config/ia`.
    -   [ ] UI para que los `admin` gestionen `ai_providers` y `ai_prompts`.
    -   [ ] Dashboard para visualizar las métricas de `ai_metrics_daily` y los logs de `ai_runs`.
