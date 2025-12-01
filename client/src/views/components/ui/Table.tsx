import React from 'react';
import type { ReactNode, HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  striped?: boolean;
  bordered?: boolean;
  hover?: boolean;
  responsive?: boolean;
  className?: string;
}

interface TableElementProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableDataCellElement> {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps extends ThHTMLAttributes<HTMLTableHeaderCellElement> {
  children: ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ 
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

export const TableHead: React.FC<TableElementProps> = ({ children, className = '', ...props }) => {
  return (
    <thead className={`bg-gray-50 ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<TableElementProps> = ({ children, className = '', ...props }) => {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<TableElementProps> = ({ children, className = '', ...props }) => {
  return (
    <tr className={`hover:bg-gray-50 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
};

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '', ...props }) => {
  return (
    <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`} {...props}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<TableCellProps> = ({ children, className = '', ...props }) => {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`} {...props}>
      {children}
    </td>
  );
};

export default Table;
