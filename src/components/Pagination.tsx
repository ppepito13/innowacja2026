import React from 'react';
import {
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
} from 'react-icons/lu';
import Icon from './Icon';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (rows: number) => void;
  rowsOptions?: number[];
  labels: {
    rowsPerPage: string;
    pageText: React.ReactNode;
  };
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  rowsOptions = [10, 25, 50],
  labels,
}: PaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 mt-4 border-t border-primary/10 w-full">

      {/* Rows Per Page Selector */}
      <div className="flex items-center gap-2 text-sm text-primary/60">
        <span>{labels.rowsPerPage}</span>
        <select
          value={rowsPerPage}
          onChange={(e) => {
            onRowsPerPageChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="h-8 rounded-md border border-primary/20 bg-surface px-2 py-1 text-sm text-primary outline-none focus:border-primary cursor-pointer"
        >
          {rowsOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-3 text-sm text-primary/60">
        <span className="text-center sm:text-left">{labels.pageText}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/15 bg-surface text-primary/70 transition hover:bg-background hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon icon={LuChevronsLeft} size={14} />
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/15 bg-surface text-primary/70 transition hover:bg-background hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon icon={LuChevronLeft} size={14} />
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/15 bg-surface text-primary/70 transition hover:bg-background hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon icon={LuChevronRight} size={14} />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/15 bg-surface text-primary/70 transition hover:bg-background hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon icon={LuChevronsRight} size={14} />
          </button>
        </div>
      </div>

    </div>
  );
}
