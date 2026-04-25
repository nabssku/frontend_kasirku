import React, { useState, useEffect } from 'react';
import { Delete, X } from 'lucide-react';

interface PinPadProps {
    length?: number;
    onComplete: (pin: string) => void;
    onCancel?: () => void;
    title?: string;
    description?: string;
    error?: string;
}

export const PinPad: React.FC<PinPadProps> = ({
    length = 4,
    onComplete,
    onCancel,
    title = "Masukkan PIN",
    description = "Masukkan PIN keamanan Anda",
    error
}) => {
    const [pin, setPin] = useState<string>('');

    const handleNumberClick = (num: number) => {
        if (pin.length < length) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === length) {
                onComplete(newPin);
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
    };

    const handleClear = () => {
        setPin('');
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') {
                handleNumberClick(parseInt(e.key));
            } else if (e.key === 'Backspace') {
                handleDelete();
            } else if (e.key === 'Escape' && onCancel) {
                onCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [pin]);

    return (
        <div className="flex flex-col items-center w-full max-w-sm mx-auto p-5 md:p-6 bg-white rounded-3xl shadow-xl border border-slate-100">
            {onCancel && (
                <button 
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
                >
                    <X size={20} />
                </button>
            )}

            <div className="text-center mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-1 md:mb-2">{title}</h3>
                <p className="text-slate-500 text-xs md:text-sm">{description}</p>
            </div>

            {/* PIN Dots */}
            <div className="flex gap-3 md:gap-4 mb-6 md:mb-10">
                {Array.from({ length }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                            i < pin.length
                                ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-md shadow-indigo-200'
                                : 'bg-slate-100 border-slate-200'
                        } ${error && pin.length === length ? 'animate-shake border-red-500 bg-red-500' : ''}`}
                    />
                ))}
            </div>

            {error && (
                <p className="text-red-500 text-sm mb-4 animate-fade-in text-center font-medium">
                    {error}
                </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handleNumberClick(num)}
                        className="h-16 rounded-2xl bg-slate-50 text-2xl font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all duration-100 flex items-center justify-center border border-transparent hover:border-indigo-100"
                    >
                        {num}
                    </button>
                ))}
                <button
                    onClick={handleClear}
                    className="h-16 rounded-2xl bg-slate-50 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all duration-100 flex items-center justify-center border border-transparent"
                >
                    CLEAR
                </button>
                <button
                    onClick={() => handleNumberClick(0)}
                    className="h-16 rounded-2xl bg-slate-50 text-2xl font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all duration-100 flex items-center justify-center border border-transparent hover:border-indigo-100"
                >
                    0
                </button>
                <button
                    onClick={handleDelete}
                    className="h-16 rounded-2xl bg-slate-50 text-slate-700 hover:bg-orange-50 hover:text-orange-600 active:scale-95 transition-all duration-100 flex items-center justify-center border border-transparent"
                >
                    <Delete size={24} />
                </button>
            </div>
        </div>
    );
};
