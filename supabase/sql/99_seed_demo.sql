-- =====================================================
-- TecniServer V3 - Demo Seed Data
-- =====================================================
-- Este archivo contiene datos de demostración para todos los módulos
-- del sistema TecniServer V3. Ejecutar después de aplicar todos los
-- modelos y RLS.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. EMPRESA DEMO
-- =====================================================
INSERT INTO empresas (id, nombre, ruc, direccion, telefono, email, logo_url, activo) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'TecniService Demo', '20123456789', 'Av. Tecnología 123, Lima', '+51 999 888 777', 'demo@tecniservice.com', 'https://via.placeholder.com/200x100?text=TecniService', true);

-- =====================================================
-- 2. CLIENTES DEMO
-- =====================================================
INSERT INTO clientes (id, empresa_id, nombre, apellido, email, telefono, direccion, tipo_documento, numero_documento, activo) VALUES
('c1000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'Juan Carlos', 'Pérez García', 'juan.perez@email.com', '+51 987 654 321', 'Jr. Los Olivos 456, San Isidro', 'DNI', '12345678', true),
('c1000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'María Elena', 'Rodríguez López', 'maria.rodriguez@email.com', '+51 976 543 210', 'Av. Arequipa 789, Miraflores', 'DNI', '87654321', true),
('c1000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'Carlos Alberto', 'Mendoza Silva', 'carlos.mendoza@email.com', '+51 965 432 109', 'Calle Las Flores 321, Surco', 'DNI', '11223344', true);

-- =====================================================
-- 3. CATÁLOGOS DE EQUIPOS
-- =====================================================
INSERT INTO catalogo_tipo_equipo (id, empresa_id, nombre, descripcion, activo) VALUES
('te000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'Laptop', 'Computadoras portátiles', true),
('te000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'Smartphone', 'Teléfonos inteligentes', true),
('te000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'Tablet', 'Tabletas electrónicas', true);

INSERT INTO catalogo_marcas (id, empresa_id, nombre, activo) VALUES
('ma000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'HP', true),
('ma000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'Samsung', true),
('ma000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'Apple', true);

INSERT INTO catalogo_modelos (id, empresa_id, marca_id, tipo_equipo_id, nombre, activo) VALUES
('mo000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'ma000000-0000-0000-0000-000000000001', 'te000000-0000-0000-0000-000000000001', 'Pavilion 15', true),
('mo000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'ma000000-0000-0000-0000-000000000002', 'te000000-0000-0000-0000-000000000002', 'Galaxy S23', true),
('mo000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'ma000000-0000-0000-0000-000000000003', 'te000000-0000-0000-0000-000000000003', 'iPad Air', true);

-- =====================================================
-- 4. EQUIPOS DE CLIENTES
-- =====================================================
INSERT INTO equipos_cliente (id, empresa_id, cliente_id, tipo_equipo_id, marca_id, modelo_id, numero_serie, numero_serie_normalizado, observaciones, activo) VALUES
('eq000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'c1000000-0000-0000-0000-000000000001', 'te000000-0000-0000-0000-000000000001', 'ma000000-0000-0000-0000-000000000001', 'mo000000-0000-0000-0000-000000000001', 'HP-LAP-2023-001', 'HPLAP2023001', 'Laptop HP Pavilion 15 del cliente Juan Pérez', true),
('eq000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'c1000000-0000-0000-0000-000000000002', 'te000000-0000-0000-0000-000000000002', 'ma000000-0000-0000-0000-000000000002', 'mo000000-0000-0000-0000-000000000002', 'SAM-S23-2023-456', 'SAMS232023456', 'Samsung Galaxy S23 de María Rodríguez', true),
('eq000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'c1000000-0000-0000-0000-000000000003', 'te000000-0000-0000-0000-000000000003', 'ma000000-0000-0000-0000-000000000003', 'mo000000-0000-0000-0000-000000000003', 'APL-IPAD-2023-789', 'APLIPAD2023789', 'iPad Air de Carlos Mendoza', true);

-- =====================================================
-- 5. ÓRDENES DE TRABAJO (OT)
-- =====================================================
INSERT INTO ot (id, empresa_id, cliente_id, equipo_id, codigo, descripcion_problema, diagnostico, solucion, estado, prioridad, fecha_ingreso, fecha_estimada, tecnico_asignado_id, costo_diagnostico, costo_reparacion, observaciones) VALUES
('ot000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'c1000000-0000-0000-0000-000000000001', 'eq000000-0000-0000-0000-000000000001', 'OT-2024-001', 'Laptop no enciende, pantalla negra', 'Fuente de poder defectuosa', NULL, 'diagnostico', 'alta', NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days', NULL, 50.00, NULL, 'Cliente reporta que dejó de funcionar después de una tormenta eléctrica'),
('ot000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'c1000000-0000-0000-0000-000000000002', 'eq000000-0000-0000-0000-000000000002', 'OT-2024-002', 'Pantalla rota, táctil no responde', 'Pantalla LCD dañada, requiere reemplazo', 'Cambio de pantalla LCD completa', 'en_proceso', 'media', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days', NULL, 30.00, 180.00, 'Pantalla con múltiples grietas, táctil completamente inoperativo');

-- =====================================================
-- 6. ALMACENES E INVENTARIO
-- =====================================================
INSERT INTO almacenes (id, empresa_id, nombre, descripcion, direccion, activo) VALUES
('al000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'Almacén Principal', 'Almacén principal de repuestos y accesorios', 'Av. Tecnología 123, Lima - Almacén', true);

INSERT INTO productos (id, empresa_id, codigo, nombre, descripcion, categoria, precio_compra, precio_venta, stock_minimo, unidad_medida, activo) VALUES
('pr000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'PANT-SAM-S23', 'Pantalla Samsung Galaxy S23', 'Pantalla LCD completa para Samsung Galaxy S23', 'Pantallas', 120.00, 180.00, 5, 'unidad', true),
('pr000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'FUENTE-HP-65W', 'Fuente HP 65W', 'Cargador original HP 65W para laptops Pavilion', 'Cargadores', 35.00, 55.00, 10, 'unidad', true),
('pr000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'CASE-IPAD-AIR', 'Case iPad Air', 'Funda protectora para iPad Air con soporte', 'Accesorios', 15.00, 25.00, 20, 'unidad', true);

-- Crear lotes para los productos
INSERT INTO producto_lotes (id, empresa_id, producto_id, lote, fecha_vencimiento, activo) VALUES
('pl000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'pr000000-0000-0000-0000-000000000001', 'LOTE-2024-001', NOW() + INTERVAL '2 years', true),
('pl000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'pr000000-0000-0000-0000-000000000002', 'LOTE-2024-002', NOW() + INTERVAL '3 years', true),
('pl000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'pr000000-0000-0000-0000-000000000003', 'LOTE-2024-003', NOW() + INTERVAL '1 year', true);

-- Stock inicial
INSERT INTO stock (empresa_id, almacen_id, producto_id, lote_id, cantidad) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'al000000-0000-0000-0000-000000000001', 'pr000000-0000-0000-0000-000000000001', 'pl000000-0000-0000-0000-000000000001', 15),
('550e8400-e29b-41d4-a716-446655440000', 'al000000-0000-0000-0000-000000000001', 'pr000000-0000-0000-0000-000000000002', 'pl000000-0000-0000-0000-000000000002', 25),
('550e8400-e29b-41d4-a716-446655440000', 'al000000-0000-0000-0000-000000000001', 'pr000000-0000-0000-0000-000000000003', 'pl000000-0000-0000-0000-000000000003', 50);

-- Movimientos de inventario (entrada inicial)
INSERT INTO movimientos_inventario (id, empresa_id, almacen_id, producto_id, lote_id, tipo_movimiento, cantidad, precio_unitario, referencia, observaciones) VALUES
('mi000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'al000000-0000-0000-0000-000000000001', 'pr000000-0000-0000-0000-000000000001', 'pl000000-0000-0000-0000-000000000001', 'entrada', 15, 120.00, 'COMPRA-001', 'Stock inicial - Pantallas Samsung S23'),
('mi000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'al000000-0000-0000-0000-000000000001', 'pr000000-0000-0000-0000-000000000002', 'pl000000-0000-0000-0000-000000000002', 'entrada', 25, 35.00, 'COMPRA-002', 'Stock inicial - Fuentes HP 65W'),
('mi000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'al000000-0000-0000-0000-000000000001', 'pr000000-0000-0000-0000-000000000003', 'pl000000-0000-0000-0000-000000000003', 'entrada', 50, 15.00, 'COMPRA-003', 'Stock inicial - Cases iPad Air');

-- =====================================================
-- 7. PUNTO DE VENTA (POS)
-- =====================================================
INSERT INTO cajas (id, empresa_id, nombre, descripcion, activo) VALUES
('ca000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'Caja Principal', 'Caja registradora principal del local', true);

-- Apertura de caja demo
INSERT INTO caja_aperturas (id, empresa_id, caja_id, usuario_id, fecha_apertura, monto_inicial, estado) VALUES
('ap000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'ca000000-0000-0000-0000-000000000001', (SELECT id FROM auth.users LIMIT 1), NOW() - INTERVAL '8 hours', 200.00, 'abierta');

-- =====================================================
-- 8. PRESUPUESTOS
-- =====================================================
INSERT INTO presupuestos (id, empresa_id, cliente_id, ot_id, numero, descripcion, subtotal, igv, total, estado, fecha_vencimiento, observaciones) VALUES
('pr000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'c1000000-0000-0000-0000-000000000002', 'ot000000-0000-0000-0000-000000000002', 'PRES-2024-001', 'Reparación pantalla Samsung Galaxy S23', 180.00, 32.40, 212.40, 'aprobado', NOW() + INTERVAL '15 days', 'Presupuesto aprobado por el cliente vía WhatsApp');

INSERT INTO presupuesto_items (id, empresa_id, presupuesto_id, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
('pi000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'pr000000-0000-0000-0000-000000000001', 'pr000000-0000-0000-0000-000000000001', 'Pantalla Samsung Galaxy S23 - Instalación incluida', 1, 180.00, 180.00);

-- Firma de aprobación
INSERT INTO presupuesto_firmas (id, empresa_id, presupuesto_id, tipo_firma, firmante_nombre, firmante_documento, fecha_firma) VALUES
('pf000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'pr000000-0000-0000-0000-000000000001', 'cliente', 'María Elena Rodríguez López', '87654321', NOW() - INTERVAL '1 hour');

-- =====================================================
-- 9. VENTAS (POS)
-- =====================================================
INSERT INTO ventas (id, empresa_id, caja_apertura_id, cliente_id, numero_factura, subtotal, igv, total, estado, observaciones) VALUES
('ve000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'ap000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'F001-00000001', 25.00, 4.50, 29.50, 'pagada', 'Venta de case para iPad Air');

INSERT INTO venta_items (id, empresa_id, venta_id, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
('vi000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 've000000-0000-0000-0000-000000000001', 'pr000000-0000-0000-0000-000000000003', 'Case iPad Air - Funda protectora', 1, 25.00, 25.00);

INSERT INTO pagos (id, empresa_id, venta_id, metodo_pago, monto, referencia, observaciones) VALUES
('pa000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 've000000-0000-0000-0000-000000000001', 'efectivo', 29.50, NULL, 'Pago en efectivo');

-- =====================================================
-- 10. MARKETPLACE
-- =====================================================
INSERT INTO mk_products (id, empresa_id, producto_id, titulo, descripcion, precio, stock_disponible, categoria, tags, imagenes, estado, destacado) VALUES
('mk000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'pr000000-0000-0000-0000-000000000001', 'Pantalla Samsung Galaxy S23 Original', 'Pantalla LCD completa original para Samsung Galaxy S23. Instalación profesional incluida. Garantía de 6 meses.', 180.00, 14, 'Pantallas', '["samsung", "galaxy", "s23", "pantalla", "lcd", "original"]', '["https://via.placeholder.com/400x300?text=Pantalla+S23"]', 'activo', true),
('mk000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'pr000000-0000-0000-0000-000000000002', 'Cargador HP 65W Original', 'Cargador original HP 65W compatible con laptops Pavilion. Cable de 1.8m incluido.', 55.00, 25, 'Cargadores', '["hp", "cargador", "65w", "pavilion", "original"]', '["https://via.placeholder.com/400x300?text=Cargador+HP"]', 'activo', false),
('mk000000-0000-0000-0000-000000000003', '550e8400-e29b-41d4-a716-446655440000', 'pr000000-0000-0000-0000-000000000003', 'Funda iPad Air con Soporte', 'Funda protectora premium para iPad Air con soporte ajustable. Múltiples colores disponibles.', 25.00, 49, 'Accesorios', '["ipad", "air", "funda", "case", "soporte", "protector"]', '["https://via.placeholder.com/400x300?text=Case+iPad"]', 'activo', false);

-- =====================================================
-- CONFIRMACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Datos demo insertados correctamente:';
    RAISE NOTICE '   - 1 Empresa: TecniService Demo';
    RAISE NOTICE '   - 3 Clientes con equipos vinculados';
    RAISE NOTICE '   - 2 Órdenes de Trabajo (diagnóstico y en proceso)';
    RAISE NOTICE '   - 3 Productos en inventario con stock';
    RAISE NOTICE '   - 1 Apertura de caja activa';
    RAISE NOTICE '   - 1 Presupuesto aprobado';
    RAISE NOTICE '   - 1 Venta pagada completa';
    RAISE NOTICE '   - 3 Productos activos en Marketplace';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 El sistema está listo para pruebas!';
END $$;

COMMIT;