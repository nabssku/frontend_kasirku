import api from '../lib/axios';

export interface PaymentConfig {
  subscription_gateway?: string;
  payment_gateway?: string;
  midtrans_config: {
    client_key: string;
    server_key: string;
    is_production: boolean;
  };
  pakasir_config: {
    slug: string;
    api_key: string;
    is_sandbox: boolean;
  };
}

const paymentSettingService = {
  getGlobalSettings: async () => {
    const response = await api.get('/super-admin/payment-settings');
    return response.data;
  },

  updateGlobalSettings: async (data: PaymentConfig) => {
    const response = await api.put('/super-admin/payment-settings', data);
    return response.data;
  },

  getTenantSettings: async () => {
    const response = await api.get('/settings/payment');
    return response.data;
  },

  updateTenantSettings: async (data: PaymentConfig) => {
    const response = await api.put('/settings/payment', data);
    return response.data;
  },
};

export default paymentSettingService;
