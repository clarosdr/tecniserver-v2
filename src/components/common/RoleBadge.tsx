import React from 'react';

interface RoleBadgeProps {
  role: string;
}

const roleStyles: { [key: string]: React.CSSProperties } = {
  admin: { backgroundColor: '#ef4444', color: 'white' }, // red-500
  tecnico: { backgroundColor: '#3b82f6', color: 'white' }, // blue-500
  recepcionista: { backgroundColor: '#f59e0b', color: 'white' }, // amber-500
  cliente: { backgroundColor: '#10b981', color: 'white' }, // emerald-500
  empresa: { backgroundColor: '#6366f1', color: 'white' }, // indigo-500
  default: { backgroundColor: '#6b7280', color: 'white' }, // gray-500
};

export default function RoleBadge({ role }: RoleBadgeProps) {
  const style = roleStyles[role] || roleStyles.default;
  const badgeBaseStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.25em 0.6em',
    fontSize: '0.75em',
    fontWeight: 700,
    lineHeight: 1,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    verticalAlign: 'baseline',
    borderRadius: '0.25rem',
    textTransform: 'capitalize',
  };

  return (
    <span style={{ ...badgeBaseStyle, ...style }}>
      {role}
    </span>
  );
}
