import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../lib/axios';
import './menu.css';

interface OrderStatus {
    session_status: string;
    order_status: string | null;
    kitchen_status: string | null;
    invoice_number: string | null;
    grand_total: number | null;
    message: string;
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

    const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === status?.order_status);
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

                        {/* Message */}
                        <div className={`status-message ${status?.order_status}`}>
                            <p>{status?.message}</p>
                        </div>

                        <button
                            className="menu-cat-btn"
                            style={{ margin: '24px auto', display: 'block' }}
                            onClick={() => { setLoading(true); fetchStatus(); }}
                        >
                            🔄 Perbarui Status
                        </button>

                        {/* Ready highlight */}
                        {status?.order_status === 'ready' && (
                            <div className="status-ready-banner">
                                🍽️ Pesanan Anda SIAP! Silakan tunggu sajian dari kami.
                            </div>
                        )}

                        {status?.order_status === 'completed' && (
                            <div className="status-completed-banner">
                                🎉 Terima kasih sudah memesan! Selamat menikmati.
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
