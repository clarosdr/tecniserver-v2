import React from 'react';

export default function Topbar() {
  return (
    <header style={{ backgroundColor: 'white', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.1)', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: '600' }}>admin@local</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Admin</p>
        </div>
      </div>
    </header>
  );
}
