import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 1.6,
  height = 48,
  displayValue = true,
  fontSize = 12,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: format as any,
        width,
        height,
        displayValue,
        fontSize,
        font: 'JetBrains Mono, monospace',
        textMargin: 3,
        margin: 4,
        background: '#ffffff',
        lineColor: '#0b1c30',
      });
    } catch {
      // Fallback if format is not supported for custom string
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width,
          height,
          displayValue,
          fontSize,
          margin: 4,
        });
      } catch {
        // Silently handle invalid chars
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center bg-white p-1 rounded border border-slate-200 shadow-2xs ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
};
