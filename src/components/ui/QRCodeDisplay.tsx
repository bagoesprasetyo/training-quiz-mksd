import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  bgColor?: string;
  fgColor?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 180,
  className = '',
  bgColor = '#FFFFFF',
  fgColor = '#0000FF',
}) => {
  return (
    <div className={`p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-soft inline-flex items-center justify-center ${className}`}>
      <QRCodeSVG
        value={value}
        size={size}
        bgColor={bgColor}
        fgColor={fgColor}
        level="H"
        includeMargin={false}
      />
    </div>
  );
};
