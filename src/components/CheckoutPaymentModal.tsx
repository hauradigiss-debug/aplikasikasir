import React, { useState, useEffect, useMemo } from 'react';
import { CartItem, Order, StoreSettings, PaymentMethod, User, Member } from '../types';
import { formatCurrency, generateReceiptNumber, playSound } from '../utils';
import { QrisDisplayCard } from './QrisDisplayCard';
import { usePrinter } from '../context/PrinterContext';

interface CheckoutPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  grandTotal: number;
  customerName: string;
  selectedMember: Member | null;
  currentUser?: User | null;
  settings: StoreSettings;
  onCompleteSale: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
}

export const CheckoutPaymentModal: React.FC<CheckoutPaymentModalProps> = ({
  isOpen,
  onClose,
  cart,
  subtotal,
  discountAmount,
  discountPercent,
  taxAmount,
  grandTotal,
  customerName,
  selectedMember,
  currentUser,
  settings,
  onCompleteSale,
  onOpenReceipt,
}) => {
  const [activeMethod, setActiveMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<number | ''>('');
  
  // Card states
  const [selectedBank, setSelectedBank] = useState<string>('BCA');
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
  const [approvalCode, setApprovalCode] = useState<string>('');
  const [last4Digits, setLast4Digits] = useState<string>('');

  const [receiptNumber] = useState(() => generateReceiptNumber());

  // Bluetooth Printer hook
  const { printReceipt, openCashDrawer, config, isConnected } = usePrinter();

  // Reset or preset cash amount when modal opens or total changes
  useEffect(() => {
    if (isOpen) {
      setCashTendered(grandTotal);
      setApprovalCode(Math.floor(100000 + Math.random() * 900000).toString());
      setLast4Digits(Math.floor(1000 + Math.random() * 9000).toString());
    }
  }, [isOpen, grandTotal]);

  const numericTendered = typeof cashTendered === 'number' ? cashTendered : 0;
  const changeDue = Math.max(0, numericTendered - grandTotal);
  const isCashSufficient = numericTendered >= grandTotal;

  // Currency quick denominations helper
  const isRupiah = settings.currencySymbol.toLowerCase().includes('rp');

  const quickDenominations = useMemo(() => {
    if (isRupiah) {
      return [10000, 20000, 50000, 100000, 200000, 500000].filter((note) => {
        return note >= grandTotal || note === 50000 || note === 100000;
      });
    } else {
      return [5, 10, 20, 50, 100].filter((note) => note >= grandTotal || note === 20 || note === 50);
    }
  }, [isRupiah, grandTotal]);

  const quickAddIncrements = useMemo(() => {
    if (isRupiah) {
      return [2000, 5000, 10000, 20000, 50000, 100000];
    } else {
      return [1, 2, 5, 10, 20];
    }
  }, [isRupiah]);

  if (!isOpen) return null;

  // Finalize Order
  const handleFinalize = (
    method: PaymentMethod,
    customDetails?: {
      card?: { bank: string; approvalCode: string; cardType: 'debit' | 'credit'; last4Digits?: string };
      qris?: { nmid: string; terminalId: string; referenceNumber: string; issuer?: string };
    }
  ) => {
    const tendered = method === 'cash' ? numericTendered || grandTotal : grandTotal;
    const change = method === 'cash' ? Math.max(0, tendered - grandTotal) : 0;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      receiptNumber,
      items: [...cart],
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      paymentMethod: method,
      amountPaid: tendered,
      change,
      cashierName: currentUser?.fullName || 'Haura',
      customerName: customerName.trim() || 'Walk-in Customer',
      timestamp: new Date().toISOString(),
      status: 'completed',
      cardDetails: customDetails?.card,
      qrisDetails: customDetails?.qris,
    };

    onCompleteSale(newOrder);

    // Auto-detect & print via Mini Printer Bluetooth if enabled
    if (config.autoPrintOnCheckout) {
      printReceipt(newOrder, settings).catch((err) => {
        console.warn('Auto print receipt failed:', err);
      });
    }

    onClose();
    onOpenReceipt(newOrder);
  };

  // Cash Submit
  const handleConfirmCash = () => {
    if (!isCashSufficient) {
      if (settings.enableSound) playSound('error');
      return;
    }
    handleFinalize('cash');
  };

  // Card Submit
  const handleConfirmCard = () => {
    handleFinalize('card', {
      card: {
        bank: selectedBank,
        approvalCode: approvalCode || 'AUTH-' + Math.floor(100000 + Math.random() * 900000),
        cardType,
        last4Digits: last4Digits || '8888',
      },
    });
  };

  // QRIS Payment Success Handler
  const handleQrisPaymentSuccess = (qrisData: {
    nmid: string;
    terminalId: string;
    referenceNumber: string;
    issuer: string;
  }) => {
    handleFinalize('qris', {
      qris: {
        nmid: qrisData.nmid,
        terminalId: qrisData.terminalId,
        referenceNumber: qrisData.referenceNumber,
        issuer: qrisData.issuer,
      },
    });
  };

  return (
    <div
      id="checkout-payment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs select-none overflow-y-auto"
    >
      <div
        id="checkout-payment-modal-card"
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors my-auto"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-[#f8f9ff] dark:bg-slate-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00236f] dark:bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Penyelesaian Pembayaran</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-bold">
                  {receiptNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih metode pembayaran tunai, kartu EDC, atau QRIS real-time
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Real-time Grand Total Due Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/60 dark:from-slate-850 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[11px] font-bold text-blue-900 dark:text-blue-400 uppercase tracking-wider block">
                Total Tagihan (Real-Time)
              </span>
              <div className="text-3xl font-black text-[#00236f] dark:text-blue-300 tracking-tight">
                {formatCurrency(grandTotal, settings.currencySymbol)}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>Subtotal: {formatCurrency(subtotal, settings.currencySymbol)}</span>
                {discountAmount > 0 && (
                  <span className="text-emerald-600 font-semibold">
                    • Diskon: -{formatCurrency(discountAmount, settings.currencySymbol)} ({discountPercent}%)
                  </span>
                )}
                {taxAmount > 0 && (
                  <span>• Pajak: {formatCurrency(taxAmount, settings.currencySymbol)}</span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right text-xs border-t sm:border-t-0 pt-2 sm:pt-0 border-blue-200/60 dark:border-slate-800 w-full sm:w-auto">
              <p className="text-slate-500 dark:text-slate-400">
                {cart.reduce((s, i) => s + i.quantity, 0)} barang pesanan
              </p>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {selectedMember ? (
                  <span className="text-emerald-700 dark:text-emerald-400">
                    VIP Member: {selectedMember.fullName}
                  </span>
                ) : (
                  customerName || 'Pelanggan Umum'
                )}
              </p>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Cash Tab */}
              <button
                type="button"
                onClick={() => setActiveMethod('cash')}
                className={`p-3 sm:p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeMethod === 'cash'
                    ? 'border-[#00236f] dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-[#00236f] dark:text-blue-300 font-bold shadow-xs ring-1 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">payments</span>
                <span className="text-xs font-bold">1. Tunai (Cash)</span>
                <span className="text-[10px] opacity-75 font-normal">Pecahan & Kembalian</span>
              </button>

              {/* Card / EDC Tab */}
              <button
                type="button"
                onClick={() => setActiveMethod('card')}
                className={`p-3 sm:p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeMethod === 'card'
                    ? 'border-[#00236f] dark:border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 text-[#00236f] dark:text-blue-300 font-bold shadow-xs ring-1 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">credit_card</span>
                <span className="text-xs font-bold">2. Card / EDC</span>
                <span className="text-[10px] opacity-75 font-normal">Debit & Kredit</span>
              </button>

              {/* QRIS Tab */}
              <button
                type="button"
                onClick={() => setActiveMethod('qris')}
                className={`p-3 sm:p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                  activeMethod === 'qris'
                    ? 'border-[#cb1c1d] bg-red-50/80 dark:bg-red-950/40 text-[#cb1c1d] dark:text-red-300 font-bold shadow-xs ring-1 ring-red-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="absolute -top-2 -right-1 bg-[#cb1c1d] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shadow-2xs">
                  Resmi
                </span>
                <span className="material-symbols-outlined text-2xl">qr_code_2</span>
                <span className="text-xs font-bold">3. QRIS Dinamis</span>
                <span className="text-[10px] opacity-75 font-normal">Real-time GPN</span>
              </button>
            </div>
          </div>

          {/* TAB 1: TUNAI (CASH) */}
          {activeMethod === 'cash' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Cash Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Uang Diterima dari Pelanggan
                  </label>
                  <button
                    type="button"
                    onClick={() => setCashTendered(grandTotal)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Uang Pas ({formatCurrency(grandTotal, settings.currencySymbol)})
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={cashTendered}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCashTendered(val === '' ? '' : Number(val));
                    }}
                    placeholder="0"
                    className="w-full h-13 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-2xl font-black text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                  Pilihan Nominal Pecahan Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashTendered(grandTotal)}
                    className="px-3 py-1.5 bg-blue-100 dark:bg-blue-950/80 hover:bg-blue-200 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  {quickDenominations.map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => setCashTendered(note)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        numericTendered === note
                          ? 'bg-[#00236f] text-white border-[#00236f]'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {formatCurrency(note, settings.currencySymbol)}
                    </button>
                  ))}
                </div>

                {/* Quick Add Increments */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Tambah:</span>
                  {quickAddIncrements.map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setCashTendered((prev) => (Number(prev) || 0) + inc)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      +{formatCurrency(inc, settings.currencySymbol)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Change Due Real-Time Display */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                  isCashSufficient
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    {isCashSufficient ? 'Uang Kembalian (Change Due)' : 'Uang Pembayaran Masih Kurang'}
                  </span>
                  <span className="text-xs opacity-75">
                    {isCashSufficient
                      ? 'Harap kembalikan sisa uang kepada pelanggan'
                      : `Kurang ${formatCurrency(grandTotal - numericTendered, settings.currencySymbol)}`}
                  </span>
                </div>
                <div className="text-2xl font-black">
                  {isCashSufficient
                    ? formatCurrency(changeDue, settings.currencySymbol)
                    : `-${formatCurrency(grandTotal - numericTendered, settings.currencySymbol)}`}
                </div>
              </div>

              {/* Cash Drawer Kick Action (if printer connected) */}
              <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">savings</span>
                  <span>Laci kasir otomatis terbuka saat cetak</span>
                </div>
                {openCashDrawer && (
                  <button
                    type="button"
                    onClick={() => {
                      openCashDrawer();
                      if (settings.enableSound) playSound('beep');
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Buka Laci Sekarang
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CARD / EDC */}
          {activeMethod === 'card' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Bank Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                  Pilih Bank / Terminal EDC
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB Niaga', 'Visa', 'Mastercard', 'Lainnya'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedBank === bank
                          ? 'bg-[#00236f] dark:bg-blue-600 text-white border-[#00236f]'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Jenis Kartu
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="cardType"
                      checked={cardType === 'debit'}
                      onChange={() => setCardType('debit')}
                      className="text-blue-600"
                    />
                    <span>Kartu Debit</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="cardType"
                      checked={cardType === 'credit'}
                      onChange={() => setCardType('credit')}
                      className="text-blue-600"
                    />
                    <span>Kartu Kredit</span>
                  </label>
                </div>
              </div>

              {/* Approval Code & Last 4 Digits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      No. Referensi / Approval Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setApprovalCode(Math.floor(100000 + Math.random() * 900000).toString())}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Acak
                    </button>
                  </div>
                  <input
                    type="text"
                    value={approvalCode}
                    onChange={(e) => setApprovalCode(e.target.value)}
                    placeholder="Contoh: 782910"
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    4 Digit Terakhir Kartu (Opsional)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={last4Digits}
                    onChange={(e) => setLast4Digits(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Contoh: 4242"
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* EDC Terminal Ready Banner */}
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-blue-700 dark:text-blue-400">
                  contactless
                </span>
                <div>
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    Terminal EDC Siap & Terhubung
                  </p>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                    Silakan masukkan chip kartu (Dip), gesek pita magnetik, atau tap kartu nirkabel pelanggan pada EDC {selectedBank}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QRIS REAL-TIME (SEPERTI DI FOTO) */}
          {activeMethod === 'qris' && (
            <div className="flex flex-col items-center justify-center animate-in fade-in duration-150">
              <QrisDisplayCard
                amount={grandTotal}
                settings={settings}
                invoiceNumber={receiptNumber}
                customerName={customerName}
                onPaymentSuccess={handleQrisPaymentSuccess}
                onPrintQrisSlip={() => {
                  printReceipt(
                    {
                      id: `ord-qris-${Date.now()}`,
                      receiptNumber,
                      items: cart,
                      subtotal,
                      discount: discountAmount,
                      tax: taxAmount,
                      total: grandTotal,
                      paymentMethod: 'qris',
                      amountPaid: grandTotal,
                      change: 0,
                      cashierName: currentUser?.fullName || 'Staff POS',
                      customerName,
                      timestamp: new Date().toISOString(),
                      status: 'completed',
                      qrisDetails: {
                        nmid: settings.qrisNmid || 'ID1020038291039',
                        terminalId: settings.qrisTerminalId || 'A01',
                        referenceNumber: 'RRN' + Date.now().toString().slice(-8),
                        issuer: 'QRIS Real-Time',
                      },
                    },
                    settings
                  ).catch((err) => {
                    console.warn('Print slip failed or printer not connected:', err);
                  });
                }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-[#f8f9ff] dark:bg-slate-850 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 h-11 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            Kembali ke Keranjang
          </button>

          {activeMethod === 'cash' && (
            <button
              type="button"
              disabled={!isCashSufficient}
              onClick={handleConfirmCash}
              className="px-6 h-12 bg-[#00236f] dark:bg-blue-600 hover:bg-[#1a388b] dark:hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-full shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>Konfirmasi Tunai & Cetak Struk</span>
            </button>
          )}

          {activeMethod === 'card' && (
            <button
              type="button"
              onClick={handleConfirmCard}
              className="px-6 h-12 bg-[#00236f] dark:bg-blue-600 hover:bg-[#1a388b] dark:hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <span className="material-symbols-outlined text-lg">credit_card</span>
              <span>Otorisasi Kartu ({selectedBank}) & Cetak Struk</span>
            </button>
          )}

          {activeMethod === 'qris' && (
            <button
              type="button"
              onClick={() => {
                handleQrisPaymentSuccess({
                  nmid: settings.qrisNmid || 'ID1020038291039',
                  terminalId: settings.qrisTerminalId || 'A01',
                  referenceNumber: 'RRN' + Math.floor(100000000000 + Math.random() * 900000000000),
                  issuer: 'QRIS Digital Pay',
                });
              }}
              className="px-6 h-12 bg-[#cb1c1d] hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-98"
            >
              <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
              <span>Konfirmasi QRIS Selesai</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
