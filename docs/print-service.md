# Servicio de Impresión

Este documento explica cómo funciona el servicio de impresión, dónde se encuentran las plantillas y cómo se puede invocar para generar documentos.

## Arquitectura

El servicio de impresión está diseñado para ser modular y fácil de extender. Se compone de tres partes principales:

1.  **Plantillas HTML**: Ubicadas en `prints/templates/`, son archivos HTML estándar que contienen marcadores de posición para los datos.
2.  **Motor de Fusión (Merge Engine)**: Un script en `prints/tools/merge.js` que combina las plantillas con los datos.
3.  **Servicio Principal (`print.ts`)**: El orquestador que carga las plantillas, las fusiona con los datos y prepara el documento para la impresión.

## Plantillas

Las plantillas son archivos HTML (`.html`) que se encuentran en el directorio `prints/templates/`. Actualmente, existen las siguientes plantillas:

-   `ot.html`: Para órdenes de trabajo.
-   `presupuesto.html`: Para presupuestos.
-   `factura.html`: Para facturas.

Los marcadores de posición en las plantillas siguen la sintaxis de doble llave, como `{{cliente.nombre}}`.

## Cómo Invocar el Servicio

Para imprimir un documento, se debe utilizar la función `printDocument` del módulo `src/services/print.ts`.

### `printDocument(nombre, data)`

Esta función asíncrona es el punto de entrada principal para la impresión. Realiza los siguientes pasos:

1.  **Carga la plantilla**: Llama a `loadTemplate` para obtener el HTML de la plantilla especificada.
2.  **Fusiona los datos**: Utiliza `mergeTemplate` para inyectar el objeto `data` en la plantilla.
3.  **Abre la vista de impresión**: Crea una nueva ventana del navegador con el HTML resultante y enlaza la hoja de estilos `print.css`.
4.  **Inicia la impresión**: Llama a `window.print()` en la nueva ventana.

### Ejemplo de Uso

```typescript
import { printDocument } from '../services/print';

async function handlePrintOT(otId) {
  // 1. Obtener los datos de la OT
  const otData = await getOtById(otId); // Suponiendo que existe esta función

  // 2. Llamar al servicio de impresión
  await printDocument('ot', otData);
}
```