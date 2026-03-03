import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/axios';
import './menu.css';

export default function PaymentPage() {
    const { sessionToken } = useParams<{ sessionToken: string }>();
    const navigate = useNavigate();

    const [paymentData, setPaymentData] = useState<{
        payment_url: string;
        invoice_id: string;
        invoice_number: string;
        grand_total: number;
        expires_at: string;
    } | null>(null);

    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const stored = sessionStorage.getItem('self_order_payment');
        if (stored) {
            setPaymentData(JSON.parse(stored));
        } else {
            navigate(`/menu/table/${sessionToken}`, { replace: true });
        }
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!paymentData?.expires_at) return;
        const interval = setInterval(() => {
            const diff = new Date(paymentData.expires_at).getTime() - Date.now();
            if (diff <= 0) {
                clearInterval(interval);
                setTimeLeft('Waktu habis');
                navigate(`/menu/order/${sessionToken}/status`, { replace: true });
                return;
            }
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [paymentData]);

    // Poll status every 5 seconds
    useEffect(() => {
        if (!sessionToken) return;
        const interval = setInterval(async () => {
            try {
                const { data } = await api.get(`/public/self-order/${sessionToken}/status`);
                // Check order_status instead of status
                if (data.data.order_status !== 'pending_payment') {
                    navigate(`/menu/order/${sessionToken}/status`, { replace: true });
                }
            } catch (e) {
                console.error('Polling error', e);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [sessionToken]);

    const formatRp = (n: number) =>
        'Rp ' + new Intl.NumberFormat('id-ID').format(n);

    return (
        <div className="menu-root payment-root">
            <header className="menu-header">
                <h1>💳 Pembayaran</h1>
            </header>

            <main className="payment-main">
                {paymentData && (
                    <>
                        <div className="payment-card">
                            <p className="payment-invoice">#{paymentData.invoice_number}</p>
                            <p className="payment-amount">{formatRp(paymentData.grand_total)}</p>

                            {timeLeft && (
                                <div className={`payment-timer ${timeLeft === 'Waktu habis' ? 'expired' : ''}`}>
                                    ⏱ Selesaikan dalam: <strong>{timeLeft}</strong>
                                </div>
                            )}

                            <p className="payment-hint">Scan QR di bawah atau ketuk tombol bayar</p>

                            {/* QRIS via BayarGG payment URL */}
                            <a
                                href={paymentData.payment_url}
                                target="_top"
                                className="menu-add-btn payment-pay-btn"
                                rel="noreferrer"
                            >
                                Bayar Sekarang dengan QRIS
                            </a>

                            <p className="payment-or">— atau —</p>

                            <div className="payment-qr-wrap">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentData.payment_url)}`}
                                    alt="QR Pembayaran"
                                    className="payment-qr-img"
                                />
                            </div>
                        </div>

                        <div className="payment-info">
                            <div className="payment-info-dot" />
                            <p>Halaman ini akan otomatis berpindah setelah pembayaran berhasil.</p>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
