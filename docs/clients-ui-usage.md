
# Guía de Uso y Pruebas de la UI de Clientes y Equipos

Este documento describe la funcionalidad de la nueva interfaz para gestionar clientes y sus equipos, y cómo probarla.

## 1. Funcionalidad Implementada

### `src/pages/ClientsPage.tsx`
Es la página principal que orquesta toda la funcionalidad.
- **Layout de 2 Columnas:**
  - **Izquierda:** Contiene el buscador de clientes y el botón para crear uno nuevo. Al hacer clic en "Nuevo Cliente", el buscador es reemplazado por el formulario de creación.
  - **Derecha:** Muestra los equipos del cliente seleccionado. Permite agregar un nuevo equipo, lo que reemplaza la lista por el formulario de creación de equipos.

### `src/components/clients/ClientSearch.tsx`
- **Búsqueda Dinámica:** Permite buscar clientes por nombre o documento. La búsqueda se activa con un pequeño retardo (debounce) para no sobrecargar el sistema.
- **Paginación:** Si hay muchos resultados, se puede navegar entre páginas.
- **Selección:** Al hacer clic en un cliente, se notifica a la página principal para que cargue sus datos y equipos.

### `src/components/clients/ClientForm.tsx`
- **Formulario Unificado:** Sirve tanto para crear nuevos clientes como para editar existentes.
- **Validación Simple:** Requiere que el nombre y el documento estén presentes.

### `src/components/equipos/EquipoForm.tsx`
- **Catálogos Dependientes:** La selección de una "Marca" filtra automáticamente la lista de "Modelos" disponibles, simplificando la entrada de datos.
- **Normalización de Serial:** El número de serie se convierte automáticamente a mayúsculas y se le quitan los espacios para mantener la consistencia en la base de datos.

### `src/services/clients.ts`
- **Capa de Datos:** Centraliza toda la comunicación con Supabase para las entidades `clientes`, `equipos` y los catálogos.

## 2. Cómo Probar el Flujo Completo

**Paso 1: Crear un Nuevo Cliente**
1.  Navega a la página `/clientes`.
2.  Haz clic en el botón **"Nuevo Cliente"** en la columna izquierda.
3.  El formulario de cliente aparecerá. Rellena los campos:
    -   Nombre: `Cliente de Prueba UI`
    -   Documento: `123456789`
    -   Email y teléfono son opcionales.
4.  Haz clic en **"Guardar"**.
5.  Deberías ver una alerta de "Cliente guardado con éxito".
6.  La vista volverá al buscador, el nuevo cliente debería estar seleccionado y su nombre debería aparecer en el título de la columna derecha. La lista de equipos debería mostrar "Este cliente no tiene equipos registrados."

**Paso 2: Agregar un Equipo al Nuevo Cliente**
1.  Con el "Cliente de Prueba UI" seleccionado, el botón **"Agregar Equipo"** en la columna derecha estará habilitado. Haz clic en él.
2.  Aparecerá el formulario de equipos.
3.  **Prueba los catálogos:**
    -   Selecciona un "Tipo" (ej. `laptop`).
    -   Selecciona una "Marca" (ej. `hp`).
    -   El campo "Modelo" ahora debería mostrar solo modelos de `hp`. Selecciónalo (ej. `pavilion`).
4.  Rellena el resto de los campos:
    -   Número de Serie: `ui test serial 001` (se convertirá a `UITESTSERIAL001`).
    -   Notas: `Equipo en buen estado, leves rayones en la tapa.`
5.  Haz clic en **"Guardar Equipo"**.
6.  Deberías ver una alerta de "Equipo guardado con éxito".
7.  La vista volverá a la lista de equipos, y el nuevo equipo (`Laptop HP Pavilion (S/N: UITESTSERIAL001)`) debería aparecer en la lista.

**Paso 3: Verificar la Seguridad (RLS)**
-   La UI no implementa lógica de roles en los botones (más allá de `<RequireRole>` que se podría añadir), asume que el usuario tiene permisos. Sin embargo, la seguridad real está en la base de datos.
-   Si iniciaras sesión como un usuario con rol `tecnico`, podrías ver la lista de clientes (política de `SELECT` permisiva), pero al intentar usar los formularios para crear un cliente o equipo, la llamada a la API de Supabase fallaría con un error de permisos, ya que las políticas de `INSERT` en `clientes` y `equipos_cliente` están restringidas a `admin` y `recepcionista`.
-   De igual forma, un `recepcionista` no podría editar el serial de un equipo existente si esa funcionalidad se implementara, ya que la política RLS de `UPDATE` en `equipos_cliente` lo previene.
