import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import api from '../lib/axios';

export interface AppVersionInfo {
  version_name: string;
  version_code: number;
  release_notes: string;
  is_critical: boolean;
  download_url: string;
}

export const UpdateService = {
  checkUpdate: async (): Promise<AppVersionInfo | null> => {
    try {
      const appInfo = await App.getInfo();
      // On Android, build is the versionCode
      const currentVersionCode = parseInt(appInfo.build);
      console.log('[UpdateService] App Info:', {
        version: appInfo.version,
        build: appInfo.build,
        currentVersionCode: currentVersionCode,
        platform: Capacitor.getPlatform()
      });

      const response = await api.get('/app-version/latest');
      
      if (!response.data.success) {
        console.log('[UpdateService] Server returned success:false for latest version');
        return null;
      }

      const latest = response.data.data;
      console.log('[UpdateService] Latest from server:', {
        version_name: latest.version_name,
        version_code: latest.version_code,
        comparison: `${latest.version_code} > ${currentVersionCode} = ${latest.version_code > currentVersionCode}`
      });

      if (latest.version_code > currentVersionCode) {
        console.log('[UpdateService] Update IS available');
        return latest;
      }

      console.log('[UpdateService] App is up to date');
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('[UpdateService] No version record found on server (404)');
      } else {
        console.error('[UpdateService] Check update failed:', error.message || error);
      }
      return null;
    }
  },

  downloadAndInstall: async (url: string, version: string, onProgress?: (progress: number) => void) => {
    try {
      console.log('[UpdateService] Starting native download from URL:', url);
      const fileName = `jagokasir-v${version}.apk`;
      const path = `updates/${fileName}`;

      // 1. Setup progress listener
      const progressListener = await Filesystem.addListener('progress', (p: any) => {
        if (onProgress && p.contentLength) {
          const percent = Math.round((p.bytes / p.contentLength) * 100);
          onProgress(percent);
        }
      });

      try {
        // Ensure updates directory exists in cache
        try {
          await Filesystem.mkdir({
            path: 'updates',
            directory: Directory.Cache,
            recursive: true
          });
        } catch (e) {
          // Ignore if exists
        }

        // 2. Download file using native Capacitor Filesystem to Cache
        const result = await Filesystem.downloadFile({
          url: url,
          path: path,
          directory: Directory.Cache,
          progress: true,
          recursive: true,
        });

        console.log('[UpdateService] Native download complete:', result.path);

        // Verify file exists
        const fileInfo = await Filesystem.stat({
          path: path,
          directory: Directory.Cache
        });

        if (!fileInfo) {
          throw new Error('File download succeeded but file not found in storage');
        }

        const fileUri = await Filesystem.getUri({
          path,
          directory: Directory.Cache,
        });

        console.log('[UpdateService] Opening for installation:', fileUri.uri);
        
        // 3. Open and Install
        await FileOpener.open({
          filePath: fileUri.uri,
          contentType: 'application/vnd.android.package-archive',
        });
      } catch (innerError: any) {
        console.error('[UpdateService] Download/Open details:', {
          message: innerError.message,
          url: url,
          path: path,
          directory: 'Directory.Cache'
        });
        throw innerError;
      } finally {
        progressListener.remove();
      }
    } catch (error: any) {
      console.error('[UpdateService] Error:', error);
      throw error;
    }
  },

  clearUpdateCache: async () => {
    try {
      console.log('[UpdateService] Clearing update cache...');
      const exists = await Filesystem.stat({
        path: 'updates',
        directory: Directory.Cache
      }).catch(() => null);

      if (exists) {
        await Filesystem.rmdir({
          path: 'updates',
          directory: Directory.Cache,
          recursive: true
        });
      }
      console.log('[UpdateService] Update cache cleared');
      return true;
    } catch (error) {
      console.error('[UpdateService] Failed to clear cache:', error);
      return false;
    }
  },
};
