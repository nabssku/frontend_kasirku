import { App } from '@capacitor/app';
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

      const response = await api.get('/app-version/latest');
      const latest = response.data.data;

      if (latest.version_code > currentVersionCode) {
        return latest;
      }
      return null;
    } catch (error) {
      console.error('Check update failed', error);
      return null;
    }
  },

  downloadAndInstall: async (url: string, version: string, onProgress?: (progress: number) => void) => {
    try {
      console.log('[UpdateService] Starting native download from URL:', url);
      const fileName = `jagokasir-v${version}.apk`;
      const path = `updates/${fileName}`;

      // 1. Setup progress listener
      // Note: In newer Capacitor versions, the event name is 'progress'
      const progressListener = await Filesystem.addListener('progress', (p: any) => {
        if (onProgress && p.contentLength) {
          const percent = Math.round((p.bytes / p.contentLength) * 100);
          onProgress(percent);
        }
      });

      try {
        // 2. Download file using native Capacitor Filesystem
        // This is much more reliable on Android and avoids CORS/Memory issues
        const result = await Filesystem.downloadFile({
          url: url,
          path: path,
          directory: Directory.Data,
          progress: true,
          recursive: true, // Ensure parent directories are created
        });

        console.log('[UpdateService] Native download complete:', result.path);

        const fileUri = await Filesystem.getUri({
          path,
          directory: Directory.Data,
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
          path: path
        });
        throw innerError;
      } finally {
        // Always remove the listener
        progressListener.remove();
      }
    } catch (error: any) {
      console.error('[UpdateService] Error:', error);
      throw error;
    }
  },
};
