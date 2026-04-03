import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import api from '../lib/axios';

const IMAGE_DIR = 'products';
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB

export class ImageCacheService {
    static async ensureDirectory() {
        try {
            await Filesystem.mkdir({
                path: IMAGE_DIR,
                directory: Directory.Data,
                recursive: true,
            });
        } catch (e) {
            // Directory might already exist
        }
    }

    static async getLocalUri(productId: string): Promise<string | null> {
        if (!Capacitor.isNativePlatform()) return null;
        try {
            const fileName = `${productId}.jpg`;
            const result = await Filesystem.getUri({
                path: `${IMAGE_DIR}/${fileName}`,
                directory: Directory.Data,
            });
            
            // Check if file actually exists
            await Filesystem.stat({
                path: `${IMAGE_DIR}/${fileName}`,
                directory: Directory.Data,
            });
            
            return result.uri;
        } catch (e) {
            return null;
        }
    }

    static async downloadAndCacheImage(url: string, productId: string): Promise<string | null> {
        if (!Capacitor.isNativePlatform()) return null;

        try {
            await this.ensureDirectory();
            const fileName = `${productId}.jpg`;
            const filePath = `${IMAGE_DIR}/${fileName}`;

            // 1. Check if already exists and is not too old (optional)
            // For now, if it exists, we skip downloading
            try {
                await Filesystem.stat({ path: filePath, directory: Directory.Data });
                const uriResult = await Filesystem.getUri({ path: filePath, directory: Directory.Data });
                return uriResult.uri;
            } catch (e) {
                // File doesn't exist, proceed to download
            }

            // 2. Download as blob
            const response = await api.get(url, { responseType: 'blob' });
            const blob = response.data;

            // 3. Convert blob to base64 for Capacitor Filesystem
            const base64Data = await this.blobToBase64(blob);

            // 4. Save to filesystem
            await Filesystem.writeFile({
                path: filePath,
                data: base64Data,
                directory: Directory.Data,
            });

            // 5. Trigger storage limit check (non-blocking)
            this.checkStorageLimit().catch(console.error);

            const uriResult = await Filesystem.getUri({ path: filePath, directory: Directory.Data });
            return uriResult.uri;
        } catch (error) {
            console.error(`Failed to cache image for product ${productId}:`, error);
            return null;
        }
    }

    static async checkStorageLimit() {
        try {
            const result = await Filesystem.readdir({
                path: IMAGE_DIR,
                directory: Directory.Data,
            });

            let totalSize = 0;
            const files = [];

            for (const file of result.files) {
                const stat = await Filesystem.stat({
                    path: `${IMAGE_DIR}/${file.name}`,
                    directory: Directory.Data,
                });
                totalSize += stat.size;
                files.push({ name: file.name, size: stat.size, mtime: stat.mtime });
            }

            if (totalSize > MAX_CACHE_SIZE) {
                console.warn(`Cache size limit exceeded (${(totalSize / 1024 / 1024).toFixed(2)}MB). Cleaning up...`);
                // Sort by mtime (oldest first)
                files.sort((a, b) => (a.mtime || 0) - (b.mtime || 0));

                let freed = 0;
                while (totalSize - freed > MAX_CACHE_SIZE * 0.8 && files.length > 0) {
                    const toDelete = files.shift()!;
                    await Filesystem.deleteFile({
                        path: `${IMAGE_DIR}/${toDelete.name}`,
                        directory: Directory.Data,
                    });
                    freed += toDelete.size;
                }
            }
        } catch (e) {
            console.error('Failed to check storage limit:', e);
        }
    }

    static async cleanupUnusedImages(activeProductIds: string[]) {
        try {
            const result = await Filesystem.readdir({
                path: IMAGE_DIR,
                directory: Directory.Data,
            });

            const activeSet = new Set(activeProductIds.map(id => `${id}.jpg`));

            for (const file of result.files) {
                if (!activeSet.has(file.name)) {
                    await Filesystem.deleteFile({
                        path: `${IMAGE_DIR}/${file.name}`,
                        directory: Directory.Data,
                    });
                }
            }
        } catch (e) {
            console.error('Failed to cleanup unused images:', e);
        }
    }

    static async clearCache() {
        try {
            await Filesystem.rmdir({
                path: IMAGE_DIR,
                directory: Directory.Data,
                recursive: true,
            });
        } catch (e) {
            console.error('Failed to clear cache:', e);
        }
    }

    private static blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove prefix: "data:image/jpeg;base64,"
                resolve(base64String.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}
