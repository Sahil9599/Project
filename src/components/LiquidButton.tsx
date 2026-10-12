import React from 'react';

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'subtle';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-2xl gap-2.5',
    icon: 'p-2 rounded-xl justify-center',
  }[size];

  const variantClass = {
    primary: 'liquid-btn liquid-btn-primary',
    secondary: 'liquid-btn text-slate-800 hover:text-slate-950',
    danger: 'liquid-btn liquid-btn-danger',
    success: 'liquid-btn liquid-btn-success',
    subtle: 'liquid-btn liquid-btn-subtle text-slate-700 hover:text-slate-900',
  }[variant];

  return (
    <button
      disabled={disabled}
      className={`liquidGlass-wrapper ${variantClass} ${sizeClasses} ${
        disabled ? 'opacity-50 cursor-not-allowed filter-none transform-none' : 'cursor-pointer'
      } ${className}`}
      {...props}
    >
      {/* Liquid Glass DOM Layers matching user's spec */}
      <span className="liquidGlass-effect" aria-hidden="true" />
      <span className="liquidGlass-tint" aria-hidden="true" />
      <span className="liquidGlass-shine" aria-hidden="true" />
      <span className="liquidGlass-text">{children}</span>
    </button>
  );
};
