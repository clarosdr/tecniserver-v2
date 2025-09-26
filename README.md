# TecniServer Pro

Sistema de gestión integral para empresas de servicios técnicos, desarrollado con React, TypeScript y Supabase.

## 🚀 Configuración Inicial

### Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn
- Cuenta de Supabase

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd tecniserver-v2
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   
   Copia el archivo `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Edita `.env.local` con tus valores:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   
   # Application Configuration
   VITE_APP_NAME=TecniServer Pro
   
   # Print Configuration
   VITE_PRINT_CSS=/prints/styles/print.css
   ```

## 🛠️ Variables de Entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase | ✅ |
| `VITE_APP_NAME` | Nombre de la aplicación | ✅ |
| `VITE_PRINT_CSS` | Ruta a los estilos de impresión | ✅ |

## 📦 Scripts Disponibles

### Desarrollo
```bash
npm run dev
```
Inicia el servidor de desarrollo en `http://localhost:3000`

### Construcción
```bash
npm run build
```
Construye la aplicación para producción en la carpeta `dist/`

### Vista Previa
```bash
npm run preview
```
Previsualiza la construcción de producción localmente

### Linting (Opcional)
```bash
npm run lint
```
Ejecuta el linter para verificar la calidad del código

## 🖨️ Sistema de Impresión

### Configuración

El sistema incluye un módulo de impresión avanzado ubicado en la carpeta `/prints/`:

- **Templates**: `/prints/templates/` - Plantillas HTML para diferentes documentos
- **Estilos**: `/prints/styles/print.css` - Estilos específicos para impresión
- **Samples**: `/prints/samples/` - Datos de ejemplo para testing
- **Tools**: `/prints/tools/` - Herramientas auxiliares

### Documentos Soportados

1. **Órdenes de Trabajo (OT)** - `ot.html`
2. **Facturas** - `factura.html`
3. **Presupuestos** - `presupuesto.html`

### Uso del Sistema de Impresión

```typescript
import { printDocument } from './src/services/print';

// Imprimir una orden de trabajo
await printDocument('ot', otData);

// Imprimir una factura
await printDocument('factura', facturaData);

// Imprimir un presupuesto
await printDocument('presupuesto', presupuestoData);
```

### Personalización de Estilos

Los estilos de impresión se pueden personalizar editando `/prints/styles/print.css`. El archivo incluye:

- Configuración de página y márgenes
- Estilos específicos para cada tipo de documento
- Media queries para impresión
- Configuración de saltos de página

## 🏗️ Estructura del Proyecto

```
tecniserver-v2/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/         # Páginas de la aplicación
│   ├── services/      # Servicios y API calls
│   └── routes.tsx     # Configuración de rutas
├── prints/            # Sistema de impresión
│   ├── templates/     # Plantillas HTML
│   ├── styles/        # Estilos CSS
│   ├── samples/       # Datos de ejemplo
│   └── tools/         # Herramientas auxiliares
├── docs/              # Documentación
└── supabase/          # Configuración de base de datos
```

## 🔧 Desarrollo

### Comandos Útiles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run preview` - Vista previa de producción

### Herramientas de Diagnóstico

- **Health Check**: Accede a `/dev/health` para verificar el estado de todos los servicios
- **Logs**: Revisa la consola del navegador para errores de desarrollo

## 📚 Documentación Completa

### 🗄️ Base de Datos y SQL

- **[Estructura SQL Completa](docs/estructura-sql-completa.md)** - Mapa completo de archivos SQL y orden de ejecución
- **[Datos de Demostración](docs/seed-demo.md)** - Guía para cargar y verificar datos de prueba

### 🔐 Sistema de Usuarios y Seguridad

- **[Usuarios y Roles](docs/seccion-02-usuarios-roles.md)** - Sistema base de autenticación
- **[Políticas RLS](docs/seccion-01-rls-politicas.md)** - Seguridad a nivel de fila
- **[Permisos Granulares](docs/seccion-01-permisos.md)** - Sistema de permisos detallados
- **[Pruebas RLS](docs/seccion-02-pruebas-rls.md)** - Verificación de seguridad

### 📋 Módulos de Negocio

- **[Clientes y Equipos](docs/seccion-03-clientes-equipos.md)** - Gestión de clientes y equipos
- **[Órdenes de Trabajo](docs/seccion-04-ot.md)** - Sistema de OT y diagnósticos
- **[Mantenimientos](docs/seccion-05-mantenimientos.md)** - Mantenimientos preventivos
- **[Inventario](docs/seccion-06-inventario.md)** - Control de stock y productos
- **[Punto de Venta](docs/seccion-07-pos.md)** - Facturación y ventas
- **[Presupuestos](docs/seccion-08-presupuestos-ot.md)** - Cotizaciones y aprobaciones

### 🌐 Servicios Digitales

- **[Portal del Cliente](docs/seccion-10-portal-cliente.md)** - Acceso web para clientes
- **[Marketplace](docs/seccion-11-marketplace.md)** - Tienda online de productos
- **[Fidelización](docs/seccion-12-fidelizacion.md)** - Sistema de puntos y cupones

### 🔧 Servicios Técnicos

- **[Sistema de Impresión](docs/seccion-09-impresion.md)** - Generación de documentos PDF
- **[Configuración IA](docs/seccion-13-ai-config.md)** - Integración con servicios de IA

### 📱 Interfaces de Usuario

- **[Uso de Clientes UI](docs/clients-ui-usage.md)** - Guía de interfaz de clientes
- **[Uso de OT UI](docs/ot-ui-usage.md)** - Interfaz de órdenes de trabajo
- **[Uso de POS UI](docs/pos-ui-usage.md)** - Interfaz de punto de venta
- **[Uso de Presupuestos UI](docs/budgets-ui-usage.md)** - Interfaz de presupuestos
- **[Portal UI](docs/portal-ui-usage.md)** - Interfaz del portal del cliente
- **[Marketplace UI](docs/marketplace-ui.md)** - Interfaz del marketplace

### 🖨️ Sistema de Impresión

- **[Módulo de Impresión](docs/printing-module.md)** - Documentación técnica
- **[Uso de Impresión OT](docs/print-ot-usage.md)** - Imprimir órdenes de trabajo
- **[Uso de Impresión Facturas](docs/print-factura-usage.md)** - Imprimir facturas
- **[Uso de Impresión Presupuestos](docs/print-presupuesto-usage.md)** - Imprimir presupuestos
- **[Servicio de Impresión](docs/print-service.md)** - API de impresión

### 🔧 Desarrollo y Mantenimiento

- **[Salud del Sistema](docs/dev-health.md)** - Diagnósticos y monitoreo
- **[Infraestructura UI](docs/infra-ui.md)** - Herramientas de infraestructura
- **[Roles UI](docs/roles-ui.md)** - Gestión de roles y permisos
- **[Recordatorios UI](docs/recordatorios-ui.md)** - Sistema de notificaciones
- **[TODO por Sección](docs/todo-ui-por-seccion.md)** - Tareas pendientes

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
