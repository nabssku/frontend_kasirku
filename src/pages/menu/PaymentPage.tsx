import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/axios';
import './menu.css';

interface PaymentResponse {
    data: {
        final_amount: number;
        qris_converter: {
            converted_qris: string;
            original_qris: string;
        };
        invoice_id?: string;
        payment_url?: string;
    };
    success?: boolean;
    message?: string;
}

export default function PaymentPage() {
    const { sessionToken } = useParams<{ sessionToken: string }>();
    const navigate = useNavigate();

    const [paymentData, setPaymentData] = useState<{
        payment_url: string;
        invoice_id: string;
        invoice_number: string;
        grand_total: number;
        payment_response: PaymentResponse;
        expires_at: string;
    } | null>(null);

    const [timeLeft, setTimeLeft] = useState('');
    const [checking, setChecking] = useState(false);
    const [checkMessage, setCheckMessage] = useState('');
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    const pollStatus = async (isManual = false) => {
        if (!sessionToken) return;
        if (isManual) {
            setChecking(true);
            setCheckMessage('Memeriksa status pembayaran...');
        }
        try {
            const { data } = await api.get(`/public/self-order/${sessionToken}/status`);
            const orderStatus = data.data?.order_status;

            // Navigate away from payment page if payment is no longer pending
            const doneStatuses = ['paid', 'preparing', 'ready', 'completed', 'cancelled'];
            if (orderStatus && doneStatuses.includes(orderStatus)) {
                sessionStorage.removeItem('self_order_payment');
                navigate(`/menu/order/${sessionToken}/status`, { replace: true });
                return;
            }

            if (isManual) {
                setCheckMessage('Pembayaran belum terdeteksi. Coba lagi setelah beberapa saat.');
            }
        } catch (e) {
            console.error('Polling error', e);
            if (isManual) {
                setCheckMessage('Gagal memeriksa status. Silakan coba lagi.');
            }
        } finally {
            if (isManual) {
                setChecking(false);
            }
        }
    };

    // Auto-poll every 5 seconds
    useEffect(() => {
        if (!sessionToken) return;
        pollingRef.current = setInterval(() => pollStatus(false), 5000);
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [sessionToken]);

    const handleManualCheck = () => {
        // Clear message from previous check
        setCheckMessage('');
        pollStatus(true);
    };

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
                            <p className="payment-amount">{formatRp(paymentData.payment_response.data.final_amount)}</p>

                            {timeLeft && (
                                <div className={`payment-timer ${timeLeft === 'Waktu habis' ? 'expired' : ''}`}>
                                    ⏱ Selesaikan dalam: <strong>{timeLeft}</strong>
                                </div>
                            )}

                            <p className="payment-hint">Scan QR di bawah atau ketuk tombol bayar</p>

                            {/* QRIS via BayarGG payment URL */}
                            {/* <a
                                href={paymentData.payment_url}
                                target="_top"
                                className="menu-add-btn payment-pay-btn"
                                rel="noreferrer"
                            >
                                Bayar Sekarang dengan QRIS
                            </a> */}

                            <p className="payment-or">— atau —</p>

                            <div className="payment-qr-wrap">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentData.payment_response.data.qris_converter.converted_qris)}`}
                                    alt="QR Pembayaran"
                                    className="payment-qr-img"
                                />
                            </div>
                        </div>

                        {/* Manual check button */}
                        <div className="payment-check-section">
                            <button
                                className="payment-check-btn"
                                onClick={handleManualCheck}
                                disabled={checking}
                            >
                                {checking ? (
                                    <>
                                        <span className="payment-check-spinner" /> Memeriksa...
                                    </>
                                ) : (
                                    '✅ Sudah Bayar? Cek Sekarang'
                                )}
                            </button>

                            {checkMessage && (
                                <p className={`payment-check-message ${checkMessage.includes('belum') || checkMessage.includes('Gagal') ? 'warn' : ''}`}>
                                    {checkMessage}
                                </p>
                            )}
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
