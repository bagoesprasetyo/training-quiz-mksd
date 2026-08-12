import React, { useRef, useState, useEffect } from 'react';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  isLoading?: boolean;
}

export const PinInput: React.FC<PinInputProps> = ({
  length = 6,
  onComplete,
  isLoading = false,
}) => {
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newPin = [...pin];
    // Handle paste of full PIN
    if (value.length > 1) {
      const pastedPin = value.slice(0, length).split('');
      for (let i = 0; i < length; i++) {
        newPin[i] = pastedPin[i] || '';
      }
      setPin(newPin);
      if (newPin.every((digit) => digit !== '')) {
        onComplete(newPin.join(''));
      } else {
        const nextEmpty = newPin.findIndex((digit) => digit === '');
        if (nextEmpty !== -1) inputRefs.current[nextEmpty]?.focus();
      }
      return;
    }

    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value !== '' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger complete if all digits entered
    if (newPin.every((digit) => digit !== '')) {
      onComplete(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (pin[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center items-center my-4">
      {pin.map((digit, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={digit}
          disabled={isLoading}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className={`
            w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-2xl border-2 
            transition-all duration-200 focus:outline-none shadow-sm
            ${digit 
              ? 'border-[#0000FF] bg-blue-50/50 text-[#0000FF]' 
              : 'border-slate-200 bg-white text-slate-800'
            }
            focus:border-[#0000FF] focus:ring-4 focus:ring-blue-500/20 focus:scale-105
          `}
        />
      ))}
    </div>
  );
};
