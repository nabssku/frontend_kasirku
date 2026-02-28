import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import type { AuditLogResponse } from '../types';

interface UseAuditLogsParams {
  page?: number;
  per_page?: number;
  outlet_id?: string;
  user_id?: number;
  action?: string;
  model_type?: string;
}

export const useAuditLogs = (params: UseAuditLogsParams) => {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const { data } = await api.get<AuditLogResponse>('/audit-logs', { params });
      return data;
    },
  });
};
