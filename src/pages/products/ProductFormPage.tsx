import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { useProduct, useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';

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
}

export default function ProductFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const { data: categories } = useCategories();
    const { data: existingProduct, isLoading: loadingProduct } = useProduct(id || '');
    const { mutate: createProduct, isPending: creating } = useCreateProduct();
    const { mutate: updateProduct, isPending: updating } = useUpdateProduct();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProductForm>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(productSchema) as any,
        defaultValues: { is_active: true, stock: 0, price: 0 },
    });

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
            });
        }
    }, [existingProduct, isEdit, reset]);

    const onSubmit = (values: ProductForm) => {
        const payload = {
            ...values,
            category_id: values.category_id || undefined,
        };

        if (isEdit && id) {
            updateProduct(
                { id, payload },
                { onSuccess: () => navigate('/products') }
            );
        } else {
            createProduct(payload, { onSuccess: () => navigate('/products') });
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
        <div className="max-w-2xl mx-auto">
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

            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
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

                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-700">Status Produk</p>
                            <p className="text-xs text-slate-500 mt-0.5">Nonaktifkan untuk menyembunyikan dari POS</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" {...register('is_active')} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isBusy}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 text-sm shadow-sm"
                    >
                        {isBusy ? (
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            <Save size={16} />
                        )}
                        {isBusy ? 'Menyimpan...' : 'Simpan Produk'}
                    </button>
                </div>
            </form>
        </div>
    );
}
