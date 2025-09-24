import React, { useState, useEffect, ReactNode } from 'react';
import { getUserRoles } from './session';

/**
 * Checks if the current authenticated user has at least one of the specified roles.
 * An 'admin' user will always return true.
 * @param requiredRoles A single role string or an array of role strings.
 * @returns A promise that resolves to true if the user has the role, false otherwise.
 */
export async function hasRole(requiredRoles: string | string[]): Promise<boolean> {
  const userRoles = await getUserRoles();
  if (userRoles.length === 0) {
    return false;
  }

  // 'admin' role bypasses all checks
  if (userRoles.includes('admin')) {
    return true;
  }

  const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return rolesToCheck.some(role => userRoles.includes(role));
}

interface RequireRoleProps {
  roles: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that renders its children only if the current user
 * has one of the specified roles.
 *
 * @example
 * <RequireRole roles={['admin', 'recepcionista']}>
 *   <button>Crear Cliente</button>
 * </RequireRole>
 */
export function RequireRole({ roles, children, fallback = null }: RequireRoleProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkAuthorization = async () => {
      const authorized = await hasRole(roles);
      if (isMounted) {
        setIsAuthorized(authorized);
      }
    };

    checkAuthorization();

    return () => {
      isMounted = false;
    };
  }, [roles]);

  if (isAuthorized === null) {
    // Still loading/checking roles, render nothing or a loader
    return null;
  }

  return isAuthorized ? <>{children}</> : <>{fallback}</>;
}
