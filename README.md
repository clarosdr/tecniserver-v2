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

## 📚 Documentación Adicional

Consulta la carpeta `/docs/` para documentación específica de cada módulo:

- Configuración de IA
- Uso de módulos específicos
- Guías de implementación
- Ejemplos de uso

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
