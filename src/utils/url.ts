export const getImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  
  // Base URL from env or default to production storage
  const baseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
    : 'https://api.jagokasir.store';
    
  return `${baseUrl}/storage/${path.replace(/^\//, '')}`;
};
