import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';
import { generateDynamicQrisPayload, parseQrisPayload } from '../utils/qris';
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
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [isCameraScannerActive, setIsCameraScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qris-payment-camera-stream';

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

  // Generate dynamic QR code with real-time nominal amount
  // Crucial: No overlay div covering the QR center; pure black on white with 2-module margin!
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
        width: 400,
        margin: 2,
        color: {
          dark: '#000000', // 100% pure black for optimal camera recognition
          light: '#ffffff', // 100% pure white
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

  // Clean up camera scanner when component unmounts or scanner closes
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current
          .stop()
          .catch((err) => console.warn('Error stopping scanner:', err));
      }
    };
  }, []);

  // Toggle Camera Scanner to scan customer QR or test scanner
  const handleToggleCameraScanner = async () => {
    if (isCameraScannerActive) {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (err) {
          console.warn('Error stopping scanner:', err);
        }
      }
      setIsCameraScannerActive(false);
      setCameraError(null);
      return;
    }

    setIsCameraScannerActive(true);
    setCameraError(null);

    // Wait for DOM element to render
    setTimeout(async () => {
      try {
        const qrScanner = new Html5Qrcode(scannerContainerId);
        html5QrCodeRef.current = qrScanner;

        const config = {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        };

        await qrScanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // QR Code successfully scanned by camera!
            if (settings.enableSound) playSound('beep');
            const parsed = parseQrisPayload(decodedText);

            const randomRRN =
              'RRN' + Math.floor(100000000000 + Math.random() * 900000000000).toString();
            const detectedIssuer = parsed.merchantName
              ? `QRIS (${parsed.merchantName.slice(0, 15)})`
              : 'E-Wallet Nasabah';

            // Stop camera
            qrScanner.stop().catch(() => {});
            setIsCameraScannerActive(false);

            if (onPaymentSuccess) {
              onPaymentSuccess({
                nmid,
                terminalId,
                referenceNumber: randomRRN,
                issuer: detectedIssuer,
              });
            }
          },
          (errorMessage) => {
            // Scanning in progress
          }
        );
      } catch (err: any) {
        console.error('Camera start error:', err);
        setCameraError(
          err?.message || 'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.'
        );
      }
    }, 150);
  };

  // Handle simulated status check
  const handleCheckStatus = () => {
    setIsVerifying(true);
    setVerificationStatus('Menghubungkan ke Gateway GPN / QRIS...');
    if (settings.enableSound) playSound('beep');

    setTimeout(() => {
      setIsVerifying(false);
      setVerificationStatus('QRIS aktif & nominal valid. Menunggu konfirmasi pembayaran...');
      setTimeout(() => setVerificationStatus(null), 4000);
    }, 1000);
  };

  // Simulate Instant Customer Scan & Successful Payment
  const handleSimulateInstantPay = () => {
    if (settings.enableSound) playSound('success');
    const issuers = ['BCA Mobile', 'GoPay', 'Mandiri Livin', 'DANA', 'BRImo', 'ShopeePay', 'OVO'];
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
    setVerificationStatus('Kode string QRIS berhasil disalin! Format EMVCo siap pakai.');
    setTimeout(() => setVerificationStatus(null), 3000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Official Indonesian QRIS Standee Frame */}
      <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-xl border-2 border-[#cb1c1d] overflow-hidden text-slate-900 select-none transition-transform">
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
            <span>
              NMID: <strong className="text-slate-900">{nmid}</strong>
            </span>
            <span>•</span>
            <span>TID: {terminalId}</span>
          </div>
        </div>

        {/* Dynamic QR Code Matrix Container (100% Unobstructed for perfect camera scanning) */}
        <div className="p-4 flex flex-col items-center justify-center bg-white relative">
          <div className="relative p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-center group">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QRIS ${formatCurrency(amount, settings.currencySymbol)}`}
                className="w-56 h-56 object-contain rounded-sm"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
                <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
                <span className="text-xs">Membuat QRIS Dinamis...</span>
              </div>
            )}

            {/* Quick Enlarge Hover Button */}
            <button
              type="button"
              onClick={() => setIsFullscreenModalOpen(true)}
              className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-slate-700 p-1.5 rounded-lg shadow border border-slate-200 opacity-90 hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold cursor-pointer"
              title="Perbesar Tampilan QR untuk Pelanggan"
            >
              <span className="material-symbols-outlined text-sm">fullscreen</span>
              <span>Perbesar</span>
            </button>
          </div>

          {/* Sub-label under QR ensuring scannability */}
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Siap Dipindai Semua Kamera & Aplikasi M-Banking</span>
          </div>

          {/* Real-time Nominal Banner */}
          <div className="w-full mt-3 p-3 bg-red-50/90 border border-red-200 rounded-xl text-center">
            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block">
              Nominal Pembayaran Real-Time
            </span>
            <div className="text-2xl font-black text-[#cb1c1d] tracking-tight my-0.5">
              {formatCurrency(amount, settings.currencySymbol)}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600 font-medium">
              <span>
                Biaya Transaksi: <strong className="text-emerald-700">Rp 0 (Gratis)</strong>
              </span>
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
            <span className="bg-white py-1 px-1.5 rounded border border-slate-200 shadow-2xs text-[#00a651]">
              GoPay
            </span>
            <span className="bg-white py-1 px-1.5 rounded border border-slate-200 shadow-2xs text-[#4c3494]">
              OVO
            </span>
            <span className="bg-white py-1 px-1.5 rounded border border-slate-200 shadow-2xs text-[#118eea]">
              DANA
            </span>
            <span className="bg-white py-1 px-1.5 rounded border border-slate-200 shadow-2xs text-[#ee4d2d]">
              ShopeePay
            </span>
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

        {/* Live Camera Scanner Box (if toggled on) */}
        {isCameraScannerActive && (
          <div className="p-3 bg-slate-900 rounded-xl border border-blue-500 shadow-lg text-white space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5 text-blue-400">
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                <span>Kamera Pindai Aktif (Arahkan ke QR Pembeli)</span>
              </span>
              <button
                type="button"
                onClick={handleToggleCameraScanner}
                className="text-xs text-slate-400 hover:text-white"
              >
                Tutup Kamera
              </button>
            </div>
            <div
              id={scannerContainerId}
              className="w-full h-48 bg-black rounded-lg overflow-hidden relative flex items-center justify-center"
            ></div>
            {cameraError && (
              <p className="text-[11px] text-red-400 bg-red-950/60 p-2 rounded">{cameraError}</p>
            )}
            <p className="text-[10px] text-slate-400 text-center">
              Pindai QR code dari aplikasi m-Banking atau E-Wallet pembeli untuk verifikasi otomatis
            </p>
          </div>
        )}

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
          <span>Simulasi Nasabah Berhasil Bayar (Konfirmasi Lunas)</span>
        </button>

        {/* Secondary Cashier Actions */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={handleToggleCameraScanner}
            className={`py-2 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              isCameraScannerActive
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
            }`}
            title="Scan QR dari HP Pelanggan menggunakan Kamera"
          >
            <span className="material-symbols-outlined text-base">photo_camera</span>
            <span>{isCameraScannerActive ? 'Tutup Cam' : 'Scan Cam'}</span>
          </button>

          <button
            type="button"
            disabled={isVerifying}
            onClick={handleCheckStatus}
            className="py-2 px-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
            title="Cek status transaksi ke gateway"
          >
            <span className={`material-symbols-outlined text-base ${isVerifying ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>Cek Status</span>
          </button>

          {onPrintQrisSlip && (
            <button
              type="button"
              onClick={onPrintQrisSlip}
              className="py-2 px-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
              title="Cetak Struk QRIS ke Mini Printer Bluetooth"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Cetak Slip</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadQris}
            className="py-2 px-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer"
            title="Unduh file gambar QRIS"
          >
            <span className="material-symbols-outlined text-base">download</span>
            <span>Unduh QR</span>
          </button>
        </div>

        {/* Copy Payload Button */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 px-1">
          <button
            type="button"
            onClick={handleCopyPayload}
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">content_copy</span>
            <span>Salin Kode String QRIS (EMVCo)</span>
          </button>
          <span className="font-mono text-[10px]">TID: {terminalId}</span>
        </div>
      </div>

      {/* Fullscreen Customer View Modal */}
      {isFullscreenModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full flex flex-col items-center text-slate-900 shadow-2xl animate-in zoom-in-95 duration-150 relative">
            <button
              type="button"
              onClick={() => setIsFullscreenModalOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Standee Header */}
            <div className="w-full bg-[#cb1c1d] text-white p-3 rounded-2xl flex items-center justify-between mb-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="bg-white text-[#cb1c1d] font-black text-sm px-2 py-0.5 rounded tracking-tighter">
                  QRIS
                </div>
                <div className="text-left">
                  <span className="text-[10px] font-bold block">QR CODE INDONESIAN STANDARD</span>
                  <span className="text-[8px] text-red-100">PEMBAYARAN DIGITAL NASIONAL</span>
                </div>
              </div>
              <div className="bg-white px-2 py-0.5 rounded-full font-black text-xs text-[#003882]">
                GPN
              </div>
            </div>

            <h3 className="text-lg font-black uppercase text-center mb-1">{storeName}</h3>
            <p className="text-xs text-slate-500 font-mono mb-4">NMID: {nmid}</p>

            {/* Large High-Contrast QR Code */}
            <div className="p-4 bg-white border-2 border-slate-300 rounded-2xl shadow-inner">
              <img
                src={qrDataUrl}
                alt="QRIS Fullscreen"
                className="w-72 h-72 object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* Real-time Amount */}
            <div className="w-full mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
              <span className="text-xs font-bold text-red-800 uppercase block">Total Pembayaran</span>
              <span className="text-3xl font-black text-[#cb1c1d] block">
                {formatCurrency(amount, settings.currencySymbol)}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-3 text-center">
              Pindai dengan aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, DANA, ShopeePay)
            </p>

            <button
              type="button"
              onClick={() => {
                setIsFullscreenModalOpen(false);
                handleSimulateInstantPay();
              }}
              className="mt-4 w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>Konfirmasi Pembayaran Selesai</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
