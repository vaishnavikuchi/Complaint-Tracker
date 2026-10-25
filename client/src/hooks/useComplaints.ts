import { useState, useEffect, useCallback } from 'react';
import type { Complaint, ComplaintQueryParams, PaginatedComplaintsResponse } from '../types/index';
import { fetchComplaints } from '../services/api';

interface UseComplaintsResult {
  complaints: Complaint[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to encapsulate complaint fetching with loading and error states
 */
export function useComplaints(params: ComplaintQueryParams): UseComplaintsResult {
  const [data, setData] = useState<PaginatedComplaintsResponse>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // [AJAX USAGE] Calling API service to fetch paginated complaints
      const response = await fetchComplaints(params);
      setData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch complaints';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    params.search,
    params.status,
    params.category,
    params.priority,
    params.sortBy,
    params.sortOrder,
    params.page,
    params.limit,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    complaints: data.data,
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
    loading,
    error,
    refetch: loadData,
  };
}
