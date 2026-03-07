import { App } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import api from '../lib/axios';
import axios from 'axios';

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
      const fileName = `jagokasir-v${version}.apk`;
      
      // 1. Download file using axios for progress tracking
      const response = await axios.get(url, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      // 2. Convert blob to base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(response.data);
      });

      // 3. Save to filesystem
      const path = `updates/${fileName}`;
      await Filesystem.writeFile({
        path,
        data: base64Data,
        directory: Directory.Data,
        recursive: true,
      });

      const fileUri = await Filesystem.getUri({
        path,
        directory: Directory.Data,
      });

      // 4. Open and Install
      await FileOpener.open({
        filePath: fileUri.uri,
        contentType: 'application/vnd.android.package-archive',
      });
    } catch (error) {
      console.error('Download or install failed', error);
      throw error;
    }
  },
};
