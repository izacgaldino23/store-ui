import React from 'react';

interface LogoProps {
  collapsed?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ collapsed }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        gap: 8,
      }}
    >
      <img
        src="/logo.svg"
        alt="Miau Store"
        style={{ width: 32, height: 32 }}
      />
      {!collapsed && (
        <span
          style={{
            color: '#E879A8',
            fontWeight: 'bold',
            fontSize: 18,
            whiteSpace: 'nowrap',
          }}
        >
          Miau
        </span>
      )}
    </div>
  );
};
