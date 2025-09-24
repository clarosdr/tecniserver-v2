# Infraestructura de UI y Conexión con Supabase

Este documento describe la arquitectura base de la interfaz de usuario (UI) de TecniServer Pro, incluyendo la configuración del entorno, la conexión a Supabase y el sistema de enrutamiento de la aplicación.

## 1. Configuración del Entorno (`.env`)

La conexión con la instancia de Supabase se gestiona a través de variables de entorno. Esto asegura que las claves sensibles no se incluyan directamente en el código fuente.

1.  **Crear el archivo:** En la raíz del proyecto, crea un archivo llamado `.env`.
2.  **Copiar el contenido:** Usa el archivo `.env.example` como plantilla.

    ```bash
    # .env.example
    VITE_SUPABASE_URL=
    VITE_SUPABASE_ANON_KEY=
    ```

3.  **Añadir las credenciales:**
    -   `VITE_SUPABASE_URL`: La URL de tu proyecto de Supabase (se encuentra en `Project Settings > API`).
    -   `VITE_SUPABASE_ANON_KEY`: La clave anónima (`anon key`) pública de tu proyecto (también en `Project Settings > API`).

El prefijo `VITE_` es un requisito del empaquetador (Vite) para que estas variables sean accesibles en el código del frontend a través de `import.meta.env`.

## 2. Cliente de Supabase (`src/services/supabase.ts`)

Para evitar inicializar el cliente de Supabase en múltiples lugares, hemos creado un singleton en `src/services/supabase.ts`.

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Lee las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Valida que las variables existan
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in .env file');
}

// Crea y exporta una única instancia del cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Este cliente `supabase` se importa en cualquier parte de la aplicación donde se necesite interactuar con la base de datos, la autenticación o el almacenamiento de Supabase.

## 3. Gestión de Sesión (`src/services/session.ts`)

Sobre la base del cliente de Supabase, hemos creado helpers para gestionar la sesión del usuario. Esto centraliza la lógica para obtener el usuario actual, su JWT (JSON Web Token) y sus roles.

-   `getUser()`: Devuelve el objeto del usuario autenticado.
-   `getJwt()`: Devuelve el token de acceso de la sesión actual, necesario para llamadas a APIs seguras.
-   `getUserRoles()`: Consulta la vista `public.v_user_roles` para obtener los roles del usuario. Esta función será fundamental para mostrar/ocultar elementos de la UI según los permisos del usuario.

## 4. Estructura de Rutas (`src/routes.tsx`)

La navegación de la aplicación se gestiona con `react-router-dom`. La configuración principal se encuentra en `src/routes.tsx`.

La estructura utiliza rutas anidadas:

-   **`<BrowserRouter>`**: El componente principal que habilita el enrutamiento.
-   **`<Route path="/" element={<App />}>`**: Esta es la ruta "layout". El componente `App.tsx` contiene los elementos comunes a todas las páginas, como la barra lateral (`Sidebar`) y la barra superior (`Topbar`). Dentro de `App.tsx`, se usa el componente `<Outlet />` para renderizar el contenido de las rutas hijas.
-   **Rutas Hijas**:
    ```tsx
    <Route index element={<DashboardPage />} />
    <Route path="ot" element={<WorkOrdersPage />} />
    // ... más rutas
    ```
    Cada una de estas rutas se renderiza dentro del layout `App`. Por ejemplo, al navegar a `/clientes`, se mostrará `Sidebar`, `Topbar` y el contenido de `ClientsPage`.

Este enfoque es limpio, escalable y evita la repetición de los componentes del layout en cada página.

## 5. Punto de Entrada (`src/main.tsx`)

Finalmente, el archivo `src/main.tsx` es el punto de entrada de la aplicación. Su única responsabilidad es renderizar el componente de rutas (`<AppRoutes />`) en el DOM.

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRoutes } from './routes.tsx';

// ...
root.render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
);
```
