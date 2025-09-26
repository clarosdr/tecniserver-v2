# Sección 09: Módulo de Impresión

## Descripción General

El módulo de impresión gestiona la generación y registro de documentos imprimibles en el sistema TecniServer V3. Proporciona un sistema centralizado para el manejo de trabajos de impresión de órdenes de trabajo, presupuestos y facturas, con trazabilidad completa y control de acceso basado en roles.

## Archivo SQL

- **Archivo**: `supabase/sql/16_print_jobs.sql`
- **Orden de ejecución**: 16 (después de los módulos principales)
- **Dependencias**: `01_usuarios_roles.sql`, `02_rls_politicas.sql`

## Componentes Principales

### 1. Tabla Principal

#### `print_jobs`
Registra cada trabajo de impresión generado en el sistema:

```sql
CREATE TABLE public.print_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('ot', 'presupuesto', 'factura')),
    ref_id UUID NOT NULL,               -- ID de la OT, Presupuesto o Venta
    template TEXT NOT NULL,             -- Template utilizado (ej: 'ot.html')
    payload JSONB NOT NULL,             -- Snapshot de datos para el render
    rendered_url TEXT NULL,             -- URL del PDF en Supabase Storage
    created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Campos:**
- `id`: Identificador único del trabajo de impresión
- `tipo`: Tipo de documento (`ot`, `presupuesto`, `factura`)
- `ref_id`: ID de referencia al documento original
- `template`: Nombre del template HTML utilizado
- `payload`: Snapshot completo de los datos en formato JSON
- `rendered_url`: URL del PDF generado (si se almacena)
- `created_by`: Usuario que generó el documento
- `created_at`: Timestamp de creación

### 2. Índices de Rendimiento

#### Índice por Tipo y Referencia
```sql
CREATE INDEX idx_print_jobs_tipo_ref_id ON public.print_jobs (tipo, ref_id);
```
- Optimiza búsquedas de trabajos por tipo de documento y ID de referencia
- Útil para encontrar todas las impresiones de una OT específica

#### Índice por Fecha de Creación
```sql
CREATE INDEX idx_print_jobs_created_at ON public.print_jobs (created_at DESC);
```
- Optimiza consultas ordenadas por fecha
- Facilita reportes de actividad de impresión

## Políticas de Seguridad (RLS)

### Política para Administradores
```sql
CREATE POLICY admin_full_access ON public.print_jobs
    FOR ALL
    USING (public.fn_has_role('admin'))
    WITH CHECK (public.fn_has_role('admin'));
```
- Acceso completo para administradores
- Pueden ver, crear, modificar y eliminar cualquier trabajo de impresión

### Política para Recepcionistas
```sql
CREATE POLICY recepcionista_empresa_access ON public.print_jobs
    FOR ALL
    USING (
        public.fn_has_role('recepcionista') AND
        public.fn_same_empresa_context(ref_id, tipo)
    );
```
- Acceso limitado a documentos de su empresa
- Pueden gestionar impresiones de su contexto empresarial

### Política para Técnicos
```sql
CREATE POLICY tecnico_assigned_access ON public.print_jobs
    FOR SELECT
    USING (
        public.fn_has_role('tecnico') AND
        public.fn_is_assigned_to_document(auth.uid(), ref_id, tipo)
    );
```
- Solo pueden ver impresiones de documentos asignados a ellos
- Principalmente para OTs donde son técnicos asignados

### Política para Clientes
```sql
CREATE POLICY cliente_own_access ON public.print_jobs
    FOR SELECT
    USING (
        public.fn_has_role('cliente') AND
        public.fn_owns_document(auth.uid(), ref_id, tipo)
    );
```
- Solo pueden ver impresiones de sus propios documentos
- Limitado a presupuestos y facturas de su propiedad

## Tipos de Documentos Soportados

### 1. Órdenes de Trabajo (`ot`)
- **Template**: `ot.html`, `ot-diagnostico.html`
- **Datos incluidos**: 
  - Información del cliente y equipo
  - Detalles del problema y diagnóstico
  - Historial de trabajos realizados
  - Técnico asignado y fechas

### 2. Presupuestos (`presupuesto`)
- **Template**: `presupuesto.html`, `presupuesto-detallado.html`
- **Datos incluidos**:
  - Información del cliente
  - Listado de items con precios
  - Totales y condiciones
  - Vigencia y términos

### 3. Facturas (`factura`)
- **Template**: `factura.html`, `ticket.html`
- **Datos incluidos**:
  - Datos de facturación
  - Items vendidos con precios
  - Impuestos y totales
  - Información de pago

## Funciones de Utilidad

### `fn_create_print_job()`
Función para crear un nuevo trabajo de impresión:

```sql
CREATE OR REPLACE FUNCTION public.fn_create_print_job(
    p_tipo TEXT,
    p_ref_id UUID,
    p_template TEXT,
    p_payload JSONB
) RETURNS UUID AS $$
DECLARE
    job_id UUID;
BEGIN
    INSERT INTO public.print_jobs (tipo, ref_id, template, payload, created_by)
    VALUES (p_tipo, p_ref_id, p_template, p_payload, auth.uid())
    RETURNING id INTO job_id;
    
    RETURN job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `fn_get_print_history()`
Obtiene el historial de impresiones de un documento:

```sql
CREATE OR REPLACE FUNCTION public.fn_get_print_history(
    p_tipo TEXT,
    p_ref_id UUID
) RETURNS TABLE(
    id UUID,
    template TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ,
    rendered_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT pj.id, pj.template, pj.created_by, pj.created_at, pj.rendered_url
    FROM public.print_jobs pj
    WHERE pj.tipo = p_tipo AND pj.ref_id = p_ref_id
    ORDER BY pj.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Integración con el Sistema

### 1. Generación de Documentos

#### Desde la Aplicación Web
```typescript
// Servicio de impresión
export const printService = {
  async generateDocument(tipo: string, refId: string, template: string) {
    // 1. Obtener datos del documento
    const data = await getDocumentData(tipo, refId);
    
    // 2. Crear trabajo de impresión
    const jobId = await supabase.rpc('fn_create_print_job', {
      p_tipo: tipo,
      p_ref_id: refId,
      p_template: template,
      p_payload: data
    });
    
    // 3. Generar PDF usando template
    const pdfUrl = await generatePDF(template, data);
    
    // 4. Actualizar trabajo con URL del PDF
    await supabase
      .from('print_jobs')
      .update({ rendered_url: pdfUrl })
      .eq('id', jobId);
      
    return { jobId, pdfUrl };
  }
};
```

#### Desde API Routes
```typescript
// API endpoint para impresión
export async function POST(request: Request) {
  const { tipo, refId, template } = await request.json();
  
  // Verificar permisos
  const canPrint = await checkPrintPermission(tipo, refId);
  if (!canPrint) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Generar documento
  const result = await printService.generateDocument(tipo, refId, template);
  
  return Response.json(result);
}
```

### 2. Templates de Impresión

#### Estructura de Templates
```html
<!-- templates/ot.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Orden de Trabajo #{{numero}}</title>
    <style>
        /* Estilos específicos para impresión */
        @media print { /* ... */ }
    </style>
</head>
<body>
    <header>
        <h1>Orden de Trabajo #{{numero}}</h1>
        <div class="empresa-info">{{empresa.nombre}}</div>
    </header>
    
    <section class="cliente-info">
        <h2>Cliente</h2>
        <p>{{cliente.nombre}} - {{cliente.telefono}}</p>
    </section>
    
    <section class="equipo-info">
        <h2>Equipo</h2>
        <p>{{equipo.tipo}} - {{equipo.marca}} {{equipo.modelo}}</p>
    </section>
    
    <!-- Más secciones... -->
</body>
</html>
```

### 3. Almacenamiento de PDFs

#### Configuración de Supabase Storage
```sql
-- Bucket para documentos generados
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('print-documents', 'print-documents', false);

-- Política de acceso a documentos
CREATE POLICY "Users can access their print documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'print-documents' AND
    public.fn_can_access_print_document(name)
  );
```

## Reportes y Auditoría

### 1. Reporte de Actividad de Impresión
```sql
-- Vista para reportes de impresión
CREATE VIEW v_print_activity AS
SELECT 
    pj.tipo,
    pj.template,
    pj.created_at,
    u.email as created_by_email,
    COUNT(*) OVER (PARTITION BY pj.tipo, DATE(pj.created_at)) as daily_count
FROM public.print_jobs pj
LEFT JOIN auth.users u ON u.id = pj.created_by
ORDER BY pj.created_at DESC;
```

### 2. Estadísticas de Uso
```sql
-- Función para estadísticas de impresión
CREATE OR REPLACE FUNCTION public.fn_print_stats(
    p_fecha_desde DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_fecha_hasta DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    tipo TEXT,
    template TEXT,
    total_impresiones BIGINT,
    usuarios_unicos BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pj.tipo,
        pj.template,
        COUNT(*) as total_impresiones,
        COUNT(DISTINCT pj.created_by) as usuarios_unicos
    FROM public.print_jobs pj
    WHERE DATE(pj.created_at) BETWEEN p_fecha_desde AND p_fecha_hasta
    GROUP BY pj.tipo, pj.template
    ORDER BY total_impresiones DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Características Técnicas

### Rendimiento
- Índices optimizados para consultas frecuentes
- Paginación en listados de trabajos de impresión
- Cache de templates compilados

### Seguridad
- RLS habilitado con políticas específicas por rol
- Validación de permisos antes de generar documentos
- Auditoría completa de actividad de impresión

### Escalabilidad
- Soporte para múltiples templates por tipo de documento
- Sistema extensible para nuevos tipos de documentos
- Integración con servicios externos de generación de PDFs

## Uso en la Aplicación

### Componente de Impresión
```typescript
// Componente React para impresión
export const PrintButton: React.FC<{
  tipo: string;
  refId: string;
  template?: string;
}> = ({ tipo, refId, template = 'default' }) => {
  const [printing, setPrinting] = useState(false);
  
  const handlePrint = async () => {
    setPrinting(true);
    try {
      const result = await printService.generateDocument(tipo, refId, template);
      // Abrir PDF en nueva ventana
      window.open(result.pdfUrl, '_blank');
    } catch (error) {
      console.error('Error al imprimir:', error);
    } finally {
      setPrinting(false);
    }
  };
  
  return (
    <Button onClick={handlePrint} disabled={printing}>
      {printing ? 'Generando...' : 'Imprimir'}
    </Button>
  );
};
```

## Orden de Ejecución

Este archivo debe ejecutarse **después** de:
1. `01_usuarios_roles.sql` - Sistema de usuarios y roles
2. `02_rls_politicas.sql` - Políticas RLS base
3. Módulos principales (OT, Presupuestos, POS) - Para referencias FK

Y **antes** de:
- Archivos de configuración específica de impresión
- Seeds de datos de prueba