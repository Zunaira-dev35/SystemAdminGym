import React from "react";
import SvgArrowDropDown from "../../assets/ArrowDropDown";

interface PaginationProps {
  recordsPerPage: number;
  setRecordsPerPage: (value: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalRecords: number;
  className?: string; // Optional custom classes for the container
  recordsPerPageOptions?: number[]; // Optional custom options for records per page
  prevIcon?: React.ReactNode;
  nextIcon?: React.ReactNode;
}

const Pagination: React.FC<PaginationProps> = ({
  recordsPerPage,
  setRecordsPerPage,
  currentPage,
  setCurrentPage,
  totalRecords,
  className = "",
  recordsPerPageOptions = [10, 25, 50],
}) => {
  const maxOption = Math.max(...recordsPerPageOptions);
  const isAllSelected = recordsPerPage > maxOption;
  const effectiveRecordsPerPage = isAllSelected ? totalRecords : recordsPerPage;
  const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / effectiveRecordsPerPage) : 0;
  const startRecord = totalRecords > 0 ? (currentPage - 1) * effectiveRecordsPerPage + 1 : 0;
  const endRecord = isAllSelected ? totalRecords : Math.min(currentPage * effectiveRecordsPerPage, totalRecords);

  // Generate truncated page numbers
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];

    if (totalPages < 1) 
       return pageNumbers;

    // Add first page
    pageNumbers.push(1);

    // Add ellipsis if needed
    if (currentPage > 3) {
      pageNumbers.push("...");
    }

    // Add pages around current
    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      pageNumbers.push("...");
    }

    // Add last page if not already included
    if (totalPages > 1 && pageNumbers[pageNumbers.length - 1] !== totalPages) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`px-6 py-4 border-t  bg-theme-white flex items-center justify-between flex-wrap gap-2 ${className}`}
    >
      <div className="flex items-center gap-4">
        <select
          value={isAllSelected ? "all" : recordsPerPage}
          onChange={(e) => {
            if (e.target.value === "all") {
              setRecordsPerPage(totalRecords); // Large number to fetch all records
            } else {
              setRecordsPerPage(Number(e.target.value));
            }
            setCurrentPage(1); // Reset to first page on records per page change
          }}
          className="bg-card border-card-border text-card-foreground border rounded px-3 py-1 text-sm  focus:outline-none focus:ring-2  "
          aria-label="Records per page"
        >
          {recordsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value="all">All</option>
        </select>
        <span className="text-sm ">
          Records Per Page
        </span>
      </div>
      <div className="text-sm ">
        Showing {startRecord} - {endRecord} of {totalRecords}
      </div>
      <div className="flex items-center">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || totalPages === 0}
          className="p-1 border-y border-l  rounded-l-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <SvgArrowDropDown className="w-6 h-6 rotate-180 " />
        </button>
        {pageNumbers.map((page, index) => (
          typeof page === "string" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-1 border-y border-l border-border-gray text-[var(--color-font-blue2)] flex items-center"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border-y border-l last:border-r ${
                currentPage === page
                  ? "bg-[var(--color-primary)] border-primary text-white"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          )
        ))}
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1 border-y border-r  rounded-r-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <SvgArrowDropDown className="w-6 h-6 text-[var(--color-font-blue2)]" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;