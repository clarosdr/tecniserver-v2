# Guía de Uso y Pruebas de la UI del Punto de Venta (POS)

Este documento describe la funcionalidad de la interfaz de usuario (UI) para el módulo de Punto de Venta (POS) y cómo probar su flujo completo.

## 1. Funcionalidad Implementada

### `src/pages/PosPage.tsx`
Es la página principal que orquesta todo el proceso de venta.
- **Verificación de Caja:** Al cargar, comprueba si el usuario actual tiene una caja (`caja_aperturas`) abierta. Si no es así, muestra un modal que obliga al usuario a abrir una con un monto inicial antes de poder continuar.
- **Carga desde OT:** Detecta si la URL contiene un parámetro `?ot=<id>`. Si es así, llama a una función RPC para obtener los datos del cliente y los ítems del presupuesto de esa OT y los precarga en el estado de la venta.
- **Layout de 2 Columnas:**
  - **Izquierda:** Muestra el carrito de compras (`CartItems`) y la caja de pagos (`PaymentsBox`), junto con el total a pagar y el saldo.
  - **Derecha:** Contiene el selector de cliente, el buscador de productos/servicios y el botón para finalizar la venta.

### `src/components/pos/CartItems.tsx`
- **Gestión del Carrito:** Muestra una tabla con los productos añadidos, permitiendo ajustar la cantidad de cada uno o eliminarlos del carrito.

### `src/components/pos/PaymentsBox.tsx`
- **Gestión de Pagos:** Muestra el total a pagar, una lista de los pagos ya registrados, y un formulario para añadir nuevos pagos (efectivo, tarjeta, etc.). Calcula y muestra en tiempo real el monto faltante o el cambio a devolver.

### `src/services/pos.ts`
- **Capa de Datos:** Contiene todas las llamadas a funciones RPC de Supabase para la lógica del POS, como `fn_open_caja`, `fn_get_ot_for_pos` y la crucial `fn_create_sale`, que procesa toda la transacción de forma atómica en el backend.

## 2. Cómo Probar el Flujo Completo

**Paso 1: Preparar Datos de Prueba**
Asegúrate de tener al menos un cliente y algunos productos/servicios en tu base de datos.

```sql
-- Asegúrate de que exista al menos una caja
INSERT INTO public.cajas (nombre, descripcion) VALUES ('Caja Principal', 'Caja de la recepción')
ON CONFLICT (nombre) DO NOTHING;

-- Asegúrate de que existan productos
INSERT INTO public.productos (sku, nombre, tipo, precio_venta_base)
VALUES
  ('SERV-DIAG', 'Servicio de Diagnóstico Avanzado', 'servicio', 50000),
  ('ACC-USB-CABLE', 'Cable USB-C 1m', 'producto', 25000)
ON CONFLICT (sku) DO NOTHING;
```

**Paso 2: Probar Apertura de Caja**
1.  **Inicia sesión** con un usuario que tenga el rol `recepcionista` o `admin`.
2.  **Navega** a la página `/pos`.
3.  **Verificación:** Debería aparecer un modal pidiendo "Abrir Caja".
4.  Ingresa un monto inicial (ej. `100000`) y haz clic en "Abrir Caja".
5.  El modal debería desaparecer y deberías ver la interfaz principal del POS.

**Paso 3: Probar una Venta Manual**
1.  **Seleccionar Cliente:** En la columna derecha, busca un cliente por su nombre o documento y selecciónalo de la lista. Su nombre debería aparecer en la sección "Cliente".
2.  **Añadir Ítems:**
    -   En el buscador de productos, escribe "Diagnóstico". Selecciónalo de la lista. Debería aparecer en el carrito.
    -   Ahora busca "Cable" y añádelo también.
    -   En el carrito, cambia la cantidad del cable a `2`.
    -   Verifica que el "TOTAL A PAGAR" se actualiza correctamente. (50000 + 2*25000 = 100000).
3.  **Registrar Pagos:**
    -   En la caja de pagos, el "FALTANTE" debería ser de $100.000.
    -   Selecciona "Efectivo" y en el monto escribe `70000`. Haz clic en "Agregar Pago".
    -   El pago debería aparecer en la lista y el "FALTANTE" ahora debería ser de $30.000.
    -   Ahora, en el monto, haz clic en el botón "Saldo". El campo se autocompletará con `30000`. Haz clic en "Agregar Pago".
    -   El "FALTANTE" ahora debería ser $0, y el botón "Finalizar Venta" debería estar habilitado.
4.  **Finalizar Venta:**
    -   Haz clic en el botón verde **"Finalizar Venta"**.
    -   Deberías ver una alerta de "Venta creada con éxito".
    -   La interfaz del POS debería reiniciarse, vaciando el carrito, los pagos y la selección de cliente, lista para una nueva venta.

**Paso 4: Probar Carga desde una OT (Opcional)**
1.  Busca el ID de una OT existente que tenga un presupuesto aprobado con ítems.
2.  Navega directamente a la URL `http://<tu-url>/pos?ot=<ID_DE_LA_OT>`.
3.  **Verificación:** La página del POS debería cargar con el cliente y los ítems del presupuesto de la OT ya en el carrito, listos para ser pagados.

Si todas estas pruebas son exitosas, el módulo del POS está funcionando correctamente.
