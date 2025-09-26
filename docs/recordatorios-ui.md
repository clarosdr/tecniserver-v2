# Sistema de Recordatorios - Documentación UI

## Descripción General

El sistema de recordatorios permite programar notificaciones para órdenes de trabajo, mantenimientos y otras tareas importantes. Incluye funcionalidades para crear, listar, completar y cancelar recordatorios.

## Archivos Implementados

### 1. `src/services/reminders.ts`
Servicio principal que maneja todas las operaciones de recordatorios:

**Funciones principales:**
- `createReminder(params)` - Crear nuevo recordatorio
- `listMyReminders(params)` - Listar recordatorios del usuario
- `completeReminder(id)` - Marcar recordatorio como completado
- `cancelReminder(id)` - Cancelar recordatorio
- `getReminder(id)` - Obtener recordatorio específico
- `updateReminder(id, params)` - Actualizar recordatorio
- `getUpcomingReminders()` - Obtener recordatorios próximos

### 2. `src/components/reminders/ReminderForm.tsx`
Componente de formulario para crear/editar recordatorios:

**Props:**
- `defaultValues` - Valores por defecto del formulario
- `onSaved` - Callback ejecutado al guardar exitosamente

**Campos del formulario:**
- Tipo de recordatorio (ot, mantenimiento, general)
- Entidad/Descripción
- Fecha y hora (con validación de fecha futura)
- Canal de notificación (email, sms, whatsapp)
- Nota opcional

### 3. `src/components/ot/WorkOrderDetail.tsx`
Integración del botón "Programar Recordatorio" en los detalles de OT:

**Funcionalidad:**
- Botón disponible para roles: admin, recepcionista, tecnico
- Modal con formulario pre-rellenado con datos de la OT
- Valores por defecto: tipo='ot', entidad con nombre del cliente

### 4. `src/pages/MaintenancesPage.tsx`
Página principal para gestión de recordatorios:

**Características:**
- Lista de recordatorios con filtros por estado
- Botones para completar/cancelar recordatorios pendientes
- Modal para crear nuevos recordatorios
- Indicadores visuales de estado (colores)

## Flujos de Prueba

### 1. Crear Recordatorio desde OT

```javascript
// 1. Abrir una orden de trabajo
// 2. Hacer clic en "Programar Recordatorio"
// 3. Completar formulario:
const testData = {
  tipo: 'ot', // Pre-rellenado
  entidad: 'OT #123 - Cliente Test', // Pre-rellenado
  entidad_id: 123, // Pre-rellenado
  fecha_hora: '2024-02-15T10:00', // Seleccionar fecha futura
  canal: 'email', // Pre-seleccionado
  nota: 'Revisar estado de reparación'
};
// 4. Hacer clic en "Programar"
// 5. Verificar mensaje de éxito
```

### 2. Crear Recordatorio desde MaintenancesPage

```javascript
// 1. Navegar a /maintenances
// 2. Hacer clic en "Programar Recordatorio"
// 3. Completar formulario:
const testData = {
  tipo: 'mantenimiento',
  entidad: 'Mantenimiento preventivo servidor',
  fecha_hora: '2024-02-20T14:00',
  canal: 'email',
  nota: 'Revisar logs y actualizar sistema'
};
// 4. Hacer clic en "Programar"
// 5. Verificar que aparece en la lista
```

### 3. Gestionar Recordatorios Existentes

```javascript
// 1. En MaintenancesPage, verificar lista de recordatorios
// 2. Usar filtros: Todos, Pendientes, Completados, Cancelados
// 3. Para recordatorios pendientes:
//    - Hacer clic en "Completar" para marcar como completado
//    - Hacer clic en "Cancelar" para cancelar
// 4. Verificar cambios de estado y colores
```

### 4. Validaciones del Formulario

```javascript
// Casos de prueba para validaciones:

// 1. Fecha en el pasado
const invalidDate = {
  fecha_hora: '2023-01-01T10:00' // Error: debe ser fecha futura
};

// 2. Campos requeridos vacíos
const incompleteData = {
  tipo: '', // Error: requerido
  entidad: '', // Error: requerido
  fecha_hora: '' // Error: requerido
};

// 3. Fecha válida (futura)
const validDate = {
  fecha_hora: new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,16)
};
```

## Base de Datos

### Tabla: `recordatorios`

```sql
CREATE TABLE recordatorios (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL, -- 'ot', 'mantenimiento', 'general'
  entidad TEXT NOT NULL, -- Descripción del recordatorio
  entidad_id INTEGER, -- ID de la entidad relacionada (opcional)
  fecha_hora TIMESTAMP NOT NULL,
  canal VARCHAR(20) NOT NULL, -- 'email', 'sms', 'whatsapp'
  nota TEXT,
  estado VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### RLS (Row Level Security)

```sql
-- Política para que usuarios solo vean sus propios recordatorios
CREATE POLICY "Users can view own reminders" ON recordatorios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON recordatorios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON recordatorios
  FOR UPDATE USING (auth.uid() = user_id);
```

## Edge Functions para Notificaciones

### Configuración Futura

Para implementar el envío automático de notificaciones, se recomienda crear Edge Functions que:

1. **Función de Verificación Periódica:**
```javascript
// supabase/functions/check-reminders/index.ts
export default async function checkReminders() {
  // 1. Consultar recordatorios pendientes próximos a ejecutarse
  // 2. Enviar notificaciones según el canal configurado
  // 3. Marcar como 'sent' o crear log de envío
}
```

2. **Configuración de Cron Job:**
```javascript
// Ejecutar cada 15 minutos
// 0,15,30,45 * * * *
```

3. **Servicios de Notificación:**
- **Email:** Integración con Resend, SendGrid o similar
- **SMS:** Integración con Twilio, AWS SNS
- **WhatsApp:** Integración con WhatsApp Business API

### Variables de Entorno Necesarias

```env
# Para notificaciones por email
RESEND_API_KEY=your_resend_key
FROM_EMAIL=noreply@yourdomain.com

# Para SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Para WhatsApp
WHATSAPP_API_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_ID=your_phone_id
```

## Notas de Implementación

### Estados de Recordatorio
- `pending` - Programado, esperando ejecución
- `completed` - Marcado como completado manualmente
- `cancelled` - Cancelado por el usuario
- `sent` - Notificación enviada (futuro)

### Permisos por Rol
- **Admin:** Acceso completo a todos los recordatorios
- **Recepcionista:** Puede crear y gestionar recordatorios de OT
- **Técnico:** Puede crear recordatorios y ver los asignados

### Mejoras Futuras
1. Recordatorios recurrentes
2. Plantillas de recordatorios
3. Asignación a otros usuarios
4. Dashboard de recordatorios próximos
5. Integración con calendario
6. Notificaciones push en la aplicación

## Testing

### Comandos de Prueba en Consola

```javascript
// En la consola del navegador, probar servicios:

// 1. Crear recordatorio
const reminder = await createReminder({
  tipo: 'test',
  entidad: 'Prueba de recordatorio',
  fecha_hora: new Date(Date.now() + 60000).toISOString(),
  canal: 'email',
  nota: 'Recordatorio de prueba'
});

// 2. Listar recordatorios
const reminders = await listMyReminders({});

// 3. Completar recordatorio
await completeReminder(reminder.id);

// 4. Verificar estado
const updated = await getReminder(reminder.id);
console.log(updated.estado); // 'completed'
```

### Casos de Prueba UI

1. **Navegación:** Verificar que MaintenancesPage es accesible
2. **Formularios:** Validar todos los campos y validaciones
3. **Estados:** Probar transiciones de estado (pending → completed/cancelled)
4. **Filtros:** Verificar funcionamiento de filtros por estado
5. **Modales:** Confirmar apertura/cierre correcto de modales
6. **Permisos:** Verificar restricciones por rol

## Troubleshooting

### Errores Comunes

1. **"RLS policy violation"**
   - Verificar que el usuario está autenticado
   - Confirmar políticas RLS en Supabase

2. **"Fecha debe ser futura"**
   - Verificar zona horaria del cliente
   - Usar fecha/hora local correcta

3. **"No se puede crear recordatorio"**
   - Verificar permisos del usuario
   - Confirmar estructura de la tabla

4. **Modal no se cierra**
   - Verificar eventos de click en overlay
   - Confirmar estado showReminderForm