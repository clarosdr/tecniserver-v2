import { mergeTemplate } from '../../prints/tools/merge.js';

type TemplateName = 'ot' | 'presupuesto' | 'factura';

async function loadTemplate(nombre: TemplateName): Promise<string> {
  const response = await fetch(`/prints/templates/${nombre}.html`);
  if (!response.ok) {
    throw new Error(`No se pudo cargar la plantilla: ${nombre}`);
  }
  return response.text();
}

async function printDocument(nombre: TemplateName, data: any): Promise<void> {
  try {
    const htmlTemplate = await loadTemplate(nombre);
    const finalHtml = mergeTemplate(htmlTemplate, data);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Impresión - ${nombre}</title>
            <link rel="stylesheet" href="/prints/styles/print.css">
          </head>
          <body>
            ${finalHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // Espera a que el contenido se cargue completamente antes de imprimir
      printWindow.onload = function() {
        printWindow.print();
        // Cierra la ventana después de imprimir o si el usuario cancela
        // setTimeout(() => printWindow.close(), 1000);
      };
    } else {
      alert('No se pudo abrir la ventana de impresión. Revisa la configuración de tu navegador.');
    }
  } catch (error) {
    console.error('Error al generar el documento para impresión:', error);
    alert('Ocurrió un error al preparar la impresión.');
  }
}

export { loadTemplate, mergeTemplate, printDocument };
