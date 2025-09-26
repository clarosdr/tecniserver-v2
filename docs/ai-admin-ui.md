# Sistema de Administración de AI - Documentación UI

Este documento describe la funcionalidad del sistema de administración de AI implementado en la aplicación, incluyendo las interfaces de usuario para gestionar proveedores, prompts, ejecuciones y métricas.

## 1. Descripción General

El sistema de administración de AI proporciona una interfaz completa para:
- Visualizar proveedores de AI y sus claves API
- Gestionar plantillas de prompts (CRUD sin DELETE)
- Monitorear ejecuciones de AI con filtros avanzados
- Analizar métricas diarias con gráficos y tablas

## 2. Archivos Implementados

### `src/services/ai.ts`
Servicio principal que maneja todas las operaciones relacionadas con AI:

**Interfaces:**
- `AIProvider`: Información de proveedores (OpenAI, Anthropic, etc.)
- `AIKey`: Claves API con estado y configuración
- `AIPrompt`: Plantillas de prompts con variables automáticas
- `AIRun`: Ejecuciones con métricas de rendimiento
- `AIMetric`: Métricas diarias agregadas

**Funciones principales:**
- `listProviders()`: Lista todos los proveedores disponibles
- `listKeysVisible()`: Lista claves API visibles para el usuario
- `listPrompts()`: Lista plantillas de prompts con filtros
- `createOrUpdatePrompt(input)`: Crea o actualiza prompts
- `listRuns({fecha?, empresa_id?, usuario_id?})`: Lista ejecuciones con filtros
- `listDailyMetrics({desde, hasta, empresa_id?})`: Obtiene métricas por período

### `src/pages/config/AIProvidersPage.tsx`
Página de solo lectura para visualizar proveedores y claves API:

**Características:**
- Vista en pestañas (Proveedores / Claves API)
- Filtros por estado y búsqueda
- Información detallada de configuración
- Indicadores de estado visual
- Estadísticas rápidas

### `src/pages/config/AIPromptsPage.tsx`
Página para gestión completa de plantillas de prompts:

**Características:**
- CRUD completo (sin DELETE por seguridad)
- Búsqueda por término y categoría
- Extracción automática de variables del template
- Editor de prompts con vista previa
- Activación/desactivación de prompts
- Modal de detalles con información completa

### `src/pages/config/AIRunsPage.tsx`
Página para monitoreo de ejecuciones de AI:

**Características:**
- Tabla paginada con filtros avanzados
- Filtros rápidos por fecha (hoy, ayer, semana, mes)
- Búsqueda en texto, prompt y proveedor
- Estadísticas en tiempo real (total, éxito, duración, costo)
- Modal de detalles con input/output completo
- Indicadores visuales de estado

### `src/pages/config/AIMetricsPage.tsx`
Página de análisis de métricas con visualizaciones:

**Características:**
- Vista dual: gráficos y tabla
- Filtros por período y empresa
- Períodos rápidos (7, 30, 90 días)
- Gráficos interactivos:
  - Barras: ejecuciones por día
  - Líneas: costos y tasa de éxito
  - Circular: distribución éxito/errores
- Estadísticas agregadas
- Exportación de datos

## 3. Rutas Implementadas

Las siguientes rutas han sido agregadas al sistema:

```
/config/ai/providers  → AIProvidersPage
/config/ai/prompts    → AIPromptsPage  
/config/ai/runs       → AIRunsPage
/config/ai/metrics    → AIMetricsPage
```

## 4. Flujos de Uso

### 4.1 Gestión de Proveedores
1. Navegar a `/config/ai/providers`
2. Ver lista de proveedores disponibles
3. Cambiar a pestaña "Claves API" para ver configuración
4. Filtrar por estado (activo/inactivo) o buscar por nombre

### 4.2 Gestión de Prompts
1. Navegar a `/config/ai/prompts`
2. **Crear nuevo prompt:**
   - Clic en "Nuevo Prompt"
   - Completar formulario (nombre, categoría, template)
   - Las variables se extraen automáticamente del template
   - Guardar
3. **Editar prompt existente:**
   - Clic en botón "Editar" de la fila
   - Modificar campos necesarios
   - Guardar cambios
4. **Ver detalles:**
   - Clic en botón "Ver" para modal de detalles
5. **Activar/Desactivar:**
   - Toggle en la columna "Estado"

### 4.3 Monitoreo de Ejecuciones
1. Navegar a `/config/ai/runs`
2. **Filtrar ejecuciones:**
   - Usar filtros rápidos de fecha
   - Filtrar por estado (exitoso, error, pendiente)
   - Buscar en texto libre
3. **Ver detalles de ejecución:**
   - Clic en botón "Ver" para modal completo
   - Revisar input, output, duración y costo
4. **Analizar estadísticas:**
   - Ver métricas en tiempo real en la parte superior

### 4.4 Análisis de Métricas
1. Navegar a `/config/ai/metrics`
2. **Configurar período:**
   - Usar filtros rápidos o fechas personalizadas
   - Filtrar por empresa si es necesario
3. **Analizar datos:**
   - Vista gráficos: tendencias visuales
   - Vista tabla: datos detallados por día
4. **Interpretar métricas:**
   - Estadísticas generales en tarjetas superiores
   - Gráficos de tendencias y distribución

## 5. Permisos y Seguridad

### 5.1 Control de Acceso
- **Proveedores/Claves:** Solo lectura para todos los usuarios autorizados
- **Prompts:** CRUD completo, sin DELETE por seguridad
- **Ejecuciones:** Solo lectura, filtrado por empresa si aplica
- **Métricas:** Solo lectura, agregación por empresa

### 5.2 Políticas RLS (Row Level Security)
Las siguientes tablas deben tener políticas RLS configuradas:

```sql
-- Tabla: ai_providers
-- Política: Lectura para usuarios con rol 'admin' o 'ai_manager'

-- Tabla: ai_keys  
-- Política: Lectura para usuarios autorizados, ocultando claves sensibles

-- Tabla: ai_prompts
-- Política: CRUD para usuarios autorizados, filtrado por empresa

-- Tabla: ai_runs
-- Política: Lectura filtrada por empresa del usuario

-- Tabla: ai_metrics_daily
-- Política: Lectura agregada filtrada por empresa
```

### 5.3 Validaciones de Frontend
- Formularios con validación en tiempo real
- Sanitización de inputs para prevenir XSS
- Límites de caracteres en campos de texto
- Validación de fechas y rangos numéricos

## 6. Esquema de Base de Datos

### Tablas Principales

```sql
-- Proveedores de AI
CREATE TABLE ai_providers (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  endpoint_base VARCHAR(255),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Claves API
CREATE TABLE ai_keys (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER REFERENCES ai_providers(id),
  nombre VARCHAR(100) NOT NULL,
  clave_hash VARCHAR(255), -- Hash de la clave real
  limite_mensual INTEGER,
  uso_actual INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  empresa_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Plantillas de Prompts
CREATE TABLE ai_prompts (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  template TEXT NOT NULL,
  variables TEXT[], -- Array de variables extraídas
  categoria VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  empresa_id INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ejecuciones de AI
CREATE TABLE ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id INTEGER REFERENCES ai_prompts(id),
  provider_id INTEGER REFERENCES ai_providers(id),
  input_text TEXT,
  output_text TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  duracion_ms INTEGER,
  costo DECIMAL(10,6),
  estado VARCHAR(20) DEFAULT 'pendiente',
  error_message TEXT,
  empresa_id INTEGER,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Métricas diarias agregadas
CREATE TABLE ai_metrics_daily (
  fecha DATE,
  empresa_id INTEGER,
  total_runs INTEGER DEFAULT 0,
  runs_exitosos INTEGER DEFAULT 0,
  runs_error INTEGER DEFAULT 0,
  total_tokens_input BIGINT DEFAULT 0,
  total_tokens_output BIGINT DEFAULT 0,
  total_costo DECIMAL(12,6) DEFAULT 0,
  promedio_duracion_ms INTEGER DEFAULT 0,
  PRIMARY KEY (fecha, empresa_id)
);
```

## 7. Consideraciones Técnicas

### 7.1 Rendimiento
- Paginación en todas las listas grandes
- Índices en campos de filtrado frecuente
- Agregación de métricas en tabla separada
- Lazy loading de componentes pesados

### 7.2 Escalabilidad
- Servicios modulares y reutilizables
- Componentes React optimizados
- Gestión eficiente del estado
- Cacheo de datos estáticos

### 7.3 Mantenibilidad
- Código TypeScript tipado
- Componentes reutilizables
- Separación clara de responsabilidades
- Documentación inline

## 8. Próximas Mejoras

### 8.1 Funcionalidades Pendientes
- [ ] Exportación de métricas a CSV/Excel
- [ ] Alertas automáticas por uso excesivo
- [ ] Dashboard ejecutivo con KPIs
- [ ] Integración con sistemas de monitoreo
- [ ] Versionado de prompts
- [ ] A/B testing de prompts

### 8.2 Optimizaciones
- [ ] Cacheo inteligente de consultas
- [ ] Compresión de datos históricos
- [ ] Índices adicionales por uso
- [ ] Archivado automático de runs antiguos

## 9. Solución de Problemas

### 9.1 Problemas Comunes
**Error: "No se pueden cargar los proveedores"**
- Verificar conexión a base de datos
- Revisar políticas RLS
- Comprobar permisos del usuario

**Métricas no actualizadas**
- Verificar job de agregación diaria
- Revisar logs de la función de métricas
- Comprobar zona horaria de la base de datos

**Prompts no se guardan**
- Validar formato del template
- Verificar límites de caracteres
- Revisar permisos de escritura

### 9.2 Logs y Debugging
- Usar herramientas de desarrollo del navegador
- Revisar logs de Supabase
- Monitorear métricas de rendimiento
- Activar modo debug en desarrollo

## 10. Contacto y Soporte

Para soporte técnico o consultas sobre el sistema de AI:
- Revisar esta documentación primero
- Consultar logs de la aplicación
- Contactar al equipo de desarrollo
- Crear issue en el repositorio del proyecto