-- =====================================================
-- TecniServer V3 - Limpieza de Datos Demo
-- =====================================================
-- Este archivo elimina todos los datos de demostración
-- insertados por 99_seed_demo.sql, manteniendo la
-- estructura de la base de datos intacta.
-- =====================================================

BEGIN;

-- =====================================================
-- ADVERTENCIA Y CONFIRMACIÓN
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '⚠️  ADVERTENCIA: Este script eliminará TODOS los datos demo';
    RAISE NOTICE '   - Empresa: TecniService Demo';
    RAISE NOTICE '   - Todos los clientes, equipos y OTs demo';
    RAISE NOTICE '   - Productos, stock y movimientos de inventario demo';
    RAISE NOTICE '   - Ventas, presupuestos y datos de POS demo';
    RAISE NOTICE '   - Productos de marketplace demo';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Iniciando limpieza de datos demo...';
END $$;

-- =====================================================
-- LIMPIEZA EN ORDEN INVERSO (RESPETANDO FK)
-- =====================================================

-- 1. Marketplace
DELETE FROM mk_products WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';

-- 2. Pagos y Ventas
DELETE FROM pagos WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM venta_items WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM ventas WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';

-- 3. Presupuestos
DELETE FROM presupuesto_firmas WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM presupuesto_items WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM presupuestos WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';

-- 4. POS - Cajas
DELETE FROM caja_aperturas WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM cajas WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';

-- 5. Inventario
DELETE FROM movimientos_inventario WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM stock WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM producto_lotes WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM productos WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM almacenes WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';

-- 6. Órdenes de Trabajo
DELETE FROM ot_historial WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM ot_adjuntos WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM ot_accesorios WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM ot WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';

-- 7. Equipos de Clientes
DELETE FROM equipos_cliente WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';

-- 8. Clientes
DELETE FROM clientes WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';

-- 9. Catálogos de Equipos
DELETE FROM catalogo_modelos WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM catalogo_marcas WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM catalogo_tipo_equipo WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';

-- 10. Portal (si existen datos)
DELETE FROM portal_tokens WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM portal_notification_prefs WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM cliente_users WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM empresa_users WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';

-- 11. Empresa Demo (ÚLTIMO)
DELETE FROM empresas WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- =====================================================
-- RESETEAR SECUENCIAS (OPCIONAL)
-- =====================================================
-- Resetear secuencias para que los próximos registros
-- empiecen desde números limpios

-- Resetear secuencia de OT
DO $$
BEGIN
    -- Solo resetear si no hay otras OTs
    IF NOT EXISTS (SELECT 1 FROM ot LIMIT 1) THEN
        ALTER SEQUENCE ot_codigo_seq RESTART WITH 1;
        RAISE NOTICE '🔄 Secuencia OT reseteada';
    END IF;
END $$;

-- Resetear secuencia de Presupuestos
DO $$
BEGIN
    -- Solo resetear si no hay otros presupuestos
    IF NOT EXISTS (SELECT 1 FROM presupuestos LIMIT 1) THEN
        ALTER SEQUENCE presupuesto_numero_seq RESTART WITH 1;
        RAISE NOTICE '🔄 Secuencia Presupuestos reseteada';
    END IF;
END $$;

-- Resetear secuencia de Marketplace
DO $$
BEGIN
    -- Solo resetear si no hay otras órdenes de marketplace
    IF NOT EXISTS (SELECT 1 FROM mk_orders LIMIT 1) THEN
        ALTER SEQUENCE mk_order_numero_seq RESTART WITH 1;
        RAISE NOTICE '🔄 Secuencia Marketplace reseteada';
    END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN DE LIMPIEZA
-- =====================================================
DO $$
DECLARE
    empresa_count INTEGER;
    cliente_count INTEGER;
    equipo_count INTEGER;
    ot_count INTEGER;
    producto_count INTEGER;
    venta_count INTEGER;
    presupuesto_count INTEGER;
    mk_product_count INTEGER;
BEGIN
    -- Contar registros restantes de la empresa demo
    SELECT COUNT(*) INTO empresa_count FROM empresas WHERE id = '550e8400-e29b-41d4-a716-446655440000';
    SELECT COUNT(*) INTO cliente_count FROM clientes WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
    SELECT COUNT(*) INTO equipo_count FROM equipos_cliente WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
    SELECT COUNT(*) INTO ot_count FROM ot WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
    SELECT COUNT(*) INTO producto_count FROM productos WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
    SELECT COUNT(*) INTO venta_count FROM ventas WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
    SELECT COUNT(*) INTO presupuesto_count FROM presupuestos WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';
    SELECT COUNT(*) INTO mk_product_count FROM mk_products WHERE empresa_id = '550e8400-e29b-41d4-a716-446655440000';

    -- Mostrar resultados
    RAISE NOTICE '';
    RAISE NOTICE '📊 VERIFICACIÓN DE LIMPIEZA:';
    RAISE NOTICE '   - Empresas demo restantes: %', empresa_count;
    RAISE NOTICE '   - Clientes demo restantes: %', cliente_count;
    RAISE NOTICE '   - Equipos demo restantes: %', equipo_count;
    RAISE NOTICE '   - OTs demo restantes: %', ot_count;
    RAISE NOTICE '   - Productos demo restantes: %', producto_count;
    RAISE NOTICE '   - Ventas demo restantes: %', venta_count;
    RAISE NOTICE '   - Presupuestos demo restantes: %', presupuesto_count;
    RAISE NOTICE '   - Productos Marketplace demo restantes: %', mk_product_count;
    
    -- Verificar limpieza completa
    IF empresa_count = 0 AND cliente_count = 0 AND equipo_count = 0 AND 
       ot_count = 0 AND producto_count = 0 AND venta_count = 0 AND 
       presupuesto_count = 0 AND mk_product_count = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ LIMPIEZA COMPLETADA EXITOSAMENTE';
        RAISE NOTICE '   Todos los datos demo han sido eliminados';
        RAISE NOTICE '   La base de datos está lista para datos reales';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  ADVERTENCIA: Algunos datos demo no fueron eliminados';
        RAISE NOTICE '   Revisar dependencias o restricciones FK';
    END IF;
END $$;

-- =====================================================
-- LIMPIEZA ADICIONAL (OPCIONAL)
-- =====================================================
-- Eliminar registros huérfanos que puedan haber quedado

-- Limpiar tokens de portal sin empresa
DELETE FROM portal_tokens WHERE empresa_id NOT IN (SELECT id FROM empresas);

-- Limpiar notificaciones sin empresa
DELETE FROM portal_notification_prefs WHERE empresa_id NOT IN (SELECT id FROM empresas);

-- Limpiar movimientos de inventario huérfanos
DELETE FROM movimientos_inventario WHERE empresa_id NOT IN (SELECT id FROM empresas);

-- Limpiar stock huérfano
DELETE FROM stock WHERE empresa_id NOT IN (SELECT id FROM empresas);

-- =====================================================
-- MENSAJE FINAL
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧹 LIMPIEZA DE DATOS DEMO FINALIZADA';
    RAISE NOTICE '';
    RAISE NOTICE '📝 PRÓXIMOS PASOS:';
    RAISE NOTICE '   1. Verificar que la aplicación funcione correctamente';
    RAISE NOTICE '   2. Crear datos reales de tu empresa';
    RAISE NOTICE '   3. Configurar usuarios y roles apropiados';
    RAISE NOTICE '   4. Personalizar configuraciones según necesidades';
    RAISE NOTICE '';
    RAISE NOTICE '💡 TIP: Puedes volver a ejecutar 99_seed_demo.sql';
    RAISE NOTICE '   si necesitas los datos demo nuevamente';
END $$;

COMMIT;