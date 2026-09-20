import React, { useState } from 'react';
import { Button, ButtonProps } from './Button';

export const Default: React.FC = () => (
  <Button>Click me</Button>
);

export const Disabled: React.FC = () => (
  <Button disabled>Disabled</Button>
);

export const WithIcon: React.FC = () => (
  <Button>
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" />
    </svg>
    Icon Button
  </Button>
);

export const Stateful: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <Button onClick={() => setExpanded(true)}>Expand</Button>
      <form hidden>
        <input data-testid="expanded" readOnly value={String(expanded)} />
      </form>
    </>
  );
};

export const WithTitle = ({ title = 'Default' }: { title?: string }) =>
  <Button title={title}>Button with title</Button>;