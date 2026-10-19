import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { generateDynamicQrisPayload } from '../utils/qris';
import { formatCurrency, playSound } from '../utils';
import { StoreSettings } from '../types';

interface QrisDisplayCardProps {
  amount: number;
  settings: StoreSettings;
  invoiceNumber?: string;
  customerName?: string;
  onPaymentSuccess?: (qrisData: { nmid: string; terminalId: string; referenceNumber: string; issuer: string }) => void;
  onPrintQrisSlip?: () => void;
  compact?: boolean;
}

export const QrisDisplayCard: React.FC<QrisDisplayCardProps> = ({
  amount,
  settings,
  invoiceNumber = 'POS-' + Date.now().toString().slice(-6),
  customerName,
  onPaymentSuccess,
  onPrintQrisSlip,
  compact = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrisPayloadString, setQrisPayloadString] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes countdown
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const cardRef = useRef<HTMLDivElement>(null);

  const nmid = settings.qrisNmid || 'ID1020038291039';
  const terminalId = settings.qrisTerminalId || 'A01';
  const storeName = settings.storeName || 'STATIONERY POS HUB';

  // Real-time ticking clock for "Dicetak: DD/MM/YYYY HH:mm:ss WIB"
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTimeStr(`${day}/${month}/${year} ${hours}:${minutes}:${seconds} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 5-minute Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate dynamic QR code whenever amount, storeName, or invoice changes
  useEffect(() => {
    try {
      const payload = generateDynamicQrisPayload({
        merchantName: storeName,
        nmid: nmid,
        terminalId: terminalId,
        amount: amount,
        invoiceNumber: invoiceNumber,
        city: 'JAKARTA',
      });

      setQrisPayloadString(payload);

      QRCode.toDataURL(payload, {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then((url) => {
          setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('Failed to generate QR Code:', err);
        });
    } catch (err) {
      console.error('Error generating QRIS payload:', err);
    }
  }, [amount, storeName, nmid, terminalId, invoiceNumber]);

  // Handle simulated status check
  const handleCheckStatus = () => {
    setIsVerifying(true);
    setVerificationStatus('Memverifikasi status transaksi ke jaringan QRIS / GPN...');
    if (settings.enableSound) playSound('beep');

    setTimeout(() => {
      setIsVerifying(false);
      setVerificationStatus('Menunggu pembayaran dari nasabah (Belum terdeteksi)');
      setTimeout(() => setVerificationStatus(null), 4000);
    }, 1200);
  };

  // Simulate Instant Customer Scan & Successful Payment
  const handleSimulateInstantPay = () => {
    if (settings.enableSound) playSound('success');
    const issuers = ['GoPay', 'BCA Mobile', 'Mandiri Livin', 'DANA', 'BRImo', 'ShopeePay', 'OVO'];
    const randomIssuer = issuers[Math.floor(Math.random() * issuers.length)];
    const randomRRN = 'RRN' + Math.floor(100000000000 + Math.random() * 900000000000).toString();

    if (onPaymentSuccess) {
      onPaymentSuccess({
        nmid,
        terminalId,
        referenceNumber: randomRRN,
        issuer: randomIssuer,
      });
    }
  };

  // Download QRIS Image
  const handleDownloadQris = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QRIS-${storeName.replace(/\s+/g, '_')}-${invoiceNumber}.png`;
    a.click();
  };

  // Copy payload string
  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrisPayloadString);
    setVerificationStatus('Kode payload string QRIS berhasil disalin ke clipboard!');
    setTimeout(() => setVerificationStatus(null), 3000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Official Indonesian QRIS Standee Frame */}
      <div
        ref={cardRef}
        className="w-full max-w-[360px] bg-white rounded-2xl shadow-xl border-2 border-[#cb1c1d] overflow-hidden text-slate-900 select-none transition-transform"
      >
        {/* Top Header Bar - QRIS Red */}
        <div className="bg-[#cb1c1d] px-4 py-3 flex items-center justify-between text-white relative shadow-sm">
          {/* QRIS Logo */}
          <div className="flex items-center gap-1.5">
            <div className="bg-white text-[#cb1c1d] font-black text-xs px-1.5 py-0.5 rounded tracking-tighter">
              QRIS
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-bold tracking-wider">QR CODE INDONESIAN STANDARD</span>
              <span className="text-[7px] text-red-100 font-medium">PEMBAYARAN DIGITAL NASIONAL</span>
            </div>
          </div>

          {/* GPN Official Logo */}
          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-full shadow-xs">
            {/* GPN Garuda arrow icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M4 12L12 4L10 12L4 12Z" fill="#cb1c1d" />
              <path d="M20 12L12 20L14 12L20 12Z" fill="#003882" />
              <circle cx="12" cy="12" r="2.5" fill="#f59e0b" />
            </svg>
            <span className="text-[10px] font-black text-[#003882] tracking-tighter">GPN</span>
          </div>
        </div>

        {/* Merchant Info Banner */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-center">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide line-clamp-1">
            {storeName}
          </h4>
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 font-mono mt-0.5">
            <span>NMID: <strong className="text-slate-900">{nmid}</strong></span>
            <span>•</span>
            <span>A01</span>
          </div>
        </div>

        {/* Dynamic QR Code Matrix Container */}
        <div className="p-4 flex flex-col items-center justify-center bg-white relative">
          <div className="relative p-2 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QRIS QR Code"
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
                <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
                <span className="text-xs">Membuat QRIS Dinamis...</span>
              </div>
            )}

            {/* Official QRIS Center Badge Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-1 rounded-md shadow-md border border-[#cb1c1d]/30 flex items-center justify-center">
              <span className="text-[11px] font-black tracking-tighter text-[#cb1c1d]">
                QRIS
              </span>
            </div>
          </div>

          {/* Real-time Nominal Banner */}
          <div className="w-full mt-3 p-3 bg-red-50/80 border border-red-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">
              Nominal Pembayaran Real-Time
            </span>
            <div className="text-2xl font-black text-[#cb1c1d] tracking-tight my-0.5">
              {formatCurrency(amount, settings.currencySymbol)}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600 font-medium">
              <span>Biaya Transaksi: <strong className="text-emerald-700">Rp 0 (Gratis)</strong></span>
            </div>
          </div>

          {/* Real-time Print Timestamp */}
          <div className="mt-2 text-center text-[10px] text-slate-500 font-mono">
            <span>Dicetak: {currentTimeStr}</span>
          </div>
        </div>

        {/* Indonesian Decorative Border & "SATU QRIS UNTUK SEMUA" */}
        <div className="bg-[#fef2f2] border-t border-red-200 p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div className="h-[1px] bg-red-300 flex-1"></div>
            <span className="text-[10px] font-black text-[#cb1c1d] tracking-wider uppercase">
              SATU QRIS UNTUK SEMUA
            </span>
            <div className="h-[1px] bg-red-300 flex-1"></div>
          </div>

          {/* E-Wallet & Bank Logos Matrix */}
          <div className="grid grid-cols-4 gap-1 pt-1 text-[9px] font-bold text-slate-600">
            <span className="bg-white py-1 px-1.5 rounded border border-slate-200 shadow-2xs">BCA</span>
            <span className="bg-white py-1 px-1.5 rounded border border-slate-200 shadow-2xs">Mandiri</span>
            <span className="bg-white py-1 px-1.5 rounded border border-slate-200 shadow-2xs">BRI</span>
            <span className="bg-white py-1 px-1.5 rounded border border-slate-200 shadow-2xs">BNI</span>
            <span className="bg-white py-1 px-1.5 rounded border border-slate-200 shadow-2xs text-[#00a651]">GoPay</span>
            <span className="bg-white py-1 px-1.5 rounded border border-slate-200 shadow-2xs text-[#4c3494]">OVO</span>
            <span className="bg-white py-1 px-1.5 rounded border border-slate-200 shadow-2xs text-[#118eea]">DANA</span>
            <span className="bg-white py-1 px-1.5 rounded border border-slate-200 shadow-2xs text-[#ee4d2d]">ShopeePay</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-1.5">
            Dapat dipindai oleh semua aplikasi m-Banking & E-Wallet berizin BI
          </p>
        </div>
      </div>

      {/* Real-time Status & Cashier Action Controls */}
      <div className="w-full max-w-[360px] mt-4 space-y-2.5">
        {/* Countdown Timer & Live Radar */}
        <div className="p-3 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="absolute w-5 h-5 rounded-full bg-emerald-400/40 animate-ping"></span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Menunggu Pembayaran...
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Pindai QR code sebelum waktu habis
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {timeFormatted}
            </span>
          </div>
        </div>

        {/* Status Verification Toast if clicked */}
        {verificationStatus && (
          <div className="p-2.5 text-xs rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-sm">info</span>
            <span>{verificationStatus}</span>
          </div>
        )}

        {/* Primary Cashier Simulation Button: Customer Scanned & Paid */}
        <button
          type="button"
          onClick={handleSimulateInstantPay}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>Simulasi Nasabah Berhasil Bayar</span>
        </button>

        {/* Secondary Cashier Actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isVerifying}
            onClick={handleCheckStatus}
            className="py-2 px-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-sm ${isVerifying ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Cek Status</span>
          </button>

          {onPrintQrisSlip && (
            <button
              type="button"
              onClick={onPrintQrisSlip}
              className="py-2 px-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
              title="Cetak Struk QRIS ke Mini Printer"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Cetak QRIS</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadQris}
            className="py-2 px-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Unduh QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
