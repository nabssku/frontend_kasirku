import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import type { DailyReport, MonthlyReport, TopProduct } from '../types';

export const useDailyReport = (date?: string) => {
  return useQuery({
    queryKey: ['reports', 'daily', date],
    queryFn: async () => {
      const { data } = await api.get<{ data: DailyReport }>('/reports/daily', {
        params: { date },
      });
      return data.data;
    },
  });
};

export const useMonthlyReport = () => {
  return useQuery({
    queryKey: ['reports', 'monthly'],
    queryFn: async () => {
      const { data } = await api.get<{ data: MonthlyReport }>('/reports/monthly');
      return data.data;
    },
  });
};

export const useTopProducts = () => {
  return useQuery({
    queryKey: ['reports', 'top-products'],
    queryFn: async () => {
      const { data } = await api.get<{ data: TopProduct[] }>('/reports/top-products');
      return data.data;
    },
  });
};

export const useExportTransactions = () => {
  const exportCsv = async (startDate?: string, endDate?: string) => {
    try {
      const response = await api.get('/reports/export-csv', {
        params: {
          start_date: startDate,
          end_date: endDate,
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
