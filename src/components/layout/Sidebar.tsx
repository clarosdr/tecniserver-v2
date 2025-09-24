import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/ot', label: 'Órdenes de Trabajo' },
  { path: '/clientes', label: 'Clientes' },
  { path: '/inventario', label: 'Inventario' },
  { path: '/pos', label: 'Punto de Venta' },
  { path: '/presupuestos', label: 'Presupuestos' },
  { path: '/portal', label: 'Portal Cliente' },
  { path: '/marketplace', label: 'Marketplace' },
  { path: '/config', label: 'Configuración' },
];

export default function Sidebar() {
  const linkStyle = {
    display: 'block',
    padding: '0.75rem 1rem',
    color: 'white',
    textDecoration: 'none',
  };

  const activeLinkStyle = {
    backgroundColor: '#1f2937',
  };

  return (
    <aside style={{ width: '16rem', backgroundColor: '#374151', color: 'white', flexShrink: 0 }}>
      <div style={{ padding: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>TecniServer</div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end
                style={({ isActive }) =>
                  isActive ? { ...linkStyle, ...activeLinkStyle } : linkStyle
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
