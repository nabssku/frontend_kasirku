import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PinPadProps {
    length?: number;
    onComplete: (pin: string) => void;
    onCancel?: () => void;
    title?: string;
    description?: string;
    error?: string;
    variant?: 'default' | 'simple';
}

export const PinPad: React.FC<PinPadProps> = ({
    length = 4,
    onComplete,
    onCancel,
    title = "Masukkan PIN",
    description = "Masukkan PIN keamanan Anda",
    error,
    variant = 'default'
}) => {
    const [pin, setPin] = useState<string[]>(new Array(length).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Auto-focus first input on mount
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (value: string, index: number) => {
        if (!/^\d*$/.test(value)) return; // Only allow numbers

        const newPin = [...pin];
        // Only take the last character if multiple are entered (e.g. from mobile suggestions)
        const char = value.substring(value.length - 1);
        newPin[index] = char;
        setPin(newPin);

        // Move to next input if a digit was entered
        if (char && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if complete
        const finalPin = newPin.join('');
        if (finalPin.length === length) {
            onComplete(finalPin);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            if (!pin[index] && index > 0) {
                // Move to previous input and clear it
                const newPin = [...pin];
                newPin[index - 1] = '';
                setPin(newPin);
                inputRefs.current[index - 1]?.focus();
            } else {
                // Just clear current input
                const newPin = [...pin];
                newPin[index] = '';
                setPin(newPin);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, length);
        if (!/^\d+$/.test(data)) return;

        const newPin = [...pin];
        data.split('').forEach((char, i) => {
            if (i < length) newPin[i] = char;
        });
        setPin(newPin);

        // Focus the last filled input or the first empty one
        const nextIndex = Math.min(data.length, length - 1);
        inputRefs.current[nextIndex]?.focus();

        if (data.length === length) {
            onComplete(data);
        }
    };

    return (
        <motion.div 
            initial={variant === 'default' ? { opacity: 0, y: 20 } : { opacity: 1 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                flex flex-col items-center w-full mx-auto relative
                ${variant === 'default' 
                    ? 'max-w-[320px] p-8 bg-white rounded-2xl shadow-2xl border border-slate-100' 
                    : 'max-w-[300px] p-0'}
            `}
        >
            {onCancel && variant === 'default' && (
                <button 
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-50 transition-all active:scale-90 z-10"
                >
                    <X size={18} />
                </button>
            )}

            {variant === 'default' && (
                <div className="text-center mb-10 px-8">
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">{description}</p>
                </div>
            )}

            {/* OTP Boxes */}
            <div className={`flex gap-3 md:gap-4 ${variant === 'default' ? 'mb-10' : 'mb-8'}`}>
                {pin.map((digit, index) => (
                    <input
                        key={index}
                        ref={el => inputRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleChange(e.target.value, index)}
                        onKeyDown={e => handleKeyDown(e, index)}
                        onPaste={handlePaste}
                        className={`
                            w-12 h-16 md:w-14 md:h-20 text-center text-3xl font-black rounded-2xl border-2 transition-all outline-none
                            ${digit 
                                ? 'border-indigo-600 bg-indigo-50/30 text-indigo-700 shadow-lg shadow-indigo-100' 
                                : 'border-slate-100 bg-slate-50 text-slate-900 focus:border-indigo-300 focus:bg-white'}
                            ${error && pin.every(d => d !== '') ? 'animate-shake border-red-500 bg-red-50 text-red-600' : ''}
                        `}
                    />
                ))}
            </div>

            <AnimatePresence>
                {error && (
                    <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>


        </motion.div>
    );
};


