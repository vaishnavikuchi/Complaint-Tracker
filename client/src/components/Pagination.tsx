import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<Props> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}) => {
  if (total === 0) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 0.5rem',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
      }}
    >
      <div>
        Showing <strong>{startRecord}</strong> to <strong>{endRecord}</strong> of{' '}
        <strong>{total}</strong> complaints
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        <span style={{ padding: '0 0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Page {page} of {totalPages || 1}
        </span>

        <button
          className="btn btn-secondary btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
