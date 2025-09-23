# [Sección 7] — Módulo de Punto de Venta (POS)

## 1. Resumen del Módulo

El módulo de Punto de Venta (POS) es el componente transaccional principal para la venta directa de productos y servicios. Su objetivo es gestionar el flujo completo de una venta, desde la apertura de la caja hasta el registro de pagos y la gestión de devoluciones, asegurando una integración perfecta y en tiempo real con otros módulos clave del sistema.

**Relación con otros módulos:**
-   **Inventario:** Es la relación más crítica. Cada ítem vendido a través del POS genera automáticamente un movimiento de `salida` en el inventario, descontando el stock del lote correspondiente. De manera inversa, una devolución procesada mediante una `nota_credito` dispara un movimiento de `devolucion_venta`, reingresando el producto al stock.
-   **Órdenes de Trabajo (OT):** El POS puede facturar una OT. Una venta puede estar vinculada a una `ot_id` para cobrar al cliente por los repuestos y la mano de obra utilizados en una reparación, consolidando así el ciclo de servicio y facturación.
-   **Contabilidad:** Cada venta y pago se convierte en un registro fundamental para los informes financieros, el cálculo de ingresos y el arqueo de caja.

---

## 2. Diagrama de Entidades (Mermaid)

```mermaid
erDiagram
    "cajas" {
        UUID id PK
        TEXT nombre
    }

    "caja_aperturas" {
        UUID id PK
        UUID caja_id FK
        UUID abierto_por FK
        TIMESTAMPTZ fecha_apertura
    }

    "ventas" {
        UUID id PK
        TEXT numero UK
        UUID cliente_id FK
        UUID ot_id FK
        UUID caja_apertura_id FK
        NUMERIC total
        TEXT estado
    }

    "venta_items" {
        BIGINT id PK
        UUID venta_id FK
        UUID producto_id FK
        UUID lote_id FK
        INT cantidad
    }

    "pagos" {
        BIGINT id PK
        UUID venta_id FK
        TEXT metodo
        NUMERIC monto
    }

    "notas_credito" {
        UUID id PK
        UUID venta_id FK
        NUMERIC total
    }

    "movimientos_inventario" {
        BIGINT id PK
        TEXT tipo
        INT cantidad
        TEXT referencia "e.g., Venta N°, NC N°"
    }

    "cajas" ||--|{ "caja_aperturas" : "Tiene turnos de"
    "caja_aperturas" ||--|{ "ventas" : "Registra ventas en"
    "ventas" ||--|{ "venta_items" : "Contiene"
    "ventas" ||--|{ "pagos" : "Recibe"
    "ventas" ||--o{ "notas_credito" : "Puede ser devuelta en"
    "venta_items" }|..| "movimientos_inventario" : "Dispara SALIDA"
    "notas_credito" }|..| "movimientos_inventario" : "Dispara DEVOLUCIÓN"
```

---

## 3. Flujos de Proceso

### Flujo de Venta Estándar
1.  **Apertura de Caja:** Un `recepcionista` inicia su turno abriendo una caja. Esto crea un registro en `caja_aperturas` con el saldo inicial.
2.  **Creación de Venta:** Se crea un registro en `ventas`, asociándolo a la apertura de caja actual, un cliente y opcionalmente una OT. El estado inicial es `abierta`.
3.  **Añadir Ítems:** Se insertan registros en `venta_items` por cada producto o servicio vendido. Un trigger (`fn_inv_on_item_insert`) descuenta automáticamente el stock del inventario. Otro trigger (`fn_recalc_totales_venta`) actualiza los totales en la tabla `ventas`.
4.  **Registro de Pagos:** Se insertan uno o más registros en `pagos`.
5.  **Cierre de Venta:** Después de cada pago, un trigger (`fn_after_pago`) verifica si la suma de los montos pagados es mayor o igual al total de la venta. Si es así, el estado de la `venta` cambia automáticamente a `pagada`.

### Flujo de Devolución
1.  **Creación de Nota de Crédito:** Un `recepcionista` crea un registro en `notas_credito`, referenciando la `venta` original.
2.  **Reingreso a Stock y Actualización:** Un trigger (`fn_inv_on_nc_insert`) se dispara y realiza dos acciones clave:
    -   Inserta movimientos de tipo `devolucion_venta` en `movimientos_inventario` por cada ítem de la venta original, reponiendo el stock.
    -   Actualiza el estado de la `venta` original a `devuelta`.

---

## 4. Cómo Aplicar la Estructura

Sigue estos pasos en el **SQL Editor** de tu proyecto Supabase.

1.  **Ejecutar Script del Modelo de Datos:**
    -   Copia el contenido de `supabase/sql/12_pos_modelo.sql`.
    -   Pégalo en una nueva consulta y ejecútalo.

2.  **Ejecutar Script de Políticas de Seguridad (RLS):**
    -   Copia el contenido de `supabase/sql/13_rls_pos.sql`.
    -   Pégalo en una nueva consulta y ejecútalo.

---

## 5. Pruebas Manuales en Supabase SQL Editor

Ejecuta estas consultas para verificar que la lógica y los permisos funcionan como se espera. **Recuerda reemplazar los `<UUID_...>` por los IDs reales.**

### Como `recepcionista@local` (Flujo Completo)
```sql
DO $$
DECLARE
  test_caja_id UUID := (SELECT id FROM public.cajas LIMIT 1);
  test_apertura_id UUID;
  test_venta_id UUID;
  test_cliente_id UUID := (SELECT id FROM public.clientes LIMIT 1);
  test_producto_id UUID := (SELECT id FROM public.productos WHERE sku = 'SSD-KNG-240');
  test_lote_id UUID := (SELECT id FROM public.producto_lotes WHERE producto_id = test_producto_id LIMIT 1);
  venta_total NUMERIC;
BEGIN
  -- Simular sesión de recepcionista
  SET LOCAL ROLE authenticator;
  SET LOCAL "request.jwt.claims" TO '{"sub": "<UUID_DE_RECEPCIONISTA>", "role": "authenticated"}';

  RAISE NOTICE '✅ [Recep] Abriendo caja...';
  INSERT INTO public.caja_aperturas(caja_id, abierto_por, saldo_inicial)
  VALUES (test_caja_id, '<UUID_DE_RECEPCIONISTA>', 100000) RETURNING id INTO test_apertura_id;
  RAISE NOTICE 'ÉXITO: Caja abierta con ID %', test_apertura_id;

  RAISE NOTICE '✅ [Recep] Creando venta...';
  INSERT INTO public.ventas(cliente_id, creada_por, caja_apertura_id)
  VALUES (test_cliente_id, '<UUID_DE_RECEPCIONISTA>', test_apertura_id) RETURNING id INTO test_venta_id;
  RAISE NOTICE 'ÉXITO: Venta creada con ID %', test_venta_id;

  RAISE NOTICE '✅ [Recep] Agregando ítems...';
  INSERT INTO public.venta_items(venta_id, producto_id, lote_id, cantidad, precio_unit) VALUES (test_venta_id, test_producto_id, test_lote_id, 2, 150000);
  INSERT INTO public.venta_items(venta_id, producto_id, cantidad, precio_unit) VALUES (test_venta_id, (SELECT id FROM public.productos WHERE sku = 'SERV-CLEAN-PC'), 1, 70000);
  PERFORM public.fn_recalc_totales_venta(test_venta_id); -- Forzar recálculo
  
  -- Verificar que se descontó el stock
  ASSERT (SELECT EXISTS (SELECT 1 FROM public.movimientos_inventario WHERE referencia = (SELECT numero FROM ventas WHERE id=test_venta_id) AND tipo = 'salida')), 'Fallo: No se creó el movimiento de salida.';
  RAISE NOTICE 'ÉXITO: Ítems agregados y stock descontado.';

  SELECT total INTO venta_total FROM public.ventas WHERE id = test_venta_id;
  RAISE NOTICE 'Total de la venta: %', venta_total;

  RAISE NOTICE '✅ [Recep] Registrando pago parcial...';
  INSERT INTO public.pagos(venta_id, metodo, monto) VALUES (test_venta_id, 'efectivo', 100000);
  ASSERT (SELECT estado FROM public.ventas WHERE id = test_venta_id) = 'abierta', 'Fallo: El estado cambió incorrectamente.';
  RAISE NOTICE 'ÉXITO: Venta sigue "abierta".';
  
  RAISE NOTICE '✅ [Recep] Registrando pago final...';
  INSERT INTO public.pagos(venta_id, metodo, monto) VALUES (test_venta_id, 'tarjeta', venta_total - 100000);
  ASSERT (SELECT estado FROM public.ventas WHERE id = test_venta_id) = 'pagada', 'Fallo: El estado no cambió a "pagada".';
  RAISE NOTICE 'ÉXITO: Venta ahora está "pagada".';

  RAISE NOTICE '✅ [Recep] Creando nota de crédito (devolución)...';
  INSERT INTO public.notas_credito(venta_id, motivo, total, creada_por) VALUES (test_venta_id, 'Cliente se arrepintió', venta_total, '<UUID_DE_RECEPCIONISTA>');
  ASSERT (SELECT estado FROM public.ventas WHERE id = test_venta_id) = 'devuelta', 'Fallo: El estado no cambió a "devuelta".';
  ASSERT (SELECT EXISTS (SELECT 1 FROM public.movimientos_inventario WHERE tipo = 'devolucion_venta')), 'Fallo: No se reingresó el stock.';
  RAISE NOTICE 'ÉXITO: Venta marcada como "devuelta" y stock reingresado.';
END $$;
```

### Como `tecnico@local` (Acceso de Solo Lectura)
```sql
DO $$
BEGIN
  -- Simular sesión de técnico
  SET LOCAL ROLE authenticator;
  SET LOCAL "request.jwt.claims" TO '{"sub": "<UUID_DEL_TECNICO>", "role": "authenticated"}';

  RAISE NOTICE '✅ [Técnico] Intentando leer ventas...';
  PERFORM * FROM public.ventas LIMIT 1;
  RAISE NOTICE 'ÉXITO: Técnico puede leer la tabla de ventas.';

  RAISE NOTICE '❌ [Técnico] Intentando crear una venta... (Debe fallar)';
  INSERT INTO public.ventas(cliente_id, creada_por) VALUES ('<UUID_DE_UN_CLIENTE>', '<UUID_DEL_TECNICO>');

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ÉXITO DE LA PRUEBA: La inserción falló como se esperaba. %', SQLERRM;
END $$;
```
---

## 6. Checklist de Verificación de Permisos

| Rol           | Abrir/Cerrar Caja | Crear Venta | Ver Ventas | Actualizar Venta (propia) | Registrar Pagos (propia) | Crear Devolución (propia) |
| :------------ | :---------------: | :---------: | :--------: | :-----------------------: | :----------------------: | :-----------------------: |
| **Admin**     |         ✅        |      ✅     |      ✅    |             ✅            |            ✅            |             ✅            |
| **Recep.**    |         ✅        |      ✅     |      ✅    |             ✅            |            ✅            |             ✅            |
| **Técnico**   |         ❌        |      ❌     |      ✅    |             ❌            |            ❌            |             ❌            |

---

## 7. Tareas Pendientes (TODOs)

-   [ ] **Impresión de Documentos:**
    -   Desarrollar una función (probablemente en el frontend o una Edge Function) para generar una representación visual de la factura/recibo/nota de crédito en formato PDF o HTML para su impresión.
-   [ ] **Integración con Pasarela de Pagos:**
    -   Añadir la lógica para conectar con servicios de pago electrónico (e.g., Stripe, Mercado Pago) para procesar pagos con tarjeta de forma segura.
-   [ ] **Reglas Fiscales y de Impuestos:**
    -   El modelo actual es genérico. Se deberá ampliar para manejar diferentes tipos de impuestos (IVA, IC, etc.), retenciones y normativas fiscales específicas de cada país donde opere el sistema.
-   [ ] **Comisiones y Marketplace:**
    -   Si se implementa un modelo de marketplace donde se venden productos de terceros, se deberá crear un módulo de comisiones que se integre con las ventas para calcular y registrar las ganancias correspondientes.
