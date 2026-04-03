import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export class BackupService {
    private static BACKUP_DIR = 'backups';

    static async ensureDirectory() {
        if (!Capacitor.isNativePlatform()) return;
        try {
            await Filesystem.mkdir({
                path: this.BACKUP_DIR,
                directory: Directory.Documents,
                recursive: true,
            });
        } catch (e) {
            // Might exist
        }
    }

    static async exportData() {
        try {
            const backupData: Record<string, any> = {
                timestamp: Date.now(),
                version: '1.0',
                stores: {}
            };

            // 1. Collect all localStorage keys (Zustand persists)
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('storage') || key.includes('zustand'))) {
                    backupData.stores[key] = localStorage.getItem(key);
                }
            }

            const jsonStr = JSON.stringify(backupData, null, 2);
            const fileName = `KasirKu_Backup_${new Date().toISOString().split('T')[0]}.json`;

            if (Capacitor.isNativePlatform()) {
                await this.ensureDirectory();
                const path = `${this.BACKUP_DIR}/${fileName}`;
                
                await Filesystem.writeFile({
                    path,
                    data: jsonStr,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8,
                });

                const uriResult = await Filesystem.getUri({
                    path,
                    directory: Directory.Documents,
                });

                await Share.share({
                    title: 'KasirKu Data Backup',
                    text: 'Ekspor data transaksi dan pengaturan KasirKu.',
                    url: uriResult.uri,
                    dialogTitle: 'Simpan Cadangan',
                });
            } else {
                // Web Fallback: Download JSON
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            toast.success('Backup berhasil dibuat');
        } catch (error) {
            console.error('Backup failed:', error);
            toast.error('Gagal membuat backup');
        }
    }

    static async importData(fileContent: string) {
        try {
            const backup = JSON.parse(fileContent);
            if (!backup.stores || typeof backup.stores !== 'object') {
                throw new Error('Format backup tidak valid');
            }

            // Confirm with user (via UI, but here we just do it)
            Object.entries(backup.stores).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    localStorage.setItem(key, value);
                }
            });

            toast.success('Data berhasil dipulihkan. Me-restart aplikasi...');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Import failed:', error);
            toast.error('Gagal memulihkan data: Format tidak valid');
        }
    }

    /**
     * Helper for manual import via <input type="file">
     */
    static handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (content) {
                this.importData(content);
            }
        };
        reader.readAsText(file);
    }
}
