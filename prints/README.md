# Módulo de Impresión de Documentos

Este directorio contiene las plantillas HTML, estilos CSS y datos de ejemplo para la generación de documentos imprimibles como Órdenes de Trabajo, Presupuestos y Facturas.

## Cómo Usar

El sistema utiliza un enfoque de plantillas simple basado en placeholders. Las plantillas HTML contienen marcadores con doble llave (ej. `{{cliente_nombre}}`) que se reemplazan con los datos reales de un objeto JSON.

### Proceso de Fusión (Merge)

Para generar un documento, se utiliza la función `mergeTemplate` del archivo `tools/merge.js`. Esta función lee el contenido de una plantilla HTML y reemplaza todos los placeholders con los valores de un objeto JSON correspondiente.

**Ejemplo de uso en JavaScript:**
```javascript
/**
 * La función se encuentra en /prints/tools/merge.js
 * y es importada donde se necesite generar un documento.
 */
import { mergeTemplate } from './tools/merge.js';

async function generateDocument() {
  // 1. Cargar la plantilla y los datos
  const htmlTemplate = await fetch('prints/templates/ot.html').then(res => res.text());
  const jsonData = await fetch('prints/samples/ot.sample.json').then(res => res.json());
  
  // 2. Fusionar los datos con la plantilla
  const finalHtml = mergeTemplate(htmlTemplate, jsonData);

  // 3. Mostrar o imprimir el HTML final
  // Por ejemplo, abrirlo en una nueva ventana para imprimir:
  const printWindow = window.open('', '_blank');
  printWindow.document.write(finalHtml);
  printWindow.document.close();
  // printWindow.print(); // Opcional: invocar impresión automáticamente
}
```

### Renderizado a PDF

La forma más sencilla de generar un PDF es:
1.  Abrir el archivo HTML final (después del merge) en un navegador web (Chrome, Firefox, Edge).
2.  Usar la función de impresión del navegador (`Ctrl+P` o `Cmd+P`).
3.  En el diálogo de impresión, seleccionar "Guardar como PDF" como destino.
4.  Asegurarse de que las opciones de "Gráficos de fondo" estén activadas si se utilizan colores de fondo.

### Convención de Imágenes

-   **Logos:** Se recomienda usar una URL pública (`{{company_logo_url}}`).
-   **Firmas y Códigos QR:** Estos son datos dinámicos y deben ser proporcionados como **Data URIs** (Base64) en el JSON. Esto asegura que la imagen se incruste directamente en el HTML y no dependa de archivos externos.
    -   Ejemplo de Data URI: `data:image/png;base64,iVBORw0KGgo...`

---

## Lista de Placeholders por Plantilla

| Plantilla     | Placeholders de Datos                                                                                                                                                                                                                                                         |
| :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Generales** | `{{company_logo_url}}`, `{{company_name}}`, `{{company_nit}}`, `{{company_address}}`, `{{company_phone}}`, `{{condiciones_generales}}`                                                                                                                                           |
| **OT**        | `{{ot_code}}`, `{{estado}}`, `{{prioridad}}`, `{{canal}}`, `{{fecha_recepcion}}`, `{{turno_fecha}}`, `{{turno_pos}}`, `{{cliente_*}}`, `{{equipo_*}}`, `{{diagnostico_preliminar}}`, `{{observaciones}}`, `{{accesorios[]}}` (bucle), `{{historial[]}}` (bucle), `{{firma_*}}`, `{{qr_data_uri}}` |
| **Presupuesto** | `{{numero}}`, `{{fecha}}`, `{{vence_at}}`, `{{estado}}`, `{{cliente_*}}`, `{{diagnostico}}`, `{{observaciones}}`, `{{items[]}}` (bucle), `{{subtotal}}`, `{{impuestos}}`, `{{total}}`, `{{aprobada_*}}`, `{{firma_cliente_img}}`                                                 |
| **Factura**   | `{{numero}}`, `{{fecha}}`, `{{estado}}`, `{{es_pagada}}` (booleano para watermark), `{{cliente_*}}`, `{{ot_code}}`, `{{items[]}}` (bucle), `{{subtotal}}`, `{{impuestos}}`, `{{total}}`, `{{pagos[]}}` (bucle)                                                                  |
