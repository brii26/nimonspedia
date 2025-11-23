import React from 'react';

const Pagination = ({ 
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
    <div className={`pagination ${className}`}>
      <button
        className="pagination-item pagination-prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {currentPage > Math.ceil(maxVisiblePages / 2) && totalPages > maxVisiblePages && (
        <>
          <button
            className="pagination-item"
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {currentPage > Math.ceil(maxVisiblePages / 2) + 1 && (
            <span className="pagination-item disabled">...</span>
          )}
        </>
      )}

      {visiblePages.map((page) => (
        <button
          key={page}
          className={`pagination-item ${page === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {currentPage < totalPages - Math.floor(maxVisiblePages / 2) && totalPages > maxVisiblePages && (
        <>
          {currentPage < totalPages - Math.floor(maxVisiblePages / 2) - 1 && (
            <span className="pagination-item disabled">...</span>
          )}
          <button
            className="pagination-item"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        className="pagination-item pagination-next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>

      {showInfo && totalItems > 0 && (
        <div className="pagination-info">
          Showing {startItem} to {endItem} of {totalItems} items
        </div>
      )}
    </div>
  );
};

export default Pagination;
