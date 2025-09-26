# Guía de Uso y Pruebas de la UI de Órdenes de Trabajo

Este documento describe la funcionalidad de la interfaz de usuario (UI) para la gestión de Órdenes de Trabajo (OT) y cómo probarla.

## 1. Funcionalidad Implementada

### `src/pages/WorkOrdersPage.tsx`
Es la página principal que orquesta la visualización de las OTs.
- **Listado Principal:** Al cargar, obtiene y muestra una lista de todas las órdenes de trabajo en un componente de tabla.
- **Gestión de Selección:** Mantiene el estado de la OT seleccionada actualmente.
- **Modal de Detalles:** Al seleccionar una OT de la tabla, renderiza el componente `WorkOrderDetail` en una superposición modal para mostrar los detalles completos.

### `src/components/ot/WorkOrderTable.tsx`
Componente de tabla para mostrar la lista de OTs de forma resumida.
- **Columnas Clave:** Muestra la información más importante para una identificación rápida: ID, Cliente, Equipo, Problema y Estado.
- **Interactividad:** Cada fila es interactiva. Al hacer clic, se invoca una función `onSelectOrder` para notificar a la página principal qué OT ha sido seleccionada.

### `src/components/ot/WorkOrderDetail.tsx`
Componente modal que muestra toda la información detallada de una única OT.
- **Carga de Datos:** Al montarse, utiliza el `orderId` proporcionado para llamar al servicio `getWorkOrderById` y obtener los datos completos.
- **Visualización Estructurada:** Organiza la información en secciones claras: Cliente, Equipo, Problema y Diagnóstico.
- **Acciones:** Contiene botones para realizar acciones sobre la OT:
    - **Imprimir (`PrintButton`):** Llama al módulo de impresión para generar una vista previa del documento de la OT.
    - **Facturar en POS:** Redirige al usuario a la página del Punto de Venta (`/pos`), pasando el ID de la OT en la URL para iniciar el proceso de facturación. Este botón solo es visible para roles `admin` y `recepcionista`.

## 2. Cómo Probar el Flujo Completo

**Paso 1: Preparar Datos de Prueba**
Asegúrate de tener al menos una orden de trabajo en tu base de datos. Si no tienes ninguna, puedes crearla ejecutando lo siguiente en el `SQL Editor` de Supabase (reemplaza los UUIDs si es necesario):

```sql
-- NOTA: Este script asume que ya existen un cliente y un equipo.
INSERT INTO public.work_orders (client_name, device_type, issue_description, status)
VALUES ('Cliente de Prueba para UI', 'Laptop', 'El equipo no enciende, huele a quemado.', 'Ingresado');
```

**Paso 2: Probar la Vista Principal y el Modal**
1.  **Inicia sesión** con cualquier rol que tenga acceso de lectura a las OTs (ej. `recepcionista` o `tecnico`).
2.  **Navega** a la página `/ot`.
3.  **Verificación:**
    -   La tabla debería cargar y mostrar la OT que creaste.
    -   Haz clic en la fila de la OT.
    -   La ventana modal de "Detalles de la Orden" debería aparecer, mostrando toda la información.
    -   Presiona la tecla `Escape` (`Esc`). El modal debería cerrarse. Vuelve a abrirlo.
    -   Haz clic fuera del área del modal (en el fondo oscuro). El modal debería cerrarse.

**Paso 3: Probar las Acciones del Modal**

1.  **Impresión:**
    -   Con el modal abierto, haz clic en el botón **"Imprimir"**.
    -   Una nueva pestaña del navegador debería abrirse, mostrando una versión formateada de la Orden de Trabajo, lista para ser impresa o guardada como PDF.

2.  **Facturación (como Recepcionista/Admin):**
    -   **Inicia sesión** con un usuario que tenga el rol `admin` o `recepcionista`.
    -   Abre el detalle de una OT.
    -   El botón verde **"Facturar en POS"** debería estar visible. Haz clic en él.
    -   Deberías ser redirigido a la página del Punto de Venta.
    -   Verifica la URL en tu navegador. Debería ser `http://<tu-url>/pos?ot=<ID>`, donde `<ID>` es el número de la OT que estabas viendo.

3.  **Facturación (como Técnico):**
    -   **Inicia sesión** con un usuario que tenga el rol `tecnico`.
    -   Abre el detalle de una OT.
    -   **Verificación:** El botón "Facturar en POS" **no** debería ser visible.

Si todas estas pruebas son exitosas, la funcionalidad de la UI de Órdenes de Trabajo está operando correctamente.
