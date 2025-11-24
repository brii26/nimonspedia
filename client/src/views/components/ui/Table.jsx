import React from 'react';

const Table = ({ 
  children, 
  striped = false,
  bordered = false,
  hover = false,
  responsive = true,
  className = '',
  ...props 
}) => {
  const tableClasses = [
    'min-w-full divide-y divide-gray-200',
    className
  ].filter(Boolean).join(' ');

  const table = (
    <table className={tableClasses} {...props}>
      {children}
    </table>
  );

  if (responsive) {
    return <div className="overflow-x-auto border border-gray-200 rounded-lg">{table}</div>;
  }

  return table;
};

export const TableHead = ({ children, className = '', ...props }) => {
  return (
    <thead className={`bg-gray-50 ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className = '', ...props }) => {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, className = '', ...props }) => {
  return (
    <tr className={`hover:bg-gray-50 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
};

export const TableHeader = ({ children, className = '', ...props }) => {
  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`} {...props}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, className = '', ...props }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`} {...props}>
      {children}
    </td>
  );
};

export default Table;
