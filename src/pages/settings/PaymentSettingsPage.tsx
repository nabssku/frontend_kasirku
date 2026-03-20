import React, { useEffect, useState } from 'react';
import { Loader2, Save, CreditCard, Box, ShieldCheck, Globe } from 'lucide-react';
import { toast } from 'sonner';
import paymentSettingService from '../../services/paymentSettingService';
import type { PaymentConfig } from '../../services/paymentSettingService';

interface PaymentSettingsPageProps {
  isSuperAdmin?: boolean;
}

const PaymentSettingsPage: React.FC<PaymentSettingsPageProps> = ({ isSuperAdmin = false }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'midtrans' | 'pakasir'>('midtrans');
  const [config, setConfig] = useState<PaymentConfig>({
    subscription_gateway: 'midtrans',
    payment_gateway: 'midtrans',
    midtrans_config: {
      client_key: '',
      server_key: '',
      is_production: false,
    },
    pakasir_config: {
      slug: '',
      api_key: '',
      is_sandbox: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, [isSuperAdmin]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = isSuperAdmin 
        ? await paymentSettingService.getGlobalSettings() 
        : await paymentSettingService.getTenantSettings();
      
      if (res.success) {
        setConfig(res.data);
        setActiveTab((isSuperAdmin ? res.data.subscription_gateway : res.data.payment_gateway) as any || 'midtrans');
      }
    } catch (error) {
      console.error('Failed to fetch payment settings', error);
      toast.error('Gagal mengambil pengaturan pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedConfig = {
        ...config,
        [isSuperAdmin ? 'subscription_gateway' : 'payment_gateway']: activeTab
      };
      
      const res = isSuperAdmin 
        ? await paymentSettingService.updateGlobalSettings(updatedConfig) 
        : await paymentSettingService.updateTenantSettings(updatedConfig);
      
      if (res.success) {
        toast.success('Pengaturan pembayaran berhasil disimpan');
        setConfig(updatedConfig);
      }
    } catch (error) {
      console.error('Failed to save payment settings', error);
      toast.error('Gagal menyimpan pengaturan pembayaran');
    } finally {
      setSaving(false);
    }
  };

  const theme = {
    // Backgrounds
    card: isSuperAdmin ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100',
    subCard: isSuperAdmin ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200',
    footer: isSuperAdmin ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100',
    
    // Text
    title: isSuperAdmin ? 'text-white' : 'text-slate-900',
    description: isSuperAdmin ? 'text-slate-400' : 'text-slate-500',
    label: isSuperAdmin ? 'text-slate-500' : 'text-slate-500',
    inputText: isSuperAdmin ? 'text-white' : 'text-slate-900',
    
    // Accents
    primary: isSuperAdmin ? 'text-amber-500' : 'text-indigo-600',
    primaryBg: isSuperAdmin ? 'bg-amber-500/10' : 'bg-indigo-50',
    primaryBorder: isSuperAdmin ? 'border-amber-500' : 'border-indigo-600',
    
    // Inputs & Buttons
    input: isSuperAdmin ? 'bg-slate-950 border-slate-800 focus:border-amber-500/50' : 'bg-slate-50 border-slate-200 focus:ring-indigo-300',
    button: isSuperAdmin ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' : 'bg-indigo-600 hover:bg-indigo-700 text-white',
    
    // Components
    tabActive: isSuperAdmin ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-indigo-600 bg-indigo-50/50 text-indigo-600',
    tabInactive: isSuperAdmin ? 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700 hover:bg-slate-900' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:bg-white',
    toggle: isSuperAdmin ? 'peer-checked:bg-amber-500' : 'peer-checked:bg-indigo-600',
    iconBg: isSuperAdmin ? 'bg-amber-500' : 'bg-indigo-600',
    loader: isSuperAdmin ? 'text-amber-500' : 'text-indigo-600',
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className={`h-8 w-8 animate-spin ${theme.loader}`} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className={`text-2xl font-bold ${theme.title}`}>Pengaturan Payment Gateway</h1>
        <p className={`${theme.description}`}>
          {isSuperAdmin 
            ? 'Konfigurasi metode pembayaran untuk sistem langganan (SaaS).' 
            : 'Konfigurasi metode pembayaran untuk transaksi Self-Order di outlet Anda.'}
        </p>
      </div>

      <div className={`${theme.card} rounded-2xl shadow-sm border overflow-hidden`}>
        <div className={`p-6 border-b ${isSuperAdmin ? 'border-slate-800' : 'border-slate-100'}`}>
          <h2 className={`text-lg font-semibold ${theme.title}`}>Pilih Vendor Pembayaran</h2>
          <p className={`text-sm mt-1 ${theme.description}`}>Metode yang aktif akan digunakan untuk memproses transaksi.</p>
          
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('midtrans')}
              className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                activeTab === 'midtrans' 
                ? theme.tabActive 
                : theme.tabInactive
              }`}
            >
              <CreditCard size={20} />
              <div className="text-left">
                <p className="font-bold">Midtrans</p>
                <p className="text-xs opacity-80">Kartu, QRIS, Transfer, E-Wallet</p>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('pakasir')}
              className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                activeTab === 'pakasir' 
                ? theme.tabActive
                : theme.tabInactive
              }`}
            >
              <Box size={20} />
              <div className="text-left">
                <p className="font-bold">Pakasir</p>
                <p className="text-xs opacity-80">QRIS Pay (Instant Settlement)</p>
              </div>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 animate-in fade-in duration-300">
          {activeTab === 'midtrans' ? (
            <div className="space-y-6">
              <div className={`flex items-center gap-2 ${theme.primary} ${theme.primaryBg} px-3 py-2 rounded-lg w-fit text-sm font-medium`}>
                <ShieldCheck size={16} /> Midtrans Configuration
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${theme.label}`}>Client Key</label>
                  <input
                    type="text"
                    value={config.midtrans_config.client_key}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      midtrans_config: { ...prev.midtrans_config, client_key: e.target.value }
                    }))}
                    className={`w-full ${theme.input} border rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${theme.inputText}`}
                    placeholder="SB-Mid-client-..."
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${theme.label}`}>Server Key</label>
                  <input
                    type="password"
                    value={config.midtrans_config.server_key}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      midtrans_config: { ...prev.midtrans_config, server_key: e.target.value }
                    }))}
                    className={`w-full ${theme.input} border rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${theme.inputText}`}
                    placeholder="SB-Mid-server-..."
                  />
                </div>
              </div>

              <div className={`flex items-center justify-between p-4 ${theme.subCard} rounded-xl border`}>
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg ${config.midtrans_config.is_production ? 'bg-emerald-500' : (isSuperAdmin ? 'bg-slate-800' : 'bg-slate-200')} text-white`}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${theme.title}`}>Mode Produksi (Production)</p>
                    <p className={`text-xs ${theme.description}`}>Gunakan kredensial asli untuk memproses pembayaran nyata.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={config.midtrans_config.is_production}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      midtrans_config: { ...prev.midtrans_config, is_production: e.target.checked }
                    }))}
                    className="sr-only peer" 
                  />
                  <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${theme.toggle}`}></div>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={`flex items-center gap-2 ${theme.primary} ${theme.primaryBg} px-3 py-2 rounded-lg w-fit text-sm font-medium`}>
                <ShieldCheck size={16} /> Pakasir Configuration
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${theme.label}`}>Slug Project</label>
                  <input
                    type="text"
                    value={config.pakasir_config.slug}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      pakasir_config: { ...prev.pakasir_config, slug: e.target.value }
                    }))}
                    className={`w-full ${theme.input} border rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${theme.inputText}`}
                    placeholder="depodomain"
                  />
                </div>
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${theme.label}`}>API Key</label>
                  <input
                    type="password"
                    value={config.pakasir_config.api_key}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      pakasir_config: { ...prev.pakasir_config, api_key: e.target.value }
                    }))}
                    className={`w-full ${theme.input} border rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${theme.inputText}`}
                    placeholder="xxxxxxxxxxxx"
                  />
                </div>
              </div>

              <div className={`flex items-center justify-between p-4 ${theme.subCard} rounded-xl border`}>
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg ${config.pakasir_config.is_sandbox ? 'bg-amber-500' : (isSuperAdmin ? 'bg-slate-800' : 'bg-slate-200')} text-white`}>
                    <Box size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${theme.title}`}>Mode Sandbox (Simulation)</p>
                    <p className={`text-xs ${theme.description}`}>Aktifkan untuk mencoba simulasi transaksi di sistem Pakasir.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={config.pakasir_config.is_sandbox}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      pakasir_config: { ...prev.pakasir_config, is_sandbox: e.target.checked }
                    }))}
                    className="sr-only peer" 
                  />
                  <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${theme.toggle}`}></div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className={`p-6 ${theme.footer} border-t flex justify-end items-center gap-4`}>
          <p className="text-xs text-slate-400 italic">Pastikan kredensial yang dimasukkan sudah sesuai dengan panel konsol vendor.</p>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 ${theme.button} px-6 py-2.5 rounded-xl transition-colors font-semibold disabled:opacity-50`}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Simpan Konfigurasi
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettingsPage;
