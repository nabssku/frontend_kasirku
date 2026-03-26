import { useState, useRef, useEffect } from 'react';

interface OtpInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    disabled?: boolean;
}

export function OtpInput({ value, onChange, onComplete, disabled }: OtpInputProps) {
    const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Sync parent value to internal state if changed externally
        if (value.length === 6) {
            setOtp(value.split(''));
        }
    }, [value]);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value.slice(-1);
        setOtp(newOtp);
        onChange(newOtp.join(''));

        // Focus next input
        if (element.value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if complete
        if (newOtp.join('').length === 6 && onComplete) {
            onComplete(newOtp.join(''));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 6);
        if (isNaN(Number(data))) return;

        const newOtp = data.split('').concat(new Array(6 - data.length).fill(''));
        setOtp(newOtp);
        onChange(newOtp.join(''));
        
        // Focus the last filled or next empty
        const nextIndex = data.length < 6 ? data.length : 5;
        inputRefs.current[nextIndex]?.focus();
        
        if (data.length === 6 && onComplete) {
            onComplete(data);
        }
    };

    return (
        <div className="flex justify-between gap-2">
            {otp.map((data, index) => (
                <input
                    key={index}
                    type="text"
                    maxLength={1}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    value={data}
                    disabled={disabled}
                    onChange={(e) => handleChange(e.target as HTMLInputElement, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-indigo-600 focus:ring-0 outline-none bg-slate-50 border-slate-200 transition-all disabled:opacity-50"
                />
            ))}
        </div>
    );
}
