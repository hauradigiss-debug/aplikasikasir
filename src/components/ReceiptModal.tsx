import React, { useState } from 'react';
import { Order, StoreSettings } from '../types';
import { formatCurrency } from '../utils';
import { usePrinter } from '../context/PrinterContext';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  settings: StoreSettings;
  onRefund?: (orderId: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  settings,
  onRefund,
}) => {
  const { printReceipt, isConnected, status: printerStatus, openPrinterModal } = usePrinter();
  const [btStatusMsg, setBtStatusMsg] = useState<string | null>(null);
  const [isSendingBt, setIsSendingBt] = useState(false);

  if (!isOpen || !order) return null;

  const handleBtPrint = async () => {
    setIsSendingBt(true);
    setBtStatusMsg(null);
    try {
      const ok = await printReceipt(order, settings);
      if (ok) {
        setBtStatusMsg('Struk tercetak ke Mini Printer BT!');
        setTimeout(() => setBtStatusMsg(null), 3000);
      } else {
        setBtStatusMsg('Gagal mengirim ke printer.');
      }
    } catch (err: any) {
      setBtStatusMsg(err?.message || 'Gagal cetak');
    } finally {
      setIsSendingBt(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-[#c5c5d3]/50 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5eeff] dark:border-slate-800 bg-[#f8f9ff] dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#00236f] dark:text-blue-400 text-xl">receipt_long</span>
            <div>
              <h3 className="font-bold text-sm text-[#00236f] dark:text-blue-300">Receipt Preview</h3>
              <p className="text-[11px] text-[#757682] dark:text-slate-400">{order.receiptNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#757682] dark:text-slate-400 hover:bg-[#e5eeff] dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Printable Thermal Receipt Card container */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#f1f3f4] dark:bg-slate-950">
          <div
            id="printable-receipt"
            className="bg-white p-6 rounded-lg shadow-sm border border-dashed border-[#c5c5d3] font-mono text-xs text-[#0b1c30] max-w-sm mx-auto"
          >
            {/* Store details */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-[#c5c5d3]">
              <div className="flex items-center justify-center gap-1.5 text-[#00236f]">
                <span className="material-symbols-outlined text-lg">edit_note</span>
                <span className="font-bold text-sm uppercase tracking-wider">{settings.storeName}</span>
              </div>
              <p className="text-[11px] text-[#757682]">{settings.tagline}</p>
              <p className="text-[11px] text-[#444651]">{settings.address}</p>
              <p className="text-[11px] text-[#444651]">Tel: {settings.phone}</p>
            </div>

            {/* Transaction metadata */}
            <div className="py-3 border-b border-dashed border-[#c5c5d3] text-[11px] space-y-1 text-[#444651]">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold text-[#0b1c30]">{order.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{order.cashierName}</span>
              </div>
              {order.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-medium">{order.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="uppercase font-bold text-[#00236f]">{order.paymentMethod}</span>
              </div>
              {order.status === 'refunded' && (
                <div className="p-1 bg-red-100 text-red-700 text-center font-bold uppercase rounded mt-1">
                  *** REFUNDED TRANSACTION ***
                </div>
              )}
            </div>

            {/* Line items */}
            <div className="py-3 border-b border-dashed border-[#c5c5d3]">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-[#e5eeff] text-[#757682]">
                    <th className="pb-1 font-semibold">ITEM</th>
                    <th className="pb-1 text-center font-semibold">QTY</th>
                    <th className="pb-1 text-right font-semibold">PRICE</th>
                    <th className="pb-1 text-right font-semibold">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-[#e5eeff]">
                  {order.items.map((it, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1.5 pr-1">
                        <div className="font-medium line-clamp-1">{it.product.name}</div>
                        <div className="text-[9px] text-[#757682]">{it.product.sku}</div>
                      </td>
                      <td className="py-1.5 text-center">{it.quantity}</td>
                      <td className="py-1.5 text-right">{formatCurrency(it.product.price, settings.currencySymbol)}</td>
                      <td className="py-1.5 text-right font-semibold">
                        {formatCurrency(it.product.price * it.quantity, settings.currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-3 space-y-1 text-xs">
              <div className="flex justify-between text-[#444651]">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal, settings.currencySymbol)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount, settings.currencySymbol)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#444651]">
                <span>Tax ({Math.round(settings.taxRate * 100)}%)</span>
                <span>{formatCurrency(order.tax, settings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#00236f] pt-2 border-t border-[#0b1c30]">
                <span>TOTAL</span>
                <span>{formatCurrency(order.total, settings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#444651] pt-1">
                <span>Amount Paid</span>
                <span>{formatCurrency(order.amountPaid, settings.currencySymbol)}</span>
              </div>
              {order.paymentMethod === 'cash' && (
                <div className="flex justify-between text-[11px] text-[#444651]">
                  <span>Change Due</span>
                  <span className="font-bold">{formatCurrency(order.change, settings.currencySymbol)}</span>
                </div>
              )}
            </div>

            {/* Barcode & Footer */}
            <div className="pt-4 border-t border-dashed border-[#c5c5d3] text-center space-y-2">
              <div className="inline-block px-4 py-1.5 bg-gray-100 rounded tracking-widest text-[10px] font-mono font-bold">
                |||| | ||| ||||| || |||||| || |
              </div>
              <p className="text-[10px] text-[#757682]">{settings.receiptFooter}</p>
              <p className="text-[9px] text-[#a0a0aa]">*** Customer Copy ***</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-[#e5eeff] dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 transition-colors">
          <div className="flex items-center gap-2">
            {onRefund && order.status === 'completed' && (
              <button
                onClick={() => onRefund(order.id)}
                className="px-3.5 h-10 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 text-xs font-semibold rounded-full flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">undo</span>
                Refund
              </button>
            )}
            {btStatusMsg && (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                {btStatusMsg}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {/* Direct Bluetooth Mini Printer Action */}
            <button
              type="button"
              onClick={isConnected ? handleBtPrint : openPrinterModal}
              disabled={isSendingBt}
              className={`px-4 h-10 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isConnected
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#00236f] dark:text-blue-300 border border-slate-300 dark:border-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {isConnected ? 'bluetooth_connected' : 'bluetooth'}
              </span>
              <span>
                {isSendingBt
                  ? 'Mengirim...'
                  : isConnected
                  ? 'Cetak Mini Printer BT'
                  : 'Hubungkan Printer BT'}
              </span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 h-10 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Cetak via dialog browser standar / PDF"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Browser Print</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 h-10 text-xs font-semibold text-[#444651] dark:text-slate-300 hover:bg-[#eff4ff] dark:hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
