import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/axios';
import { getImageUrl } from '../../utils/url';
import './menu.css';

interface Modifier {
    id: string;
    name: string;
    price: number;
}

interface ModifierGroup {
    id: string;
    name: string;
    modifiers: Modifier[];
    required: boolean;
    min_select: number;
    max_select: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
    description?: string;
    image?: string;
    modifier_groups?: ModifierGroup[];
}

interface MenuGroup {
    category: string;
    items: Product[];
}

interface CartItem {
    product: Product;
    quantity: number;
    selectedModifiers: Modifier[];
    notes?: string;
}

interface OutletInfo {
    id: string;
    name: string;
    tax_rate: number;
    service_charge: number;
}

interface TableInfo {
    id: string;
    name: string;
}

export default function MenuPage() {
    const { qrToken } = useParams<{ qrToken: string }>();
    const navigate = useNavigate();

    const [outlet, setOutlet] = useState<OutletInfo | null>(null);
    const [table, setTable] = useState<TableInfo | null>(null);
    const [menu, setMenu] = useState<MenuGroup[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [sessionToken, setSessionToken] = useState<string | null>(
        () => sessionStorage.getItem('self_order_session')
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedMods, setSelectedMods] = useState<Modifier[]>([]);
    const [qty, setQty] = useState(1);
    const [cartOpen, setCartOpen] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});

    // ── Init: resolve QR → session → menu ──────────────────────────────────────
    useEffect(() => {
        if (!qrToken) return;
        initMenu();
    }, [qrToken]);

    const initMenu = async () => {
        setLoading(true);
        try {
            // 1. Resolve QR token
            const { data: tableData } = await api.get(`/public/table/${qrToken}`);
            setOutlet(tableData.data.outlet);
            setTable(tableData.data.table);

            // 2. Create/reuse session
            let token = sessionToken;
            if (!token) {
                const { data: sessData } = await api.post('/public/self-order/session', { qr_token: qrToken });
                token = sessData.data.session_token;
                setSessionToken(token);
                sessionStorage.setItem('self_order_session', token!);
            }

            // 3. Load menu
            const { data: menuData } = await api.get(`/public/menu/${tableData.data.outlet.id}`);
            setMenu(menuData.data);
            if (menuData.data.length > 0) setActiveCategory(menuData.data[0].category);

        } catch (e: any) {
            setError(e.response?.data?.message || e.message || 'Terjadi kesalahan.');
        } finally {
            setLoading(false);
        }
    };

    // ── Cart helpers ────────────────────────────────────────────────────────────
    const cartTotal = cart.reduce((sum, ci) => {
        const modTotal = ci.selectedModifiers.reduce((m, mod) => m + Number(mod.price), 0);
        return sum + (Number(ci.product.price) + modTotal) * ci.quantity;
    }, 0);

    const cartCount = cart.reduce((n, ci) => n + ci.quantity, 0);

    const addToCart = () => {
        if (!selectedProduct) return;
        setCart(prev => {
            const existing = prev.find(
                ci => ci.product.id === selectedProduct.id &&
                    JSON.stringify(ci.selectedModifiers.map(m => m.id).sort()) ===
                    JSON.stringify(selectedMods.map(m => m.id).sort())
            );
            if (existing) {
                return prev.map(ci =>
                    ci === existing ? { ...ci, quantity: ci.quantity + qty } : ci
                );
            }
            return [...prev, { product: selectedProduct, quantity: qty, selectedModifiers: selectedMods }];
        });
        setSelectedProduct(null);
        setSelectedMods([]);
        setQty(1);
    };

    const removeFromCart = (idx: number) => {
        setCart(prev => prev.filter((_, i) => i !== idx));
    };

    const toggleMod = (group: ModifierGroup, mod: Modifier) => {
        setSelectedMods(prev => {
            const isInGroup = group.modifiers.some(m => m.id === mod.id);
            if (!isInGroup) return prev;

            const currentInGroup = prev.filter(m => group.modifiers.some(gm => gm.id === m.id));
            const isSelected = prev.some(m => m.id === mod.id);

            // If max_select is 1, act like a radio button
            if (group.max_select === 1) {
                if (isSelected && !group.required) {
                    return prev.filter(m => m.id !== mod.id);
                }
                const otherGroups = prev.filter(m => !group.modifiers.some(gm => gm.id === m.id));
                return [...otherGroups, mod];
            }

            // Normal checkbox behavior with max limit
            if (isSelected) {
                return prev.filter(m => m.id !== mod.id);
            } else {
                if (currentInGroup.length < (group.max_select || 999)) {
                    return [...prev, mod];
                }
                return prev;
            }
        });
    };

    const formatRp = (n: any) =>
        'Rp ' + new Intl.NumberFormat('id-ID').format(Number(n || 0));

    const tax = cartTotal * ((outlet?.tax_rate ?? 0) / 100);
    const sc = cartTotal * ((outlet?.service_charge ?? 0) / 100);
    const grandTotal = cartTotal + tax + sc;

    // ── Submit order ────────────────────────────────────────────────────────────
    const submitOrder = async () => {
        if (!sessionToken || cart.length === 0) return;
        setSubmitting(true);
        try {
            const items = cart.map(ci => ({
                product_id: ci.product.id,
                quantity: ci.quantity,
                modifiers: ci.selectedModifiers.map(m => ({
                    modifier_id: m.id,
                    modifier_name: m.name,
                    price: m.price,
                })),
            }));

            const { data } = await api.post('/public/self-order', {
                session_token: sessionToken,
                customer_name: customerName || 'Tamu',
                notes: orderNotes,
                redirect_url: `${window.location.origin}/menu/order/${sessionToken}/status`,
                items,
            });

            // Success — navigate to payment page
            sessionStorage.setItem('self_order_payment', JSON.stringify(data.data));
            navigate(`/menu/payment/${sessionToken}`);

        } catch (e: any) {
            alert(e.response?.data?.message || 'Gagal membuat pesanan.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Scroll to category ──────────────────────────────────────────────────────
    const scrollToCategory = (cat: string) => {
        setActiveCategory(cat);
        categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // ─────────────────────────────────────────────────────────────────── Render ─
    if (loading) return (
        <div className="menu-loading">
            <div className="menu-spinner" />
            <p>Memuat menu...</p>
        </div>
    );

    if (error) return (
        <div className="menu-error">
            <div className="menu-error-icon">⚠️</div>
            <h2>Oops!</h2>
            <p>{error}</p>
        </div>
    );

    return (
        <div className="menu-root">
            {/* Header */}
            <header className="menu-header">
                <div className="menu-header-info">
                    <h1>{outlet?.name}</h1>
                    <span className="menu-table-badge">🪑 {table?.name}</span>
                </div>
            </header>

            {/* Category tabs */}
            <nav className="menu-cats">
                {menu.map(g => (
                    <button
                        key={g.category}
                        className={`menu-cat-btn ${activeCategory === g.category ? 'active' : ''}`}
                        onClick={() => scrollToCategory(g.category)}
                    >
                        {g.category}
                    </button>
                ))}
            </nav>

            {/* Product list */}
            <main className="menu-main">
                {menu.map(group => (
                    <section
                        key={group.category}
                        ref={el => { categoryRefs.current[group.category] = el; }}
                    >
                        <h2 className="menu-category-title">{group.category}</h2>
                        <div className="menu-grid">
                            {group.items.map(product => (
                                <div
                                    key={product.id}
                                    className="menu-card"
                                    onClick={() => { setSelectedProduct(product); setQty(1); setSelectedMods([]); }}
                                >
                                    {product.image && (
                                        <img src={getImageUrl(product.image)} alt={product.name} className="menu-card-img" />
                                    )}
                                    <div className="menu-card-body">
                                        <span className="menu-card-name">{product.name}</span>
                                        {product.description && (
                                            <span className="menu-card-desc">{product.description}</span>
                                        )}
                                        <span className="menu-card-price">{formatRp(product.price)}</span>
                                    </div>
                                    <button className="menu-card-add" aria-label="Tambah">+</button>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
                <div style={{ height: 100 }} />
            </main>

            {/* Floating cart button */}
            {cartCount > 0 && (
                <button className="menu-cart-fab" onClick={() => setCartOpen(true)}>
                    <span className="menu-cart-count">{cartCount}</span>
                    🛒 Lihat Pesanan
                    <span className="menu-cart-total">{formatRp(grandTotal)}</span>
                </button>
            )}

            {/* Product detail bottom sheet */}
            {selectedProduct && (
                <div className="menu-overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="menu-sheet" onClick={e => e.stopPropagation()}>
                        <div className="menu-sheet-drag" />
                        {selectedProduct.image && (
                            <img src={getImageUrl(selectedProduct.image)} alt={selectedProduct.name} className="menu-sheet-img" />
                        )}
                        <h3 className="menu-sheet-title">{selectedProduct.name}</h3>
                        {selectedProduct.description && <p className="menu-sheet-desc">{selectedProduct.description}</p>}
                        <p className="menu-sheet-price">
                            {formatRp(Number(selectedProduct.price) + selectedMods.reduce((s, m) => s + Number(m.price), 0))}
                        </p>

                        {/* Modifiers */}
                        {selectedProduct.modifier_groups?.map(group => {
                            const selectedInGroup = selectedMods.filter(m => group.modifiers.some(gm => gm.id === m.id));
                            const isValid = (!group.required && selectedInGroup.length === 0) ||
                                (selectedInGroup.length >= (group.min_select || 0) &&
                                    selectedInGroup.length <= (group.max_select || 999));

                            return (
                                <div key={group.id} className="menu-mods">
                                    <h4 className="menu-mods-title">
                                        {group.name}
                                        {group.required && <span className="menu-mod-req"> (Wajib)</span>}
                                        <span className="menu-mod-hint">
                                            {group.max_select > 1 ? `Pilih ${group.min_select || 0}-${group.max_select}` : group.required ? 'Pilih 1' : 'Pilih maks 1'}
                                        </span>
                                    </h4>
                                    {group.modifiers.map(mod => (
                                        <label key={mod.id} className="menu-mod-option">
                                            <input
                                                type={group.max_select === 1 ? "radio" : "checkbox"}
                                                name={`group-${group.id}`}
                                                checked={selectedMods.some(m => m.id === mod.id)}
                                                onChange={() => toggleMod(group, mod)}
                                            />
                                            <span>{mod.name}</span>
                                            {Number(mod.price) > 0 && <span className="menu-mod-price">+{formatRp(mod.price)}</span>}
                                        </label>
                                    ))}
                                    {!isValid && selectedInGroup.length > 0 && (
                                        <p className="menu-mod-error">Minimal pilih {group.min_select} pilihan.</p>
                                    )}
                                </div>
                            );
                        })}

                        {/* Qty */}
                        <div className="menu-qty-row">
                            <button className="menu-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                            <span className="menu-qty-val">{qty}</span>
                            <button className="menu-qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
                        </div>

                        <button
                            className="menu-add-btn"
                            onClick={addToCart}
                            disabled={
                                selectedProduct.modifier_groups?.some(group => {
                                    const count = selectedMods.filter(m => group.modifiers.some(gm => gm.id === m.id)).length;
                                    if (group.required && count === 0) return true;
                                    if (group.min_select && count < group.min_select) return true;
                                    return false;
                                })
                            }
                        >
                            Tambah — {formatRp((Number(selectedProduct.price) + selectedMods.reduce((s, m) => s + Number(m.price), 0)) * qty)}
                        </button>
                    </div>
                </div>
            )}

            {/* Cart bottom sheet */}
            {cartOpen && (
                <div className="menu-overlay" onClick={() => setCartOpen(false)}>
                    <div className="menu-sheet" onClick={e => e.stopPropagation()}>
                        <div className="menu-sheet-drag" />
                        <h3 className="menu-sheet-title">🛒 Pesanan Anda</h3>

                        {cart.map((ci, idx) => (
                            <div key={idx} className="menu-cart-item">
                                <div className="menu-cart-item-info">
                                    <span className="menu-cart-item-name">{ci.product.name}</span>
                                    {ci.selectedModifiers.length > 0 && (
                                        <span className="menu-cart-item-mods">
                                            + {ci.selectedModifiers.map(m => m.name).join(', ')}
                                        </span>
                                    )}
                                </div>
                                <div className="menu-cart-item-right">
                                    <span className="menu-cart-item-price">
                                        {formatRp((Number(ci.product.price) + ci.selectedModifiers.reduce((s, m) => s + Number(m.price), 0)) * ci.quantity)}
                                    </span>
                                    <div className="menu-qty-row menu-qty-sm">
                                        <button className="menu-qty-btn" onClick={() => {
                                            if (ci.quantity <= 1) removeFromCart(idx);
                                            else setCart(prev => prev.map((c, i) => i === idx ? { ...c, quantity: c.quantity - 1 } : c));
                                        }}>−</button>
                                        <span className="menu-qty-val">{ci.quantity}</span>
                                        <button className="menu-qty-btn" onClick={() =>
                                            setCart(prev => prev.map((c, i) => i === idx ? { ...c, quantity: c.quantity + 1 } : c))
                                        }>+</button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Summary */}
                        <div className="menu-summary">
                            <div className="menu-summary-row"><span>Subtotal</span><span>{formatRp(cartTotal)}</span></div>
                            {tax > 0 && <div className="menu-summary-row"><span>Pajak ({outlet?.tax_rate}%)</span><span>{formatRp(tax)}</span></div>}
                            {sc > 0 && <div className="menu-summary-row"><span>Service Charge ({outlet?.service_charge}%)</span><span>{formatRp(sc)}</span></div>}
                            <div className="menu-summary-row menu-summary-total"><span>Total</span><span>{formatRp(grandTotal)}</span></div>
                        </div>

                        {/* Name & notes */}
                        <input
                            className="menu-input"
                            placeholder="Nama Anda (opsional)"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                        />
                        <textarea
                            className="menu-input"
                            placeholder="Catatan pesanan (opsional)"
                            rows={2}
                            value={orderNotes}
                            onChange={e => setOrderNotes(e.target.value)}
                        />

                        <button
                            className="menu-add-btn"
                            disabled={submitting}
                            onClick={submitOrder}
                        >
                            {submitting ? 'Memproses...' : `Pesan & Bayar — ${formatRp(grandTotal)}`}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
