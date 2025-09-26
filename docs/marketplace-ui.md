# UI del Módulo de Marketplace

Este documento describe la implementación y uso de los componentes de la interfaz de usuario (UI) para el módulo de Marketplace.

## 1. Componentes Creados

### `src/pages/MarketplacePage.tsx`
Es la página principal que orquesta la visualización de productos. Sus responsabilidades son:
-   Gestionar el estado de los filtros de búsqueda.
-   Hacer peticiones al servicio `listProducts` de `src/services/mk.ts` para obtener los productos.
-   Implementar un debouncer para no sobrecargar la API con cada pulsación de tecla en el buscador.
-   Manejar la paginación.
-   Renderizar los componentes de filtros y la grilla de productos.

### `src/components/marketplace/ProductFilters.tsx`
Un componente reutilizable que encapsula todos los controles de filtro:
-   Un campo de texto para búsqueda libre (por nombre o SKU).
-   Dos campos numéricos para definir un rango de precios (mínimo y máximo).
-   Un menú desplegable para filtrar por empresa vendedora.
-   Emite un evento `onChange` cada vez que un filtro cambia, permitiendo a la página padre (`MarketplacePage`) reaccionar y volver a solicitar los datos.

### `src/components/marketplace/ProductCard.tsx`
Componente visual para mostrar la información de un único producto en la grilla. Muestra:
-   La primera imagen disponible del producto.
-   El nombre del producto.
-   El nombre de la empresa que lo vende.
-   El precio formateado.

### `src/services/mk.ts`
Este servicio actúa como la capa de comunicación con Supabase para todas las entidades del marketplace.
-   `listProducts`: Función clave que construye una consulta a la tabla `mk_products` aplicando dinámicamente los filtros de búsqueda, empresa y precio, además de la paginación.
-   `listCompanies`: Obtiene la lista de empresas para poblar el filtro correspondiente.
-   `getProduct`: Obtiene los detalles de un solo producto (para una futura vista de detalle).

## 2. Cómo Probar la Funcionalidad

Para probar la interfaz del marketplace, es necesario tener datos de ejemplo en la base de datos de Supabase.

**Paso 1: Crear Empresas y Productos de Prueba**
Ejecuta las siguientes inserciones en el `SQL Editor` de tu proyecto de Supabase para crear datos de ejemplo.

```sql
-- Asegúrate de que existan empresas
INSERT INTO public.empresas (id, nombre, nit, direccion)
VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'TecnoComponentes S.A.S', '900.111.222-1', 'Calle 1, Bogotá'),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'PC Gamers Colombia', '900.333.444-2', 'Carrera 2, Medellín')
ON CONFLICT (id) DO NOTHING;

-- Crear publicaciones de productos para esas empresas
INSERT INTO public.mk_products (empresa_id, sku, nombre, descripcion, precio, iva_pct, media)
VALUES
  ('a1b2c3d4-0001-0001-0001-000000000001', 'TEC-KB-001', 'Teclado Mecánico RGB', 'Teclado mecánico con switches rojos.', 180000, 19, '{"images": ["https://via.placeholder.com/400x300.png/0000FF/FFFFFF?text=Teclado"]}'),
  ('a1b2c3d4-0001-0001-0001-000000000001', 'TEC-MOUSE-002', 'Mouse Ergonómico Inalámbrico', 'Mouse vertical para mayor comodidad.', 95000, 19, '{"images": ["https://via.placeholder.com/400x300.png/FF0000/FFFFFF?text=Mouse"]}'),
  ('a1b2c3d4-0001-0001-0001-000000000002', 'PCG-GPU-3060', 'Tarjeta Gráfica RTX 3060', 'GPU para gaming de alta gama.', 1500000, 19, '{"images": ["https://via.placeholder.com/400x300.png/00FF00/FFFFFF?text=GPU"]}')
ON CONFLICT (sku) DO NOTHING;
```

**Paso 2: Probar los Filtros en la UI**
1.  Navega a la sección `/marketplace` de la aplicación.
2.  Deberías ver los 3 productos creados.
3.  **Filtro por texto:** Escribe "Teclado" en el campo de búsqueda. Debería mostrarse solo el "Teclado Mecánico RGB". Borra el texto.
4.  **Filtro por empresa:** Selecciona "PC Gamers Colombia" en el desplegable. Debería mostrarse solo la "Tarjeta Gráfica RTX 3060".
5.  **Filtro por precio:**
    -   En "Precio Mín.", escribe `100000`. Deberían aparecer el teclado y la tarjeta gráfica.
    -   En "Precio Máx.", escribe `200000`. Ahora solo debería aparecer el teclado.
6.  **Combinación de filtros:** Prueba combinar varios filtros a la vez para verificar que la lógica funciona correctamente.
7.  **Paginación:** Si creas más de 12 productos, verifica que los botones "Anterior" y "Siguiente" se habiliten y funcionen correctamente.
