import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product, StoreSettings } from '../types';
import { formatCurrency, playSound } from '../utils';
import { BarcodeRenderer } from './BarcodeRenderer';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings: StoreSettings;
  onScanProduct: (product: Product) => void;
}

interface ScannedHistoryItem {
  id: string;
  product: Product;
  timestamp: string;
  count: number;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  settings,
  onScanProduct,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [recentScans, setRecentScans] = useState<ScannedHistoryItem[]>([]);
  const [lastScannedFeedback, setLastScannedFeedback] = useState<{ success: boolean; message: string; sub?: string } | null>(null);
  const [showSampleBarcodes, setShowSampleBarcodes] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const manualInputRef = useRef<HTMLInputElement | null>(null);

  // Match scanned text to a product in the catalog
  const matchProduct = (code: string): Product | undefined => {
    const cleanCode = code.trim().toLowerCase();
    if (!cleanCode) return undefined;

    return products.find((p) => {
      const matchSku = p.sku && p.sku.toLowerCase() === cleanCode;
      const matchBarcode = p.barcode && p.barcode.toLowerCase() === cleanCode;
      const matchId = p.id && p.id.toLowerCase() === cleanCode;
      return matchSku || matchBarcode || matchId;
    });
  };

  // Process a scanned or typed barcode
  const handleProcessCode = (scannedText: string) => {
    const now = Date.now();
    const cleanText = scannedText.trim();
    if (!cleanText) return;

    // Cooldown logic: avoid duplicate scans of the SAME code within 1300ms
    if (lastScannedCodeRef.current === cleanText && now - lastScannedTimeRef.current < 1300) {
      return;
    }

    lastScannedCodeRef.current = cleanText;
    lastScannedTimeRef.current = now;

    const matched = matchProduct(cleanText);

    if (matched) {
      if (settings.enableSound) playSound('beep');
      try {
        if ('vibrate' in navigator) navigator.vibrate?.([40, 20, 40]);
      } catch {
        // ignore
      }

      onScanProduct(matched);

      setLastScannedFeedback({
        success: true,
        message: matched.name,
        sub: `${matched.sku} • ${formatCurrency(matched.price, settings.currencySymbol)} (Ditambahkan ke Keranjang)`,
      });

      setRecentScans((prev) => {
        const existingIdx = prev.findIndex((item) => item.product.id === matched.id);
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            count: updated[existingIdx].count + 1,
            timestamp: timeStr,
          };
          return updated;
        }

        return [
          {
            id: `scan-${Date.now()}`,
            product: matched,
            timestamp: timeStr,
            count: 1,
          },
          ...prev.slice(0, 14),
        ];
      });
    } else {
      if (settings.enableSound) playSound('error');
      setLastScannedFeedback({
        success: false,
        message: `Barcode "${cleanText}" Tidak Ditemukan`,
        sub: 'Pastikan SKU atau kode batang sesuai dengan inventaris barang.',
      });
    }
  };

  // Start Camera Scanning
  const startCamera = async (cameraId?: string) => {
    setCameraError(null);
    const elementId = 'barcode-scanner-viewport';

    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }

      const html5QrCode = new Html5Qrcode(elementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.ITF,
        ],
        verbose: false,
      });

      html5QrCodeRef.current = html5QrCode;

      // Get cameras if not loaded yet
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setAvailableCameras(devices.map((d) => ({ id: d.id, label: d.label || `Kamera ${d.id.slice(0, 5)}` })));
      }

      const targetCamera = cameraId || selectedCameraId || (devices && devices.length > 0 ? devices[0].id : { facingMode: 'environment' });

      await html5QrCode.start(
        targetCamera,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.85),
              height: Math.floor(minEdge * 0.55),
            };
          },
          aspectRatio: 1.333,
        },
        (decodedText) => {
          handleProcessCode(decodedText);
        },
        () => {
          // ignore frame scan misses
        }
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera scanner initialization error:', err);
      setIsCameraActive(false);
      setCameraError(
        err?.message?.includes('Permission')
          ? 'Izin kamera ditolak. Silakan izinkan akses kamera di peramban atau gunakan scanner USB / input manual.'
          : 'Kamera tidak dapat diakses atau sedang digunakan oleh aplikasi lain. Anda tetap dapat menggunakan input manual atau scanner USB.'
      );
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.warn('Error stopping camera:', err);
    } finally {
      setIsCameraActive(false);
    }
  };

  // Toggle Camera Flash/Torch if supported
  const toggleFlash = async () => {
    try {
      if (html5QrCodeRef.current && isCameraActive) {
        const next = !isFlashOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: next } as any],
        });
        setIsFlashOn(next);
      }
    } catch {
      // torch not supported on this device/browser
    }
  };

  // Handle open / close lifecycle
  useEffect(() => {
    if (isOpen) {
      // Focus manual input or start camera
      startCamera();
      setTimeout(() => {
        manualInputRef.current?.focus();
      }, 300);
    } else {
      stopCamera();
      setLastScannedFeedback(null);
      setManualCode('');
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessCode(manualCode);
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs select-none"
    >
      <div
        id="barcode-scanner-modal-card"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00236f] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-lg">barcode_scanner</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#0b1c30] flex items-center gap-2">
                Scanner Barcode & SKU Kasir
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Siap Scan
                </span>
              </h2>
              <p className="text-[11px] text-[#5a6072]">
                Arahkan barcode ke kamera, gunakan scanner USB handheld, atau ketik SKU produk.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Tutup Modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Quick Manual / USB Scanner Input */}
          <form onSubmit={handleManualSubmit} className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">
                  qr_code
                </span>
                <input
                  ref={manualInputRef}
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Ketik atau scan barcode (e.g. N-MOL-001) lalu tekan Enter..."
                  className="w-full pl-9 pr-3 h-10 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00236f] focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-4 h-10 bg-[#00236f] hover:bg-[#1a388b] disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
              >
                <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                <span>Tambah</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-slate-400">info</span>
              Scanner fisik USB / Bluetooth otomatis mendeteksi tanpa perlu klik tombol.
            </p>
          </form>

          {/* Feedback Banner */}
          {lastScannedFeedback && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                lastScannedFeedback.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    lastScannedFeedback.success ? 'bg-emerald-200 text-emerald-800' : 'bg-red-200 text-red-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {lastScannedFeedback.success ? 'check' : 'warning'}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs truncate">{lastScannedFeedback.message}</p>
                  {lastScannedFeedback.sub && (
                    <p className="text-[11px] opacity-90 truncate">{lastScannedFeedback.sub}</p>
                  )}
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/80 border border-slate-200/60 shrink-0">
                {lastScannedFeedback.success ? '+1 Item' : 'Tidak Cocok'}
              </span>
            </div>
          )}

          {/* Camera Viewport Section */}
          <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-300 shadow-inner flex flex-col items-center justify-center min-h-[240px] sm:min-h-[280px]">
            {/* Viewport element for html5-qrcode */}
            <div id="barcode-scanner-viewport" className="w-full h-full max-h-[340px] overflow-hidden" />

            {/* Viewfinder Target Overlay UI */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Visual reticle box */}
                <div className="relative w-64 h-36 sm:w-72 sm:h-44 border-2 border-emerald-400/80 rounded-xl shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
                  {/* Laser line animation */}
                  <div className="absolute left-1 right-1 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-[bounce_1.5s_infinite] top-1/2 -translate-y-1/2" />

                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400" />

                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-white/90 bg-slate-900/80 px-2 py-0.5 rounded whitespace-nowrap">
                    Posisikan Barcode di Tengah Kotak
                  </span>
                </div>
              </div>
            )}

            {/* Camera Error or Inactive Banner */}
            {!isCameraActive && (
              <div className="p-6 text-center text-slate-300 max-w-md">
                <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">videocam_off</span>
                <p className="text-xs font-semibold text-white mb-1">
                  {cameraError ? 'Kamera Tidak Tersedia' : 'Kamera Sedang Dinonaktifkan'}
                </p>
                <p className="text-[11px] text-slate-400 mb-3">
                  {cameraError || 'Anda dapat mengaktifkan kamera atau tetap memindai menggunakan scanner USB / pengetikan kode SKU di atas.'}
                </p>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Coba Sambungkan Kamera
                </button>
              </div>
            )}

            {/* Camera Control Overlay Bar */}
            {isCameraActive && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xs p-1 rounded-lg border border-slate-700/60 z-10">
                {availableCameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="bg-transparent text-[11px] text-white px-2 py-1 rounded focus:outline-none cursor-pointer"
                  >
                    {availableCameras.map((cam) => (
                      <option key={cam.id} value={cam.id} className="bg-slate-900 text-white">
                        {cam.label}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={toggleFlash}
                  title="Flashlight / Lampu Sorot"
                  className={`p-1.5 rounded transition-colors text-white ${
                    isFlashOn ? 'bg-amber-500 text-slate-950 font-bold' : 'hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{isFlashOn ? 'flash_on' : 'flash_off'}</span>
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  title="Matikan Kamera"
                  className="p-1.5 rounded hover:bg-slate-800 text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">videocam_off</span>
                </button>
              </div>
            )}
          </div>

          {/* Toggle Sample Barcode Sheet for Testing */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#00236f]">receipt_long</span>
                  Lembar Barcode Sampel Produk
                </h3>
                <p className="text-[11px] text-slate-500">
                  Uji coba scan langsung dari layar atau klik tombol simulasi scan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSampleBarcodes(!showSampleBarcodes)}
                className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                {showSampleBarcodes ? 'Sembunyikan' : 'Buka Lembar Barcode'}
              </button>
            </div>

            {showSampleBarcodes && (
              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {products.slice(0, 10).map((prod) => (
                  <div
                    key={prod.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0b1c30] truncate">{prod.name}</p>
                      <p className="text-[11px] font-mono text-[#00236f]">{prod.sku}</p>
                      <p className="text-[11px] text-slate-500">{formatCurrency(prod.price, settings.currencySymbol)}</p>
                      <div className="mt-1">
                        <BarcodeRenderer value={prod.sku} height={28} width={1.2} fontSize={9} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleProcessCode(prod.sku)}
                      className="px-2.5 py-1.5 bg-[#00236f] hover:bg-[#1a388b] text-white text-[11px] font-bold rounded-lg shrink-0 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">touch_app</span>
                      Simulasi Scan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Scans Session Log */}
          {recentScans.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-600">history</span>
                  Item Terpindai Dalam Sesi Ini ({recentScans.reduce((sum, item) => sum + item.count, 0)})
                </span>
                <button
                  type="button"
                  onClick={() => setRecentScans([])}
                  className="text-[11px] text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Bersihkan Riwayat
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {recentScans.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[#00236f]/10 text-[#00236f] flex items-center justify-center font-bold text-[10px] shrink-0">
                        {item.count}x
                      </span>
                      <span className="font-semibold text-slate-800 truncate">{item.product.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 hidden sm:inline">{item.product.sku}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-[#00236f]">
                        {formatCurrency(item.product.price * item.count, settings.currencySymbol)}
                      </span>
                      <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-slate-400">keyboard</span>
            Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">ESC</kbd> untuk kembali ke kasir
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 h-9 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Selesai & Ke Keranjang
          </button>
        </div>
      </div>
    </div>
  );
};
