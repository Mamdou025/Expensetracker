import React from 'react';

const Logo = ({ variant = 'full', size = 'md', className = '' }) => {
  const markSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg';
  const wordSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg';

  return (
    <span
      className={`inline-flex items-baseline select-none leading-none ${className}`}
      aria-label="exptrackr"
      role="img"
    >
      <span className={`font-mono font-bold ${markSize}`} aria-hidden="true">
        <span className="text-emerald-400">[</span>
        <span className="text-gray-100 mx-px tracking-tight">xt</span>
        <span className="text-emerald-400">]</span>
      </span>
      {variant === 'full' && (
        <span
          aria-hidden="true"
          className={`ml-2 font-semibold tracking-tight text-gray-100 ${wordSize}`}
        >
          exptrackr
        </span>
      )}
    </span>
  );
};

export default Logo;
