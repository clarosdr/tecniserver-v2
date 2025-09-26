# Guía de Uso y Pruebas de la UI de Presupuestos

Este documento explica cómo utilizar y probar la nueva interfaz de usuario para la gestión de presupuestos.

## 1. Funcionalidad Implementada

### `src/pages/BudgetsPage.tsx`
Página principal para la gestión de presupuestos.
- **Filtro por Estado:** Permite a los usuarios filtrar la lista de presupuestos por su estado actual (ej. 'borrador', 'aprobado', 'convertido').
- **Notificaciones:** Muestra mensajes de éxito o error al usuario, por ejemplo, después de convertir un presupuesto a una venta.
- **Orquestación:** Carga los datos usando el servicio `budgets.ts` y los pasa al componente de tabla.

### `src/components/budgets/BudgetTable.tsx`
Componente de tabla para mostrar la lista de presupuestos.
- **Visualización Clara:** Muestra la información más relevante de cada presupuesto, incluyendo un indicador de estado con código de colores.
- **Acción Condicional:** El botón "Convertir a Venta" solo está habilitado para los presupuestos que se encuentran en estado `aprobado`. Esto guía al usuario y previene errores.
- **Seguridad de UI:** El botón de conversión está envuelto en el componente `<RequireRole>`, por lo que solo será visible para roles autorizados (`admin`, `recepcionista`).

### `src/services/budgets.ts`
Capa de datos para interactuar con Supabase.
- **`listBudgets`:** Obtiene la lista de presupuestos, permitiendo filtrar por estado.
- **`convertToSale`:** Llama a la función RPC `public.fn_convert_presupuesto_to_venta` en la base de datos. Esta es la función que contiene la lógica de negocio principal para la conversión, asegurando que solo los presupuestos válidos puedan ser procesados.

## 2. Cómo Probar el Flujo Completo

**Paso 1: Crear un Presupuesto de Prueba**
Ejecuta el siguiente script en el `SQL Editor` de tu proyecto de Supabase para crear los datos necesarios.

```sql
-- Asegúrate de tener un cliente y un producto de prueba
DECLARE
  test_client_id UUID := (SELECT id FROM public.clientes LIMIT 1);
  test_product_id UUID := (SELECT id FROM public.productos WHERE sku = 'SSD-KNG-240');
  new_presupuesto_id UUID;
BEGIN
  -- 1. Crear un presupuesto en estado 'borrador'
  INSERT INTO public.presupuestos (cliente_id, creada_por, diagnostico, estado)
  VALUES (test_client_id, auth.uid(), 'Diagnóstico para prueba de UI', 'borrador')
  RETURNING id INTO new_presupuesto_id;

  -- 2. Añadirle ítems
  INSERT INTO public.presupuesto_items (presupuesto_id, producto_id, cantidad, precio_unit, iva_pct)
  VALUES (new_presupuesto_id, test_product_id, 1, 200000, 19);

  RAISE NOTICE 'Presupuesto de prueba creado con ID: %', new_presupuesto_id;
END $$;
```

**Paso 2: Simular Aprobación del Presupuesto**
En la vida real, el cliente aprobaría el presupuesto. Para esta prueba, lo actualizaremos manualmente al estado `aprobado`.

```sql
-- Reemplaza '<ID_DEL_PRESUPUESTO_CREADO>' con el ID que te dio el script anterior
UPDATE public.presupuestos
SET estado = 'aprobado'
WHERE id = '<ID_DEL_PRESUPUESTO_CREADO>';
```

**Paso 3: Probar la Conversión en la Interfaz de Usuario**

1.  **Navega** a la página `/presupuestos` en la aplicación.
2.  **Filtra por "aprobado":** Usa el menú desplegable de filtros para seleccionar el estado "aprobado". Deberías ver el presupuesto que acabas de preparar.
3.  **Verifica el Botón:** El botón "Convertir a Venta" para esa fila debe estar habilitado (color verde).
4.  **Haz clic en "Convertir a Venta":**
    -   Aparecerá un cuadro de diálogo de confirmación. Haz clic en "Aceptar".
    -   Debería aparecer una notificación verde en la parte superior de la página con un mensaje como: `¡Éxito! Presupuesto convertido a la venta con ID: <UUID_DE_LA_NUEVA_VENTA>`.
5.  **Verifica el Cambio de Estado:** La tabla se recargará automáticamente. El presupuesto que convertiste ahora debería tener el estado `convertido`, y el botón "Convertir a Venta" estará deshabilitado.

**Paso 4: Verificar la Venta Creada en la Base de Datos**
Ejecuta esta consulta en el `SQL Editor` para confirmar que la venta se creó correctamente a partir del presupuesto.

```sql
-- Reemplaza '<NUMERO_DEL_PRESUPUESTO>' con el número del presupuesto que convertiste (ej. 'PRE-2024-00001')
SELECT
  v.numero AS venta_numero,
  v.total AS venta_total,
  p.numero AS presupuesto_origen,
  p.total AS presupuesto_total,
  vi.producto_id,
  vi.cantidad
FROM public.ventas v
JOIN public.presupuestos p ON v.presupuesto_id = p.id
JOIN public.venta_items vi ON vi.venta_id = v.id
WHERE p.numero = '<NUMERO_DEL_PRESUPUESTO>';

-- Resultado esperado:
-- Deberías ver una nueva fila en la tabla de ventas, con el total y los ítems
-- que coinciden con los del presupuesto original.
```

Si todas estas pruebas son exitosas, el flujo completo de conversión de presupuestos está funcionando correctamente.
