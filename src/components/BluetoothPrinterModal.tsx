import React, { useState } from 'react';
import { usePrinter } from '../context/PrinterContext';
import { StoreSettings } from '../types';

interface BluetoothPrinterModalProps {
  settings: StoreSettings;
}

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({ settings }) => {
  const {
    status,
    device,
    config,
    isSupported,
    isPrinting,
    errorMessage,
    virtualReceiptLogs,
    isPrinterModalOpen,
    closePrinterModal,
    connectPrinter,
    disconnectPrinter,
    printTestReceipt,
    openCashDrawer,
    feedPaper,
    cutPaper,
    updateConfig,
    clearLogs,
  } = usePrinter();

  const [activeTab, setActiveTab] = useState<'status' | 'commands' | 'logs'>('status');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isPrinterModalOpen) return null;

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleConnect = async () => {
    try {
      const ok = await connectPrinter();
      if (ok) {
        showNotice('Printer mini Bluetooth berhasil terhubung!');
      }
    } catch (err: any) {
      // error is handled in context
    }
  };

  const handleDisconnect = async () => {
    await disconnectPrinter();
    showNotice('Koneksi printer Bluetooth telah diputus.');
  };

  const handleTestPrint = async () => {
    const ok = await printTestReceipt(settings.storeName);
    if (ok) {
      showNotice('Perintah cetak struk uji coba terkirim via ESC/POS!');
    }
  };

  const handleKickDrawer = async () => {
    const ok = await openCashDrawer();
    if (ok) {
      showNotice('Sinyal buka laci kasir (RJ11 Kick) terkirim!');
    }
  };

  const handleFeed = async () => {
    const ok = await feedPaper(3);
    if (ok) {
      showNotice('Perintah feed 3 baris kertas terkirim.');
    }
  };

  const handleCut = async () => {
    const ok = await cutPaper();
    if (ok) {
      showNotice('Perintah potong kertas (cut) terkirim.');
    }
  };

  const isConnected = status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00236f] dark:bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">print</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#0b1c30] dark:text-slate-100 tracking-tight">
                  Koneksi Printer Mini & Perintah Bluetooth
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                    isConnected
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isConnected ? 'Terhubung' : 'Terputus'}
                </span>
              </div>
              <p className="text-xs text-[#5a6072] dark:text-slate-400">
                Deteksi otomatis printer thermal mini 58mm / 80mm dan kirim perintah ESC/POS global.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closePrinterModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Tutup Dialog"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-[#00236f] dark:border-blue-500 text-[#00236f] dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-base">bluetooth_searching</span>
            <span>Koneksi & Pengaturan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('commands')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'commands'
                ? 'border-[#00236f] dark:border-blue-500 text-[#00236f] dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-base">terminal</span>
            <span>Perintah ESC/POS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-[#00236f] dark:border-blue-500 text-[#00236f] dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-base">receipt</span>
            <span>Riwayat Struk ({virtualReceiptLogs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Action Notice Banner */}
          {actionNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
              <span className="font-semibold">{actionNotice}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/70 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-300 text-xs rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-base">error</span>
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => updateConfig({ virtualSimulationMode: true })}
                className="px-2.5 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-[11px] font-bold rounded-lg hover:underline shrink-0"
              >
                Gunakan Mode Simulasi
              </button>
            </div>
          )}

          {/* TAB 1: KONEKSI & PENGATURAN */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Primary Connection Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                        isConnected
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl">
                        {isConnected ? 'bluetooth_connected' : 'bluetooth'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-[#0b1c30] dark:text-slate-100">
                        {isConnected ? device?.name || 'Mini Printer Bluetooth' : 'Belum Ada Printer Terhubung'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isConnected
                          ? `GATT Server Aktif • Protokol SPP ESC/POS • Lebar ${config.paperWidth}`
                          : 'Klik tombol di bawah untuk mendeteksi perangkat mini printer terdekat.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isConnected ? (
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="px-4 py-2 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">bluetooth_disabled</span>
                        <span>Putuskan</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConnect}
                        disabled={status === 'connecting'}
                        className="px-4 py-2 bg-[#00236f] dark:bg-blue-600 hover:bg-[#1a388b] dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-base">bluetooth_searching</span>
                        <span>{status === 'connecting' ? 'Mencari...' : 'Cari & Hubungkan Printer'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {!isSupported && !config.virtualSimulationMode && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs rounded-xl flex items-start gap-2">
                    <span className="material-symbols-outlined text-amber-600 text-base shrink-0 mt-0.5">info</span>
                    <div>
                      <p className="font-bold">Web Bluetooth API tidak terdeteksi pada browser ini.</p>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        Gunakan browser Google Chrome / MS Edge di Desktop/Android. Anda juga dapat mengaktifkan <strong>Mode Simulasi</strong> untuk menguji struk dan perintah tanpa printer fisik.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Automation Toggles */}
              <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Otomatisasi & Deteksi Global
                </h4>

                {/* Toggle 1: Auto Reconnect */}
                <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                  <div className="pr-4">
                    <span className="block text-xs font-bold text-[#0b1c30] dark:text-slate-200">
                      Deteksi & Hubungkan Otomatis (Auto-Reconnect)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Otomatis memantau putusnya sinyal Bluetooth dan mencoba menghubungkan ulang tanpa prompt manual.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoReconnect}
                    onChange={(e) => updateConfig({ autoReconnect: e.target.checked })}
                    className="w-4 h-4 text-[#00236f] rounded focus:ring-[#00236f] cursor-pointer"
                  />
                </label>

                {/* Toggle 2: Auto Print on Checkout */}
                <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                  <div className="pr-4">
                    <span className="block text-xs font-bold text-[#0b1c30] dark:text-slate-200">
                      Cetak Struk Otomatis Saat Pembayaran Selesai
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Kasir tidak perlu menekan tombol cetak manual; struk langsung keluar saat transaksi berhasil.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoPrintOnCheckout}
                    onChange={(e) => updateConfig({ autoPrintOnCheckout: e.target.checked })}
                    className="w-4 h-4 text-[#00236f] rounded focus:ring-[#00236f] cursor-pointer"
                  />
                </label>

                {/* Toggle 3: Open Cash Drawer on Print */}
                <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                  <div className="pr-4">
                    <span className="block text-xs font-bold text-[#0b1c30] dark:text-slate-200">
                      Buka Laci Kasir Otomatis (RJ11 Kick Pulse)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Kirim pulsa sinyal ke laci kasir otomatis saat struk dicetak.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.openCashDrawerOnPrint}
                    onChange={(e) => updateConfig({ openCashDrawerOnPrint: e.target.checked })}
                    className="w-4 h-4 text-[#00236f] rounded focus:ring-[#00236f] cursor-pointer"
                  />
                </label>

                {/* Toggle 4: Simulation mode */}
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 cursor-pointer">
                  <div className="pr-4">
                    <span className="block text-xs font-bold text-[#00236f] dark:text-blue-300">
                      Mode Simulasi / Virtual Printer
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Gunakan printer virtual jika sedang tidak membawa printer fisik atau untuk uji coba format struk.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.virtualSimulationMode}
                    onChange={(e) => updateConfig({ virtualSimulationMode: e.target.checked })}
                    className="w-4 h-4 text-[#00236f] rounded focus:ring-[#00236f] cursor-pointer"
                  />
                </label>
              </div>

              {/* Paper Width Selection */}
              <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  Ukuran Lebar Kertas Thermal
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateConfig({ paperWidth: '58mm' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      config.paperWidth === '58mm'
                        ? 'border-[#00236f] dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-[#00236f] dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">58mm (Standar Mini)</span>
                      {config.paperWidth === '58mm' && (
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-75 font-normal">
                      32 Karakter per baris. Cocok untuk printer portable saku, Panda, RPP02N, Zjiang.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateConfig({ paperWidth: '80mm' })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      config.paperWidth === '80mm'
                        ? 'border-[#00236f] dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-[#00236f] dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">80mm (Desktop POS)</span>
                      {config.paperWidth === '80mm' && (
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-75 font-normal">
                      48 Karakter per baris. Cocok untuk printer kasir meja besar, Epson TM-T82, Xprinter.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERINTAH BLUETOOTH GLOBAL */}
          {activeTab === 'commands' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                Kirim perintah biner ESC/POS langsung ke printer mini Bluetooth yang terhubung untuk pengujian fungsi hardware.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Command 1: Test Print */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-[#00236f] dark:text-blue-400">receipt_long</span>
                      <h4 className="text-xs font-bold text-[#0b1c30] dark:text-slate-100">Cetak Struk Uji Coba</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Mencetak header toko, tabel format, font bold/regular, dan status koneksi bluetooth.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestPrint}
                    disabled={isPrinting}
                    className="mt-3 w-full py-2 bg-[#00236f] dark:bg-blue-600 hover:bg-[#1a388b] dark:hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    <span>{isPrinting ? 'Mencetak...' : 'Cetak Test Slip'}</span>
                  </button>
                </div>

                {/* Command 2: Cash Drawer Kick */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-amber-600">point_of_sale</span>
                      <h4 className="text-xs font-bold text-[#0b1c30] dark:text-slate-100">Buka Laci Uang (RJ11 Kick)</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Kirim perintah pulsa (ESC p) ke port RJ11 printer mini untuk membuka laci kasir otomatis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleKickDrawer}
                    className="mt-3 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">lock_open</span>
                    <span>Buka Laci Kasir</span>
                  </button>
                </div>

                {/* Command 3: Feed Paper */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-emerald-600">arrow_downward</span>
                      <h4 className="text-xs font-bold text-[#0b1c30] dark:text-slate-100">Feed Kertas (+3 Baris)</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Memajukan kertas thermal 3 baris tanpa mencetak teks agar mudah disobek manual.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleFeed}
                    className="mt-3 w-full py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">unfold_more</span>
                    <span>Feed Kertas</span>
                  </button>
                </div>

                {/* Command 4: Cut Paper */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-purple-600">content_cut</span>
                      <h4 className="text-xs font-bold text-[#0b1c30] dark:text-slate-100">Potong Kertas (Auto-Cut)</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Kirim perintah pemotong kertas otomatis (GS V) pada printer yang memiliki pisau guillotine.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCut}
                    className="mt-3 w-full py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">content_cut</span>
                    <span>Potong Kertas</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RIWAYAT & PRATINJAU STRUK */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Daftar transaksi dan teks struk yang dikirim ke printer mini Bluetooth:
                </p>
                {virtualReceiptLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={clearLogs}
                    className="text-[11px] text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Bersihkan Riwayat
                  </button>
                )}
              </div>

              {virtualReceiptLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">receipt</span>
                  <p className="text-xs">Belum ada struk yang dicetak dalam sesi ini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {virtualReceiptLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950"
                    >
                      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#00236f] dark:text-blue-300">{log.title}</span>
                          <span className="text-[10px] text-slate-400">• {log.timestamp}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                            {log.paperWidth}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {log.rawBytesLength} Biner Bytes
                        </span>
                      </div>
                      <pre className="p-3 text-[11px] font-mono whitespace-pre text-slate-800 dark:text-slate-200 overflow-x-auto max-h-48 leading-relaxed">
                        {log.textPreview}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
            <span>Standar ESC/POS Bluetooth Mini Printer</span>
          </div>

          <button
            type="button"
            onClick={closePrinterModal}
            className="px-5 h-9 bg-slate-800 dark:bg-blue-600 hover:bg-slate-900 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
