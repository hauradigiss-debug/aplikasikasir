import React from 'react';
import { usePrinter } from '../context/PrinterContext';

interface PrinterStatusPillProps {
  variant?: 'compact' | 'badge' | 'sidebar';
  className?: string;
}

export const PrinterStatusPill: React.FC<PrinterStatusPillProps> = ({
  variant = 'badge',
  className = '',
}) => {
  const { status, device, openPrinterModal, isPrinting } = usePrinter();

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting' || status === 'reconnecting';
  const isError = status === 'error';

  const getStatusColor = () => {
    if (isConnected) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800';
    if (isConnecting) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800';
    if (isError) return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/70 border-red-200 dark:border-red-800';
    return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  };

  const getDotColor = () => {
    if (isConnected) return 'bg-emerald-500 animate-pulse';
    if (isConnecting) return 'bg-amber-500 animate-ping';
    if (isError) return 'bg-red-500';
    return 'bg-slate-400';
  };

  const getLabel = () => {
    if (isPrinting) return 'Mencetak...';
    if (isConnected) return device?.name || 'BT Printer Terhubung';
    if (status === 'connecting') return 'Menghubungkan BT...';
    if (status === 'reconnecting') return 'Reconnecting...';
    if (isError) return 'BT Error / Terputus';
    return 'Mini Printer BT';
  };

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={openPrinterModal}
        title={getLabel()}
        className={`relative p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${getStatusColor()} ${className}`}
        aria-label="Status Mini Printer Bluetooth"
      >
        <span className="material-symbols-outlined text-[19px]">print</span>
        <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${getDotColor()}`} />
      </button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div
        onClick={openPrinterModal}
        className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:shadow-xs group ${getStatusColor()} ${className}`}
        title="Klik untuk kelola koneksi Printer Mini Bluetooth"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-lg shrink-0">print</span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold truncate leading-tight">
                {getLabel()}
              </p>
              <p className="text-[10px] opacity-80 truncate">
                {isConnected ? 'ESC/POS 58/80mm Aktif' : 'Klik untuk deteksi & hubungkan'}
              </p>
            </div>
          </div>
          <span className={`w-2 h-2 rounded-full shrink-0 ml-1.5 ${getDotColor()}`} />
        </div>
      </div>
    );
  }

  // Default 'badge'
  return (
    <button
      type="button"
      onClick={openPrinterModal}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer hover:opacity-90 active:scale-95 shadow-2xs ${getStatusColor()} ${className}`}
      title="Kelola Mini Printer Bluetooth"
    >
      <span className="material-symbols-outlined text-[15px]">print</span>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      <span className="truncate max-w-[130px] sm:max-w-[170px]">{getLabel()}</span>
    </button>
  );
};
