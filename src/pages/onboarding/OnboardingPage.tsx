import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { onboardingService } from '../../services/onboarding';
import type { ProductTemplate } from '../../types';
import { 
  CheckCircle, 
  ChevronRight, 
  Box, 
  Utensils, 
  ShoppingBag, 
  Wrench,
  Loader2,
  Sparkles,
  Building2,
  Users,
  Key,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../app/store/useAuthStore';
import { getDefaultPage } from '../../lib/auth';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'choice' | 'templates' | 'importing'>('choice');
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [filter, setFilter] = useState<'All' | 'FnB' | 'Retail'>('All');
  
  const { checkAuth, user } = useAuthStore();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await onboardingService.getTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Failed to fetch templates', error);
      }
    };
    fetchTemplates();
  }, []);

  const handleManualSetup = async () => {
    setLoading(true);
    try {
      await onboardingService.completeOnboarding();
      toast.success('Setup manual selesai!');
      await checkAuth(); 
      navigate(getDefaultPage(user?.roles), { replace: true });
    } catch (error) {
      toast.error('Gagal menyelesaikan setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleImportTemplate = async (templateId: string) => {
    setStep('importing');
    try {
      await onboardingService.importTemplate(templateId);
      toast.success('Template berhasil diimpor!');
      await checkAuth(); 
      navigate(getDefaultPage(user?.roles), { replace: true });
    } catch (error) {
      toast.error('Gagal mengimpor template.');
      setStep('templates');
    }
  };

  const filteredTemplates = templates.filter(t => 
    filter === 'All' || t.category_type === filter
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 sm:py-16 p-4 sm:p-6 lg:p-8 font-sans overflow-y-auto">
      <div className="max-w-3xl w-full">
        <AnimatePresence mode="wait">
          {step === 'choice' && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <motion.div 
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ type: 'spring', damping: 12 }}
                   className="inline-flex p-2.5 rounded-xl bg-indigo-100 text-indigo-600 mb-2"
                >
                  <Sparkles size={24} />
                </motion.div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Selamat Datang di JagoKasir!</h1>
                <p className="text-slate-500 text-base max-w-sm mx-auto">Mari siapkan tokomu dalam hitungan menit. Pilih cara terbaik untuk memulai.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Manual Setup Card */}
                <button
                  onClick={handleManualSetup}
                  disabled={loading}
                  className="group relative bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Wrench size={80} />
                  </div>
                  <div className="relative space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                      <Wrench size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900">Setup Manual</h3>
                      <p className="text-slate-500 leading-relaxed text-sm">Mulai dari nol dan atur segalanya sesuai keinginanmu. Estimasi: 5 Menit.</p>
                    </div>
                    <div className="flex items-center text-slate-900 font-semibold text-sm pt-2">
                      Lanjutkan <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>

                {/* Template Card */}
                <button
                  onClick={() => setStep('templates')}
                  className="group relative bg-white p-6 rounded-2xl border-2 border-indigo-600 shadow-sm hover:shadow-lg transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-indigo-600 group-hover:opacity-10 transition-opacity">
                    <Box size={80} />
                  </div>
                  <div className="relative space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                      <Box size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-slate-900">Gunakan Template</h3>
                      <p className="text-slate-500 leading-relaxed text-sm">Pilih template kategori & produk sesuai bisnismu. Estimasi: 1 Menit.</p>
                    </div>
                    <div className="flex items-center text-indigo-600 font-semibold text-sm pt-2">
                      Lihat Template <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">Pilih Template Bisnis</h2>
                  <p className="text-slate-500 text-xs">Pilih yang paling mendekati jenis usahamu.</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 self-start sm:self-center">
                  {(['All', 'FnB', 'Retail'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilter(t)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        filter === t 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <motion.div
                    layout
                    key={template.id}
                    className={`group bg-white rounded-3xl p-6 border-2 transition-all cursor-pointer ${
                      selectedTemplate?.id === template.id 
                      ? 'border-indigo-600 ring-4 ring-indigo-50' 
                      : 'border-slate-100 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="space-y-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                        template.category_type === 'FnB' 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'bg-blue-50 text-blue-600'
                      }`}>
                        {template.category_type === 'FnB' ? <Utensils size={24} /> : <ShoppingBag size={24} />}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900">{template.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{template.description}</p>
                      </div>
                      <div className="pt-2 flex items-center justify-between border-t border-slate-50 mt-4">
                         <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                           {template.category_type}
                         </span>
                         {selectedTemplate?.id === template.id && (
                           <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                             <CheckCircle size={20} className="text-indigo-600" />
                           </motion.div>
                         )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Selection Details */}
              <AnimatePresence>
                {selectedTemplate && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
                  >
                    <div className="relative space-y-5">
                      <div className="flex items-center gap-2">
                         <Sparkles size={18} className="text-indigo-200" />
                         <h3 className="text-lg font-bold">Setup Otomatis</h3>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                           <div className="flex items-center gap-1.5 text-indigo-200">
                             <Building2 size={14} />
                             <span className="text-[10px] font-bold uppercase tracking-widest">Outlet</span>
                           </div>
                           <p className="text-xs font-semibold">1 Outlet Pusat</p>
                        </div>

                        <div className="space-y-1">
                           <div className="flex items-center gap-1.5 text-indigo-200">
                             <Users size={14} />
                             <span className="text-[10px] font-bold uppercase tracking-widest">Accounts</span>
                           </div>
                           <p className="text-xs font-semibold">Admin & Kasir</p>
                        </div>

                        <div className="space-y-1">
                           <div className="flex items-center gap-1.5 text-indigo-200">
                             <Key size={14} />
                             <span className="text-[10px] font-bold uppercase tracking-widest">Security</span>
                           </div>
                           <p className="text-xs font-semibold">Sama dgn Owner</p>
                        </div>
                      </div>

                      <div className="text-[11px] text-indigo-100 flex items-center gap-2 bg-indigo-700/50 p-3 rounded-xl border border-white/5">
                         <ShieldCheck size={14} className="shrink-0" />
                         Sistem akan menyiapkan infrastruktur & produk secara instan.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-8 border-t border-slate-200">
                <button
                  onClick={() => setStep('choice')}
                  className="text-slate-500 font-medium hover:text-slate-900 transition-colors"
                >
                  Kembali
                </button>
                <button
                  disabled={!selectedTemplate}
                  onClick={() => selectedTemplate && handleImportTemplate(selectedTemplate.id)}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-100 hover:-translate-y-0.5 transition-all"
                >
                  Gunakan Template Ini
                </button>
              </div>
            </motion.div>
          )}

          {step === 'importing' && (
            <motion.div
              key="importing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-12 rounded-[40px] text-center shadow-2xl space-y-6 flex flex-col items-center"
            >
              <div className="relative">
                 <div className="absolute inset-0 bg-indigo-50 rounded-full animate-ping opacity-25" />
                 <div className="relative w-20 h-20 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <Loader2 size={40} className="animate-spin" />
                 </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Menyiapkan Tokomu...</h2>
                <p className="text-slate-500 max-w-xs mx-auto">Kami sedang mengimpor kategori, produk, dan pengaturan awal untukmu.</p>
              </div>
              <div className="w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                   className="h-full bg-indigo-600"
                   initial={{ width: '0%' }}
                   animate={{ width: '100%' }}
                   transition={{ duration: 3, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
