# Impresión de Facturas - Guía de Uso

## Descripción
Esta guía explica cómo imprimir facturas desde el sistema POS después de completar una venta.

## Pasos para Imprimir una Factura

### 1. Abrir Caja
- Navegar al módulo POS
- Si no hay una caja abierta, hacer clic en "Abrir Caja"
- Ingresar el monto inicial de apertura
- Confirmar la apertura

### 2. Crear Venta
- Seleccionar un cliente usando el buscador de clientes
- Agregar productos o servicios al carrito usando el buscador
- Ajustar cantidades si es necesario
- Verificar el total de la venta

### 3. Procesar Pago
- En la sección de pagos, agregar los métodos de pago utilizados
- Asegurarse de que el total pagado cubra el monto de la venta
- Hacer clic en "Finalizar Venta"

### 4. Imprimir Factura
- Después de completar la venta exitosamente, aparecerá el botón "Imprimir Factura"
- Hacer clic en "Imprimir Factura"
- Se abrirá una nueva ventana con la factura formateada
- Usar Ctrl+P o el menú del navegador para imprimir

## Datos Incluidos en la Factura
La factura incluye:
- Número de venta
- Información del cliente
- Detalle de productos/servicios vendidos
- Métodos de pago utilizados
- Total de la venta
- Fecha y hora de la transacción

## Notas Importantes
- El botón de impresión solo aparece después de completar una venta exitosamente
- Los datos de la factura se almacenan temporalmente hasta que se realice una nueva venta
- La factura utiliza la plantilla HTML definida en `prints/templates/factura.html`
- Asegúrese de tener una impresora configurada antes de intentar imprimir

## Solución de Problemas
- Si el botón no aparece, verifique que la venta se haya completado correctamente
- Si la impresión falla, verifique la configuración de la impresora
- Para problemas con la plantilla, contacte al administrador del sistema