import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-xl ${
        hover ? 'cursor-pointer hover:border-primary/50 hover:bg-surface-2 transition-all duration-200' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
