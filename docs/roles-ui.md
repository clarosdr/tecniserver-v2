# Gestión de Roles en la Interfaz de Usuario (UI)

Este documento explica las herramientas creadas para gestionar la visibilidad de los componentes de la UI basándose en los roles del usuario.

## Herramientas Creadas

### 1. Helper `hasRole(roles)`

-   **Ubicación:** `src/services/roles.ts`
-   **Propósito:** Es una función asíncrona que permite verificar programáticamente si el usuario actual tiene un rol específico. Es útil para la lógica condicional dentro de los componentes.
-   **Uso:**
    ```typescript
    import { hasRole } from '../services/roles';

    async function handleSomeAction() {
      if (await hasRole('admin')) {
        // Ejecutar lógica solo para administradores
        console.log('Acción de admin ejecutada.');
      } else {
        alert('No tienes permiso para realizar esta acción.');
      }
    }
    ```

### 2. Componente `<RequireRole>`

-   **Ubicación:** `src/services/roles.ts`
-   **Propósito:** Es un componente "wrapper" que renderiza sus elementos hijos (`children`) solo si el usuario actual cumple con los roles especificados. Simplifica enormemente la tarea de ocultar o mostrar partes de la UI.
-   **Uso:**
    ```tsx
    import { RequireRole } from '../services/roles';

    function MyPageComponent() {
      return (
        <div>
          <h1>Dashboard</h1>
          <p>Información visible para todos.</p>

          <RequireRole roles={['admin', 'recepcionista']}>
            <button>Crear Nuevo Cliente</button>
          </RequireRole>

          <RequireRole roles="admin">
            <button style={{ backgroundColor: 'red' }}>Borrar TODO</button>
          </RequireRole>
        </div>
      );
    }
    ```

---

## **Importante:** Seguridad en Frontend vs. Backend (RLS)

Es crucial entender la diferencia entre la seguridad implementada en la UI y la seguridad real del sistema.

-   **Seguridad en la UI (UX):** Las herramientas como `<RequireRole>` son principalmente para mejorar la **Experiencia de Usuario (UX)**. Ocultan botones y opciones que un usuario no podría usar de todos modos. Esto crea una interfaz más limpia y menos confusa.

-   **Seguridad Real (RLS en Supabase):** La **seguridad autoritativa y real** de la aplicación reside en el backend, específicamente en las **Políticas de Seguridad a Nivel de Fila (RLS)** de Supabase.

### ¿Qué significa esto en la práctica?

Imaginemos que un usuario malintencionado modifica el código JavaScript en su navegador para hacer visible un botón de "Eliminar Cliente" que estaba oculto por `<RequireRole>`.

-   Al hacer clic en ese botón, la aplicación intentará hacer una llamada a la API de Supabase para eliminar el cliente.
-   Supabase, antes de ejecutar la eliminación, verificará las políticas RLS.
-   Si la política dice que `DELETE` solo está permitido para el rol `admin`, y el usuario no tiene ese rol, **la operación fallará con un error de permisos**.

**En resumen: Ocultar elementos en la UI es una cortesía para el usuario, no una medida de seguridad. La verdadera fortaleza está en las reglas definidas en la base de datos (RLS), que son imposibles de eludir desde el cliente.**
