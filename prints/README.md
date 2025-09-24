# Módulo de Impresión de Documentos

Este directorio contiene las plantillas HTML, estilos CSS y datos de ejemplo para la generación de documentos imprimibles como Órdenes de Trabajo, Presupuestos y Facturas.

## Cómo Usar

El sistema utiliza un enfoque de plantillas simple basado en placeholders. Las plantillas HTML contienen marcadores con doble llave (ej. `{{cliente_nombre}}`) que se reemplazan con los datos reales de un objeto JSON.

### Proceso de Fusión (Merge)

Para generar un documento, necesitas una función que lea el contenido de una plantilla HTML y reemplace todos los placeholders con los valores de un objeto JSON correspondiente.

**Ejemplo de función de reemplazo en JavaScript:**
```javascript
/**
 * Reemplaza los placeholders en una plantilla HTML con datos de un objeto.
 * También maneja bloques condicionales y bucles simples.
 * @param {string} template El contenido del archivo HTML.
 * @param {object} data El objeto JSON con los datos.
 * @returns {string} El HTML con los datos insertados.
 */
function mergeTemplate(template, data) {
  // Reemplazo de variables simples: {{variable}}
  let processedHtml = template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const keys = key.trim().split('.');
    let value = data;
    for (const k of keys) {
      if (value === null || value === undefined) return '';
      value = value[k];
    }
    return value !== null && value !== undefined ? value : '';
  });

  // Manejo de bucles simples: {{#each array}} ... {{/each}}
  processedHtml = processedHtml.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, block) => {
    const items = data[arrayName] || [];
    if (!Array.isArray(items)) return '';
    return items.map(item => {
        // Para cada item del array, creamos un scope de datos que incluye el item y los datos del padre
        const scopedData = { ...data, ...item };
        return mergeTemplate(block, scopedData);
    }).join('');
  });

  // Manejo de condicionales simples: {{#if variable}} ... {{/if}}
  processedHtml = processedHtml.replace(/\{\{#if ([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, block) => {
    const keys = variable.split('.');
    let value = data;
    keys.forEach(k => { value = value ? value[k] : undefined; });
    
    // Evalúa si el valor es "truthy" (no es false, 0, "", null, undefined) o si es un array con elementos.
    const isTruthy = Array.isArray(value) ? value.length > 0 : !!value;

    return isTruthy ? block : '';
  });

  return processedHtml;
}

// Uso:
// const htmlTemplate = await fetch('prints/templates/ot.html').then(res => res.text());
// const jsonData = await fetch('prints/samples/ot.sample.json').then(res => res.json());
// const finalHtml = mergeTemplate(htmlTemplate, jsonData);
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

---

## Notas Adicionales

### Accesibilidad y Lecturabilidad
-   Los estilos en `print.css` usan una pila de fuentes seguras (`-apple-system`, `Segoe UI`, `Roboto`, etc.) para asegurar una buena renderización en la mayoría de los sistemas operativos.
-   El contraste entre el texto y el fondo se ha mantenido alto para facilitar la lectura, incluso en impresiones de baja calidad.

### Márgenes y Sangrado
-   La directiva `@page` en el CSS define márgenes estándar de 1.5cm para impresión en A4. Esto proporciona un área segura para la mayoría de las impresoras.

### Impresión en Papel Térmico
-   Para impresoras de recibos (ej. 80mm de ancho), se ha incluido una sección `@page` comentada en `print.css`. Para usarla, descoméntala y ajusta el `size` y `margin` según las especificaciones de tu impresora. El diseño fluido del HTML se adaptará razonablemente bien, pero podría requerir ajustes finos en el CSS.
