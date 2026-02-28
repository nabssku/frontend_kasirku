import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import type { DailyReport, MonthlyReport, TopProduct } from '../types';

export const useDailyReport = (date?: string, outletId?: string) => {
  return useQuery({
    queryKey: ['reports', 'daily', date, outletId],
    queryFn: async () => {
      const { data } = await api.get<{ data: DailyReport }>('/reports/daily', {
        params: { date, outlet_id: outletId },
      });
      return data.data;
    },
  });
};

export const useMonthlyReport = (outletId?: string) => {
  return useQuery({
    queryKey: ['reports', 'monthly', outletId],
    queryFn: async () => {
      const { data } = await api.get<{ data: MonthlyReport }>('/reports/monthly', {
        params: { outlet_id: outletId },
      });
      return data.data;
    },
  });
};

export const useTopProducts = (outletId?: string) => {
  return useQuery({
    queryKey: ['reports', 'top-products', outletId],
    queryFn: async () => {
      const { data } = await api.get<{ data: TopProduct[] }>('/reports/top-products', {
        params: { outlet_id: outletId },
      });
      return data.data;
    },
  });
};

export const useExportTransactions = () => {
  const exportCsv = async (startDate?: string, endDate?: string, outletId?: string) => {
    try {
      const response = await api.get('/reports/export-csv', {
        params: {
          start_date: startDate,
          end_date: endDate,
          outlet_id: outletId,
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions-${startDate || 'all'}-to-${endDate || 'now'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return { exportCsv };
};
