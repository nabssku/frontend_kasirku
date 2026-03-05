import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/axios';
import './menu.css';

interface OrderItem {
    id: string;
    product_name: string;
    image: string | null;
    quantity: number;
    price: string | number;
}

interface OrderStatus {
    session_status: string;
    order_status: string;
    kitchen_status: string | null;
    invoice_number: string;
    gateway_invoice_id?: string;
    grand_total: string;
    final_amount?: number;
    payment_url?: string;
    payment_checking: boolean;
    message: string;
    items?: OrderItem[];
}

const STATUS_STEPS = [
    { key: 'pending_payment', label: 'Menunggu Bayar', icon: '⏳' },
    { key: 'paid', label: 'Bayar Sukses', icon: '✅' },
    { key: 'preparing', label: 'Dimasak', icon: '👨‍🍳' },
    { key: 'ready', label: 'Siap Disajikan', icon: '🍽️' },
    { key: 'completed', label: 'Selesai', icon: '🎉' },
];


export default function OrderStatusPage() {
    const { sessionToken } = useParams<{ sessionToken: string }>();
    const [status, setStatus] = useState<OrderStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const formatRp = (n: number) =>
        'Rp ' + new Intl.NumberFormat('id-ID').format(n);

    const fetchStatus = async () => {
        try {
            const res = await api.get(`/public/self-order/${sessionToken}/status`);
            setStatus(res.data.data);
        } catch {
            // keep polling
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // Poll every 5 seconds while order is active
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, [sessionToken]);

    const getCurrentStepIdx = () => {
        if (!status) return -1;

        const { order_status: os, kitchen_status: ks } = status;

        if (os === 'completed' || ks === 'served') return 4;
        if (os === 'ready' || ks === 'ready') return 3;
        if (os === 'preparing' || ks === 'cooking') return 2;
        if (os === 'paid' || ks === 'queued') return 1;
        if (os === 'pending_payment') return 0;

        return -1;
    };

    const currentStepIdx = getCurrentStepIdx();
    const isCancelled = status?.order_status === 'cancelled';

    if (loading) return (
        <div className="menu-loading">
            <div className="menu-spinner" />
            <p>Memeriksa status pesanan...</p>
        </div>
    );

    return (
        <div className="menu-root status-root">
            <header className="menu-header">
                <h1>📋 Status Pesanan</h1>
            </header>

            <main className="status-main">
                {status?.invoice_number && (
                    <p className="status-invoice">#{status.invoice_number}</p>
                )}

                {isCancelled ? (
                    <div className="status-cancelled">
                        <div className="status-icon cancelled">❌</div>
                        <h2>Pesanan Dibatalkan</h2>
                        <p>Pembayaran gagal atau habis waktu.</p>
                        <a href="/" className="menu-add-btn" style={{ marginTop: 16 }}>
                            Kembali ke Menu
                        </a>
                    </div>
                ) : (
                    <>
                        {/* Progress stepper */}
                        <div className="status-stepper">
                            {STATUS_STEPS.map((step, idx) => {
                                const done = idx <= currentStepIdx;
                                const current = idx === currentStepIdx;
                                return (
                                    <div key={step.key} className={`status-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                                        <div className="status-step-icon">{step.icon}</div>
                                        <span className="status-step-label">{step.label}</span>
                                        {idx < STATUS_STEPS.length - 1 && (
                                            <div className={`status-step-line ${idx < currentStepIdx ? 'done' : ''}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Payment verification indicator */}
                        {status?.order_status === 'pending_payment' && status?.payment_checking && (
                            <div className="status-payment-checking">
                                <span className="menu-spinner status-checking-spinner" />
                                <span>Memverifikasi pembayaran ke gateway...</span>
                            </div>
                        )}

                        {/* Status Highlights */}
                        {currentStepIdx >= 1 ? (
                            <div className={`status-highlight-card step-${currentStepIdx}`}>
                                <div className="status-highlight-content">
                                    <div className="status-highlight-icon">
                                        {currentStepIdx === 1 && '💳'}
                                        {currentStepIdx === 2 && '👨‍🍳'}
                                        {currentStepIdx === 3 && '🔔'}
                                        {currentStepIdx === 4 && '🎉'}
                                    </div>
                                    <div className="status-highlight-text">
                                        <h3>
                                            {currentStepIdx === 1 && 'Pembayaran Sukses'}
                                            {currentStepIdx === 2 && 'Sedang Dimasak'}
                                            {currentStepIdx === 3 && 'Pesanan Siap!'}
                                            {currentStepIdx === 4 && 'Pesanan Selesai'}
                                        </h3>
                                        <p>
                                            {currentStepIdx === 1 && 'Pesanan Anda telah diterima dan masuk antrean dapur.'}
                                            {currentStepIdx === 2 && 'Chef kami sedang menyiapkan pesanan terbaik untuk Anda.'}
                                            {currentStepIdx === 3 && 'Pesanan Anda sudah matang dan siap untuk disajikan.'}
                                            {currentStepIdx === 4 && 'Terima kasih telah berkunjung. Selamat menikmati!'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`status-message ${status?.order_status}`}>
                                <p>{status?.message}</p>
                            </div>
                        )}

                        {/* Order Items List */}
                        {status?.items && status.items.length > 0 && (
                            <div className="status-items-list" style={{ marginTop: '24px', textAlign: 'left' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: '#444' }}>Detail Pesanan</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {status.items.map(item => (
                                        <div key={item.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px',
                                            background: '#fcfcfc',
                                            borderRadius: '10px',
                                            border: '1px solid #f0f0f0'
                                        }}>
                                            {item.image && (
                                                <img
                                                    src={item.image}
                                                    alt={item.product_name}
                                                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }}
                                                />
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.product_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{item.quantity}x @ {formatRp(Number(item.price))}</div>
                                            </div>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--menu-primary)' }}>
                                                {formatRp(Number(item.price) * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Order info summary */}
                        <div className="status-order-info" style={{
                            background: 'white',
                            padding: '16px',
                            borderRadius: '12px',
                            marginTop: '20px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span style={{ color: '#666' }}>No. Pesanan:</span>
                                <span style={{ fontWeight: 'bold' }}>{status?.invoice_number}</span>
                            </div>
                            {status?.gateway_invoice_id && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                    <span style={{ color: '#666' }}>ID Bayar:</span>
                                    <span style={{ fontSize: '12px', color: '#888' }}>{status?.gateway_invoice_id}</span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #eee' }}>
                                <span style={{ fontWeight: 'bold' }}>Total:</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                    {formatRp(status?.final_amount || parseFloat(status?.grand_total || '0'))}
                                </span>
                            </div>
                        </div>

                        <button
                            className="menu-cat-btn"
                            style={{ margin: '24px auto', display: 'block' }}
                            onClick={() => { setLoading(true); fetchStatus(); }}
                        >
                            🔄 Perbarui Status
                        </button>

                        <div style={{ height: '40px' }} />
                    </>
                )}
            </main>
        </div>
    );
}
