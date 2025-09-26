# DevHealthPage - Monitoreo de Salud del Sistema

## Descripción

La página `DevHealthPage` (`/dev/health`) es una herramienta de diagnóstico que permite verificar el estado de salud de los servicios principales del sistema mediante la ejecución de pings a las funciones de listado de cada módulo.

## Servicios Monitoreados

La página ejecuta verificaciones en los siguientes servicios:

### 1. Órdenes de Trabajo (OT)
- **Función**: `listOT({limit: 1})`
- **Servicio**: `src/services/ot.ts`
- **Propósito**: Verifica que el módulo de órdenes de trabajo esté funcionando correctamente

### 2. Ventas (POS)
- **Función**: `listVentas({limit: 1})`
- **Servicio**: `src/services/pos.ts`
- **Propósito**: Verifica que el sistema de punto de venta esté operativo

### 3. Clientes
- **Función**: `listClients({limit: 1})`
- **Servicio**: `src/services/clients.ts`
- **Propósito**: Verifica que el módulo de gestión de clientes funcione correctamente

### 4. Productos (Marketplace)
- **Función**: `listProducts({limit: 1})`
- **Servicio**: `src/services/mk.ts`
- **Propósito**: Verifica que el marketplace y catálogo de productos esté disponible

### 5. Recordatorios
- **Función**: `listMyReminders({limit: 1})`
- **Servicio**: `src/services/reminders.ts`
- **Propósito**: Verifica que el sistema de recordatorios esté funcionando

### 6. Ejecuciones de IA
- **Función**: `listRuns({limit: 1})`
- **Servicio**: `src/services/ai.ts`
- **Propósito**: Verifica que el módulo de inteligencia artificial esté operativo

## Estados de Verificación

Cada servicio puede mostrar uno de los siguientes estados:

### ✅ OK (Verde)
- **Significado**: El servicio está funcionando correctamente
- **Indicador**: Badge verde con texto "OK"
- **Descripción**: La función de listado se ejecutó sin errores y devolvió datos

### ❌ FAIL (Rojo)
- **Significado**: El servicio presenta errores
- **Indicador**: Badge rojo con texto "FAIL"
- **Descripción**: La función de listado falló durante la ejecución
- **Información adicional**: Se muestra el mensaje de error específico

### 🔄 CHECKING (Azul)
- **Significado**: Verificación en progreso
- **Indicador**: Badge azul con texto "CHECKING"
- **Descripción**: La función está siendo ejecutada actualmente

## Interpretación de Resultados

### Todos los servicios en OK
- **Estado**: Sistema completamente operativo
- **Acción**: No se requiere intervención

### Algunos servicios en FAIL
- **Estado**: Problemas parciales en el sistema
- **Acción**: Revisar los mensajes de error específicos y verificar:
  - Conectividad a la base de datos
  - Configuración de servicios
  - Dependencias del módulo afectado

### Múltiples servicios en FAIL
- **Estado**: Problema sistémico grave
- **Acción**: Verificar:
  - Estado de la base de datos
  - Configuración general del sistema
  - Conectividad de red
  - Logs del servidor

## Funcionalidades

### Verificación Manual
- Botón "Verificar Todos" para ejecutar todas las verificaciones simultáneamente
- Actualización automática de estados en tiempo real

### Información de Tiempo
- Cada tarjeta muestra la hora de la última verificación
- Formato: "Última verificación: HH:MM:SS"

### Interfaz Visual
- Tarjetas organizadas en una cuadrícula responsiva
- Iconos representativos para cada servicio
- Colores distintivos para cada estado
- Mensajes de error detallados cuando aplique

## Uso Recomendado

1. **Monitoreo Regular**: Acceder periódicamente para verificar el estado general
2. **Diagnóstico de Problemas**: Usar cuando se reporten errores en módulos específicos
3. **Verificación Post-Despliegue**: Confirmar que todos los servicios funcionen después de actualizaciones
4. **Mantenimiento Preventivo**: Identificar problemas antes de que afecten a los usuarios

## Acceso

La página está disponible en la ruta `/dev/health` y forma parte del menú de herramientas de desarrollo del sistema.