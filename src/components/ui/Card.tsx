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
      className={`bg-white border border-border rounded-xl shadow-sm ${
        hover ? 'cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
