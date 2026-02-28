import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Image as ImageIcon, Upload, X, Check } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useProduct, useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { useModifierGroups } from '../../hooks/useModifiers';

const productSchema = z.object({
    name: z.string().min(1, 'Nama produk wajib diisi'),
    sku: z.string().optional(),
    description: z.string().optional(),
    category_id: z.string().optional(),
    price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
    cost_price: z.coerce.number().min(0).optional(),
    stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
    min_stock: z.coerce.number().int().min(0).optional(),
    is_active: z.boolean().optional().default(true),
    image: z.any().optional(),
    modifier_group_ids: z.array(z.string()).optional().default([]),
});

interface ProductForm {
    name: string;
    sku?: string;
    description?: string;
    category_id?: string;
    price: number;
    cost_price?: number;
    stock: number;
    min_stock?: number;
    is_active: boolean;
    image?: File | string | null;
    modifier_group_ids?: string[];
}

export default function ProductFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: categories } = useCategories();
    const { data: existingProduct, isLoading: loadingProduct } = useProduct(id || '');
    const { mutate: createProduct, isPending: creating } = useCreateProduct();
    const { mutate: updateProduct, isPending: updating } = useUpdateProduct();
    const { data: modifierGroups } = useModifierGroups();

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ProductForm>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(productSchema) as any,
        defaultValues: { is_active: true, stock: 0, price: 0 },
    });

    const selectedModifierGroups = watch('modifier_group_ids') || [];

    useEffect(() => {
        if (isEdit && existingProduct) {
            reset({
                name: existingProduct.name,
                sku: existingProduct.sku || '',
                description: existingProduct.description || '',
                category_id: existingProduct.category_id || '',
                price: existingProduct.price,
                cost_price: existingProduct.cost_price || 0,
                stock: existingProduct.stock,
                min_stock: existingProduct.min_stock,
                is_active: existingProduct.is_active,
                modifier_group_ids: existingProduct.modifier_groups?.map(g => g.id) || [],
            });
            if (existingProduct.image) {
                setImagePreview(existingProduct.image);
            }
        }
    }, [existingProduct, isEdit, reset]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setValue('image', null);
    };

    const onSubmit = (values: ProductForm) => {
        const formData = new FormData();
        formData.append('name', values.name);
        if (values.sku) formData.append('sku', values.sku);
        if (values.description) formData.append('description', values.description);
        if (values.category_id) formData.append('category_id', values.category_id);
        formData.append('price', values.price.toString());
        if (values.cost_price !== undefined) formData.append('cost_price', values.cost_price.toString());
        formData.append('stock', values.stock.toString());
        if (values.min_stock !== undefined) formData.append('min_stock', values.min_stock.toString());
        formData.append('is_active', values.is_active ? '1' : '0');

        if (selectedModifierGroups && selectedModifierGroups.length > 0) {
            selectedModifierGroups.forEach(id => {
                formData.append('modifier_group_ids[]', id);
            });
        } else if (isEdit) {
            formData.append('clear_modifier_groups', '1');
        }

        if (selectedFile) {
            formData.append('image', selectedFile);
        } else if (imagePreview === null && isEdit) {
            // Signal to backend to remove the image
            formData.append('image', '');
        }

        if (isEdit && id) {
            updateProduct(
                { id, payload: formData },
                { onSuccess: () => navigate('/products') }
            );
        } else {
            createProduct(formData, { onSuccess: () => navigate('/products') });
        }
    };

    const isBusy = creating || updating;

    if (isEdit && loadingProduct) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/products')}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        {isEdit ? 'Perbarui informasi produk' : 'Isi detail produk baru'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit as any)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
                        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Informasi Dasar</h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk *</label>
                            <input
                                {...register('name')}
                                className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-400' : 'border-slate-300'}`}
                                placeholder="Contoh: Mie Instan Goreng"
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                                <input
                                    {...register('sku')}
                                    className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                                    placeholder="SKU-001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                                <select
                                    {...register('category_id')}
                                    className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                >
                                    <option value="">— Pilih kategori —</option>
                                    {categories?.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
                            <textarea
                                {...register('description')}
                                rows={3}
                                className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                placeholder="Deskripsi produk (opsional)"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
                        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Harga & Stok</h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Harga Jual (Rp) *</label>
                                <input
                                    type="number"
                                    {...register('price')}
                                    className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.price ? 'border-red-400' : 'border-slate-300'}`}
                                    placeholder="0"
                                />
                                {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Harga Modal (Rp)</label>
                                <input
                                    type="number"
                                    {...register('cost_price')}
                                    className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Stok *</label>
                                <input
                                    type="number"
                                    {...register('stock')}
                                    className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.stock ? 'border-red-400' : 'border-slate-300'}`}
                                    placeholder="0"
                                />
                                {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Stok Minimum</label>
                                <input
                                    type="number"
                                    {...register('min_stock')}
                                    className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Modifier Groups Section */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Modifier / Tambahan</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                {selectedModifierGroups.length} Grup Terpilih
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {modifierGroups?.map((group) => {
                                const isSelected = selectedModifierGroups.includes(group.id);
                                return (
                                    <button
                                        key={group.id}
                                        type="button"
                                        onClick={() => {
                                            const current = selectedModifierGroups;
                                            const updated = isSelected
                                                ? current.filter(id => id !== group.id)
                                                : [...current, group.id];
                                            setValue('modifier_group_ids', updated);
                                        }}
                                        className={`
                                            flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                                            ${isSelected
                                                ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/5'
                                                : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                                            ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}
                                        `}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{group.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {group.modifiers?.length || 0} Opsi • {group.required ? 'Wajib' : 'Opsional'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                            {(!modifierGroups || modifierGroups.length === 0) && (
                                <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-sm text-slate-400 italic">Belum ada grup modifier yang dibuat.</p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/products/modifiers')}
                                        className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                                    >
                                        Buat Modifier Sekarang →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Image Upload */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Gambar Produk</h2>
                            {imagePreview && (
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                                >
                                    <X size={14} /> Hapus
                                </button>
                            )}
                        </div>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative aspect-square rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3 ${imagePreview ? 'border-transparent' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'}`}
                        >
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white text-xs font-semibold flex items-center gap-2">
                                            <Upload size={14} /> Ganti Gambar
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                        <ImageIcon size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-slate-700">Pilih Gambar</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-tighter">JPG, PNG, GIF (Max. 2MB)</p>
                                    </div>
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* Status Section */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-700">Status Produk</p>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Status aktif agar produk muncul di POS</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" {...register('is_active')} className="sr-only peer" />
                                <div className="w-10 h-5.5 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                        <button
                            type="submit"
                            disabled={isBusy}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-60 shadow-md shadow-indigo-100"
                        >
                            {isBusy ? (
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <Save size={18} />
                            )}
                            {isBusy ? 'Menyimpan...' : 'Simpan Produk'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/products')}
                            className="w-full px-5 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
