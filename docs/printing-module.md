# [Sección 9] — Módulo de Impresión de Documentos

## 1. Resumen del Módulo

Este módulo centraliza la lógica para generar documentos imprimibles (Órdenes de Trabajo, Presupuestos, Facturas) a partir de plantillas HTML y datos dinámicos de la base de datos. El objetivo es desacoplar la generación de documentos de la lógica de negocio principal y proporcionar una experiencia de vista previa de impresión consistente en toda la aplicación.

**Componentes Clave:**
-   **`src/services/print.ts`**: Un servicio que orquesta todo el proceso de impresión.
-   **`src/components/common/PrintButton.tsx`**: Un componente de UI reutilizable que se puede colocar en cualquier lugar donde se necesite imprimir un documento.
-   **`/prints/templates/*.html`**: Plantillas HTML con placeholders (ej. `{{cliente_nombre}}`).
-   **`/prints/tools/merge.js`**: Una utilidad de templating que fusiona las plantillas con los datos.
-   **`fn_get_print_data` (Función RPC en Supabase)**: El endpoint del backend que recopila y formatea todos los datos necesarios para un documento específico.

---

## 2. Flujo del Proceso

El proceso de impresión sigue estos pasos:

1.  **Interacción del Usuario:** El usuario hace clic en un `<PrintButton>` en la interfaz (por ejemplo, en el detalle de una OT). El botón recibe el tipo de documento (`'ot'`) y su ID.
2.  **Llamadas en Paralelo:** El `PrintButton` invoca al servicio `print.ts`, que realiza dos llamadas asíncronas en paralelo:
    a. **`getPrintTemplate(documentType)`**: Lee el contenido del archivo de plantilla HTML correspondiente (ej. `/prints/templates/ot.html`) y sus estilos CSS, inyectando estos últimos en la plantilla para una correcta visualización.
    b. **`getPrintData(documentType, documentId)`**: Llama a la función RPC `fn_get_print_data` en Supabase, pasándole el tipo y el ID del documento.
3.  **Recopilación de Datos (Backend):** La función RPC `fn_get_print_data` ejecuta una consulta compleja en la base de datos para reunir toda la información necesaria para la plantilla. Esto incluye datos de la empresa, del cliente, los ítems, totales, historiales, etc. Devuelve un único objeto JSON.
4.  **Fusión (Frontend):** Una vez que tanto la plantilla como los datos han sido recibidos en el frontend, el servicio `print.ts` llama a `generatePrintHtml`. Esta función utiliza la utilidad `mergeTemplate` para reemplazar todos los placeholders en el HTML con los valores del JSON.
5.  **Vista Previa:** El servicio `print.ts` finalmente llama a `openPrintPreview`, que abre una nueva pestaña del navegador (`window.open`) y escribe el HTML final en ella. Esto presenta al usuario una vista previa del documento, desde donde puede usar la función de impresión nativa del navegador para imprimir en papel o guardar como PDF.

---

## 3. Contrato de la Función RPC `fn_get_print_data`

Esta es la pieza central del backend para este módulo.

-   **Nombre:** `public.fn_get_print_data`
-   **Parámetros:**
    -   `p_document_type TEXT`: El tipo de documento a generar. Valores esperados: `'ot'`, `'presupuesto'`, `'factura'`.
    -   `p_document_id TEXT`: El ID del documento principal (ej. el ID de la OT, del presupuesto o de la venta). En el caso de las OTs, que usan un ID numérico, se debe pasar como texto.
-   **Retorno:** `JSONB`. Un único objeto JSON que contiene todos los campos necesarios para rellenar la plantilla correspondiente. La estructura de este JSON debe coincidir exactamente con los placeholders definidos en los archivos de `/prints/templates/`.

**Ejemplo de Lógica Interna para `p_document_type = 'ot'`:**
```sql
CREATE OR REPLACE FUNCTION public.fn_get_print_data(p_document_type TEXT, p_document_id TEXT)
RETURNS JSONB AS $$
DECLARE
  result_data JSONB;
  ot_id_numeric INT;
  presupuesto_id_uuid UUID;
  venta_id_uuid UUID;
BEGIN
  -- Lógica para Orden de Trabajo
  IF p_document_type = 'ot' THEN
    ot_id_numeric := p_document_id::INT;
    SELECT jsonb_build_object(
      'company_name', 'TecniServer Pro S.A.S.', -- (Esto debería venir de una tabla de configuración)
      'company_nit', '900.123.456-7',
      -- ... otros datos de la empresa
      'ot_code', v.id, -- Asumiendo que v_ot_detalle tiene los campos necesarios
      'estado', v.status,
      'cliente_nombre', v.client_name,
      'diagnostico_preliminar', v.issue_description
      -- ... todos los demás campos de la plantilla ot.html
      -- ... es necesario crear vistas o joins complejos para obtener todos los datos
    )
    INTO result_data
    FROM public.work_orders v -- Usando la tabla base, idealmente una vista de detalle
    WHERE v.id = ot_id_numeric;

  -- Lógica para Presupuesto
  ELSIF p_document_type = 'presupuesto' THEN
    presupuesto_id_uuid := p_document_id::UUID;
    -- ... consulta para presupuestos ...
  
  -- Lógica para Factura
  ELSIF p_document_type = 'factura' THEN
    venta_id_uuid := p_document_id::UUID;
    -- ... consulta para facturas ...

  END IF;

  RETURN result_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Tareas Pendientes (TODOs)

-   [ ] **Implementar la función RPC `fn_get_print_data`** en Supabase, incluyendo la lógica completa para los tres tipos de documentos.
-   [ ] **Refinar `print.css`:** Mejorar el archivo de estilos para asegurar que los documentos se vean bien tanto en pantalla como en papel, utilizando directivas `@media print`.
-   [ ] **Datos de Configuración:** Mover los datos de la empresa (nombre, NIT, etc.) de estar quemados en la función RPC a una tabla de configuración `public.company_config` para que puedan ser gestionados desde la UI.
-   [ ] **Tipos de ID:** La aplicación actualmente tiene una inconsistencia donde las OTs usan IDs numéricos (`int`) mientras que el resto de las entidades usan `uuid`. La función RPC `fn_get_print_data` debe ser robusta para manejar ambos tipos, convirtiendo el `p_document_id` de texto al tipo correcto según el `p_document_type`.
