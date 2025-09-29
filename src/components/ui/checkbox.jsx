import React from 'react';

function Checkbox({
  id,
  checked,
  onCheckedChange,
  className = '',
  ...props
}) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer ${className}`}
      {...props}
    />
  );
}

export { Checkbox }
