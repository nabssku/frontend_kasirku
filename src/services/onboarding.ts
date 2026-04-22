import api from '../lib/axios';
import type { ProductTemplate } from '../types';

export const onboardingService = {
  getTemplates: async () => {
    const { data } = await api.get('/onboarding/templates');
    return data.data;
  },

  importTemplate: async (templateId: string) => {
    const { data } = await api.post('/onboarding/import', { template_id: templateId });
    return data;
  },

  completeOnboarding: async () => {
    const { data } = await api.post('/onboarding/complete');
    return data;
  },
};

export const superAdminTemplateService = {
  list: async () => {
    const { data } = await api.get('/super-admin/templates');
    return data.data;
  },
  
  create: async (payload: any) => {
    const { data } = await api.post('/super-admin/templates', payload);
    return data;
  },

  update: async (id: string, payload: any) => {
    const { data } = await api.put(`/super-admin/templates/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/super-admin/templates/${id}`);
    return data;
  },
};
