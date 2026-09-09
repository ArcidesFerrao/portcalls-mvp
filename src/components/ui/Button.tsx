import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  icon, 
  className = '', 
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]';
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-light text-white focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-white border border-border hover:border-primary hover:text-primary text-text-secondary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-3 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
