# TecniServer V3 - Datos Demo

Este documento explica cómo cargar y verificar los datos de demostración en TecniServer V3.

## 📋 Requisitos Previos

Antes de ejecutar los datos demo, asegúrate de que:

1. ✅ Todos los archivos SQL del modelo estén aplicados (01-24)
2. ✅ Las políticas RLS estén configuradas correctamente
3. ✅ Tengas acceso de administrador en Supabase
4. ✅ La aplicación esté corriendo localmente

## 🚀 Cómo Ejecutar los Datos Demo

### Paso 1: Acceder al Editor SQL de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva consulta

### Paso 2: Ejecutar el Script de Datos Demo

1. Copia todo el contenido del archivo `supabase/sql/99_seed_demo.sql`
2. Pégalo en el editor SQL de Supabase
3. Haz clic en **Run** para ejecutar el script
4. Verifica que aparezca el mensaje de confirmación: "✅ Datos demo insertados correctamente"

### Paso 3: Verificar la Carga de Datos

Puedes verificar que los datos se cargaron correctamente ejecutando estas consultas:

```sql
-- Verificar empresa demo
SELECT nombre, ruc FROM empresas WHERE nombre = 'TecniService Demo';

-- Verificar clientes
SELECT COUNT(*) as total_clientes FROM clientes;

-- Verificar equipos
SELECT COUNT(*) as total_equipos FROM equipos_cliente;

-- Verificar OTs
SELECT codigo, estado FROM ot ORDER BY codigo;

-- Verificar productos
SELECT COUNT(*) as total_productos FROM productos;

-- Verificar stock
SELECT p.nombre, s.cantidad 
FROM productos p 
JOIN stock s ON p.id = s.producto_id;
```

## 🔍 Qué Verificar en Cada Página

### 1. Dashboard Principal
- **URL**: `http://localhost:3000/`
- **Verificar**:
  - Estadísticas generales muestran datos
  - Gráficos con información de OTs y ventas
  - Resumen de inventario

### 2. Clientes
- **URL**: `http://localhost:3000/clients`
- **Verificar**:
  - Lista de 3 clientes demo:
    - Juan Carlos Pérez García (DNI: 12345678)
    - María Elena Rodríguez López (DNI: 87654321)
    - Carlos Alberto Mendoza Silva (DNI: 11223344)
  - Cada cliente tiene equipos asociados
  - Funcionalidad de búsqueda y filtros

### 3. Equipos
- **Verificar en la sección de equipos**:
  - 3 equipos registrados:
    - HP Pavilion 15 (Juan Pérez)
    - Samsung Galaxy S23 (María Rodríguez)
    - iPad Air (Carlos Mendoza)
  - Números de serie normalizados correctamente
  - Relación marca-modelo-tipo correcta

### 4. Órdenes de Trabajo (OT)
- **URL**: `http://localhost:3000/work-orders`
- **Verificar**:
  - 2 OTs creadas:
    - **OT-2024-001**: Estado "diagnóstico" (Laptop HP)
    - **OT-2024-002**: Estado "en_proceso" (Samsung S23)
  - Información completa de cliente y equipo
  - Costos de diagnóstico y reparación
  - Historial de cambios

### 5. Inventario
- **URL**: `http://localhost:3000/inventory`
- **Verificar**:
  - 3 productos con stock:
    - Pantalla Samsung Galaxy S23 (15 unidades)
    - Fuente HP 65W (25 unidades)
    - Case iPad Air (50 unidades)
  - Almacén Principal configurado
  - Movimientos de inventario (entradas iniciales)
  - Lotes con fechas de vencimiento

### 6. Punto de Venta (POS)
- **URL**: `http://localhost:3000/pos`
- **Verificar**:
  - Caja Principal disponible
  - Apertura de caja activa con $200.00 inicial
  - Historial de ventas muestra 1 venta pagada
  - Productos disponibles para venta

### 7. Presupuestos
- **URL**: `http://localhost:3000/budgets`
- **Verificar**:
  - 1 presupuesto creado:
    - **PRES-2024-001**: Estado "aprobado"
    - Cliente: María Elena Rodríguez
    - Total: $212.40 (incluye IGV)
    - Firma digital del cliente
  - Vinculado a OT-2024-002

### 8. Portal de Clientes
- **URL**: `http://localhost:3000/portal`
- **Verificar**:
  - Configuración de acceso para clientes
  - Tokens de acceso generados
  - Preferencias de notificación

### 9. Marketplace
- **URL**: `http://localhost:3000/marketplace`
- **Verificar**:
  - 3 productos activos:
    - Pantalla Samsung S23 (destacado)
    - Cargador HP 65W
    - Funda iPad Air
  - Precios, stock y descripciones correctas
  - Imágenes placeholder configuradas
  - Categorías y tags asignados

## 🧪 Casos de Prueba Sugeridos

### Flujo Completo: OT → Presupuesto → Venta

1. **Revisar OT-2024-002** (Samsung S23)
2. **Ver presupuesto PRES-2024-001** asociado
3. **Simular conversión a venta** en POS
4. **Verificar descuento de inventario**

### Flujo de Inventario

1. **Crear movimiento de salida** para pantalla Samsung
2. **Verificar actualización de stock**
3. **Revisar Kardex** de movimientos

### Flujo de Marketplace

1. **Navegar productos** en marketplace
2. **Simular pedido** de cliente
3. **Verificar integración** con inventario

## 🔧 Solución de Problemas

### Error: "relation does not exist"
- **Causa**: Los modelos SQL no están aplicados
- **Solución**: Ejecutar archivos 01-24 en orden

### Error: "permission denied"
- **Causa**: Políticas RLS muy restrictivas
- **Solución**: Verificar que el usuario tenga rol de admin

### Datos no aparecen en la UI
- **Causa**: Filtros RLS o problemas de sesión
- **Solución**: 
  1. Verificar autenticación del usuario
  2. Revisar políticas RLS
  3. Comprobar conexión a Supabase

### Stock negativo o inconsistente
- **Causa**: Triggers de inventario no funcionando
- **Solución**: Re-ejecutar `10_inventario_modelo.sql`

## 🧹 Limpiar Datos Demo

Para eliminar todos los datos demo y empezar limpio:

```sql
-- Ejecutar el archivo de limpieza
-- Ver: supabase/sql/99_seed_cleanup.sql
```

## 📞 Datos de Contacto Demo

Para pruebas de notificaciones y comunicación:

- **Empresa**: TecniService Demo
- **Email**: demo@tecniservice.com
- **Teléfono**: +51 999 888 777

**Clientes Demo**:
- Juan Pérez: juan.perez@email.com / +51 987 654 321
- María Rodríguez: maria.rodriguez@email.com / +51 976 543 210
- Carlos Mendoza: carlos.mendoza@email.com / +51 965 432 109

---

## ✅ Checklist de Verificación

- [ ] Empresa demo creada
- [ ] 3 clientes con equipos vinculados
- [ ] 2 OTs en diferentes estados
- [ ] 3 productos con stock en inventario
- [ ] Caja abierta con monto inicial
- [ ] Presupuesto aprobado con firma
- [ ] Venta pagada completa
- [ ] 3 productos activos en marketplace
- [ ] Todas las páginas muestran datos correctamente
- [ ] Flujos de negocio funcionando

**¡Listo para demostrar TecniServer V3! 🚀**