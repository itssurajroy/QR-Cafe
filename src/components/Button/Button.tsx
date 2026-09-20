import React from 'react';

export interface ButtonProps {
  /** Button label text */
  children: React.ReactNode;
  /** Optional disabled state */
  disabled?: boolean;
  /** Optional onClick handler */
  onClick?: () => void;
  /** Optional custom className */
  className?: string;
}

/**
 * A standard push-button component with accessible markup.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  disabled = false,
  onClick,
  className,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.();
  };

  return (
    <button
      disabled={disabled}
      className={className}
      onClick={handleClick}
      aria-disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};

/** @deprecated Use Button component instead */
export const LegacyButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <button onClick={onClick || (() => {})} disabled={false} type="button">
    {children}
  </button>
);