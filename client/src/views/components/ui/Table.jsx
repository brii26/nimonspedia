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
  const classes = [
    'table',
    striped ? 'table-striped' : '',
    bordered ? 'table-bordered' : '',
    hover ? 'table-hover' : '',
    className
  ].filter(Boolean).join(' ');

  const table = (
    <table className={classes} {...props}>
      {children}
    </table>
  );

  if (responsive) {
    return <div className="table-responsive">{table}</div>;
  }

  return table;
};

export const TableHead = ({ children, className = '', ...props }) => {
  return (
    <thead className={`table-head ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableBody = ({ children, className = '', ...props }) => {
  return (
    <tbody className={`table-body ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow = ({ children, className = '', ...props }) => {
  return (
    <tr className={`table-row ${className}`} {...props}>
      {children}
    </tr>
  );
};

export const TableHeader = ({ children, className = '', ...props }) => {
  return (
    <th className={`table-header ${className}`} {...props}>
      {children}
    </th>
  );
};

export const TableCell = ({ children, className = '', ...props }) => {
  return (
    <td className={`table-cell ${className}`} {...props}>
      {children}
    </td>
  );
};

export default Table;
