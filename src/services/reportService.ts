import api from '../lib/axios';

export interface IncomeReportItem {
    date: string;
    total_revenue: number;
    description: string;
}

export interface IncomeReport {
    data: IncomeReportItem[];
    total_overall: number;
}

export interface ExpenseReportItem {
    category_name: string;
    source: string;
    notes: string;
    date: string;
    shift_opened_at: string | null;
    total_amount: number;
}

export interface ExpenseReport {
    data: ExpenseReportItem[];
    total_overall: number;
}

export interface ProfitLossSummary {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    status: 'profit' | 'loss';
}

const reportService = {
    getIncomeReport: async (params: { start_date: string; end_date: string; outlet_id?: string }) => {
        const { data } = await api.get('/reports/income', { params });
        return data.data as IncomeReport;
    },

    getExpenseReport: async (params: { start_date: string; end_date: string; outlet_id?: string }) => {
        const { data } = await api.get('/reports/expense', { params });
        return data.data as ExpenseReport;
    },

    getProfitLossSummary: async (params: { start_date: string; end_date: string; outlet_id?: string }) => {
        const { data } = await api.get('/reports/profit-loss', { params });
        return data.data as ProfitLossSummary;
    }
};

export default reportService;
