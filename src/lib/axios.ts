import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../app/store/useAuthStore';
import { useTenantStore } from '../app/store/useTenantStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    const currentTenant = useTenantStore.getState().currentTenant;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (currentTenant) {
      config.headers['X-Tenant-ID'] = currentTenant.id;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().token}`
          }
        });
        
        const { token } = response.data.data;
        useAuthStore.getState().setAuth(response.data.data);
        
        originalRequest.headers.Authorization = `Bearer ${token}`;
        processQueue(null, token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors (403, 422, 500, etc.)
    const message = error.response?.data?.message || 'Terjadi kesalahan pada server';
    
    if (error.response?.status === 403) {
      toast.error(message, {
        description: 'Batas paket tercapai atau akses ditolak',
        duration: 5000,
      });
    } else if (error.response?.status === 422) {
      // Validation errors are usually handled per-form, but we can show a general toast
      toast.error('Data tidak valid', {
        description: message,
      });
    } else if (error.response?.status === 500) {
      toast.error('Server Error', {
        description: 'Mohon coba lagi nanti atau hubungi bantuan',
      });
    }

    return Promise.reject(error);
  }
);

export default api;
