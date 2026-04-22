import { useState } from 'react';
import { 
  useSuperAdminTemplates, 
  useUpdateTemplate, 
  useDeleteTemplate 
} from '../../hooks/useSuperAdmin';
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  FileJson,
  Package,
  Layers,
  CircleDot
} from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdminTemplatesPage() {
  const [search, setSearch] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: templates, isLoading } = useSuperAdminTemplates();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const filteredTemplates = templates?.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.category_type.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleDelete = (id: string) => {
    deleteTemplate.mutate(id, {
      onSuccess: () => {
        toast.success('Template deleted');
        setDeleteConfirm(null);
      }
    });
  };

  const handleToggleActive = (template: any) => {
    updateTemplate.mutate({
      id: template.id,
      is_active: !template.is_active
    }, {
      onSuccess: () => toast.success('Status updated')
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Templates</h1>
          <p className="text-slate-400 mt-1">Manage industry-specific product templates for new tenants</p>
        </div>
        <button 
          onClick={() => toast.info('Fitur tambah template via UI akan segera hadir. Gunakan seeder untuk saat ini.')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 text-sm font-semibold"
        >
          <Plus size={18} />
          Create Template
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search templates by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />
          ))
        ) : filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <div key={template.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${template.category_type === 'FnB' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {template.category_type === 'FnB' ? <Package size={24} /> : <Layers size={24} />}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setPreviewTemplate(template)}
                      className="p-2 hover:bg-slate-800 text-slate-400 rounded-lg"
                      title="Preview JSON"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handleToggleActive(template)}
                      className={`p-2 rounded-lg transition-colors ${template.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-800'}`}
                      title={template.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {template.is_active ? <Check size={16} /> : <X size={16} />}
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(template.id)}
                      className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{template.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{template.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">
                    {template.category_type}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${template.is_active ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'}`}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>{template.data.categories.length} Categories</span>
                <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-slate-500">No templates found</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-white">Delete Template?</h3>
            <p className="text-slate-400 text-sm">Action cannot be undone. Tenans won't be able to use this template anymore.</p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson size={20} className="text-indigo-400" />
                <h3 className="font-bold text-white">Template Data Preview: {previewTemplate.name}</h3>
              </div>
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-slate-400 hover:bg-slate-800 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                {previewTemplate.data.categories.map((cat: any, i: number) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold">
                       <CircleDot size={14} />
                       {cat.name}
                    </div>
                    <div className="ml-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {cat.products.map((prod: any, j: number) => (
                         <div key={j} className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                            <div className="flex items-center justify-between">
                               <span className="text-white text-sm font-medium">{prod.name}</span>
                               <span className="text-xs text-indigo-300 font-mono">Rp{prod.price.toLocaleString()}</span>
                            </div>
                            {prod.modifier_groups?.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-700/50 flex flex-wrap gap-1">
                                {prod.modifier_groups.map((mg: any, k: number) => (
                                  <span key={k} className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                    + {mg.name}
                                  </span>
                                ))}
                              </div>
                            )}
                         </div>
                       ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
