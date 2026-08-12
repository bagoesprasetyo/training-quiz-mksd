import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-blue-100 
        rounded-2xl shadow-soft p-6 transition-all duration-200
        ${hoverable ? 'hover:shadow-elevated hover:border-blue-200 hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
