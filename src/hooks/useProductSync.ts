import { useState, useCallback } from 'react';
import { useProducts } from './useProducts';
import { ImageCacheService } from '../services/ImageCacheService';
import { getImageUrl } from '../utils/url';
import { toast } from 'sonner';

const CHUNK_SIZE = 5;

export const useProductSync = () => {
    const { data: products } = useProducts();
    const [isSyncing, setIsSyncing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const syncImages = useCallback(async (options: { silent?: boolean } = {}) => {
        if (!products || products.length === 0 || isSyncing) return;
        const { silent = false } = options;

        setIsSyncing(true);
        const total = products.length;
        setProgress({ current: 0, total });

        try {
            await ImageCacheService.ensureDirectory();

            // Prepare chunks for batch processing
            const productChunks = [];
            for (let i = 0; i < products.length; i += CHUNK_SIZE) {
                productChunks.push(products.slice(i, i + CHUNK_SIZE));
            }

            let processed = 0;
            for (const chunk of productChunks) {
                await Promise.all(
                    chunk.map(async (product) => {
                        if (product.image) {
                            const url = getImageUrl(product.image);
                            if (url) {
                                await ImageCacheService.downloadAndCacheImage(url, product.id);
                            }
                        }
                    })
                );
                processed += chunk.length;
                setProgress({ current: Math.min(processed, total), total });
            }

            // Cleanup old images
            const activeIds = products.map(p => p.id);
            await ImageCacheService.cleanupUnusedImages(activeIds);

            if (!silent) toast.success('Gambar produk berhasil disinkronkan');
        } catch (error) {
            console.error('Image sync failed:', error);
            if (!silent) toast.error('Gagal menyinkronkan gambar produk');
        } finally {
            setIsSyncing(false);
        }
    }, [products, isSyncing]);

    return {
        syncImages,
        isSyncing,
        progress
    };
};
