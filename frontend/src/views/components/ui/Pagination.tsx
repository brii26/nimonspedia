import React from 'react';
import type { HTMLAttributes } from 'react';

interface PaginationProps extends HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  showInfo = false,
  totalItems = 0,
  itemsPerPage = 10,
  className = ''
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  const maxVisiblePages = 5;
  let visiblePages = pages;

  if (totalPages > maxVisiblePages) {
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + maxVisiblePages - 1, totalPages);

    if (end - start < maxVisiblePages - 1) {
      start = Math.max(end - maxVisiblePages + 1, 1);
    }

    visiblePages = pages.slice(start - 1, end);
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      <button
        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {currentPage > Math.ceil(maxVisiblePages / 2) && totalPages > maxVisiblePages && (
        <>
          <button
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {currentPage > Math.ceil(maxVisiblePages / 2) + 1 && (
            <span className="px-3 py-2 text-gray-500">...</span>
          )}
        </>
      )}

      {visiblePages.map((page) => (
        <button
          key={page}
          className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
            page === currentPage
              ? 'border-[#42b549] bg-[#42b549] text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {currentPage < totalPages - Math.floor(maxVisiblePages / 2) && totalPages > maxVisiblePages && (
        <>
          {currentPage < totalPages - Math.floor(maxVisiblePages / 2) - 1 && (
            <span className="px-3 py-2 text-gray-500">...</span>
          )}
          <button
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>

      {showInfo && totalItems > 0 && (
        <div className="w-full text-center text-sm text-gray-600 mt-2">
          Showing {startItem} to {endItem} of {totalItems} items
        </div>
      )}
    </div>
  );
};

export default Pagination;
