import React, { useState } from 'react';
import { Product } from '../types';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onUpdateStock: (productId: string, newStock: number, reason: string) => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  product,
  onUpdateStock,
}) => {
  const [mode, setMode] = useState<'add' | 'remove' | 'set'>('add');
  const [amount, setAmount] = useState<number | ''>(10);
  const [reason, setReason] = useState('Supplier Restock');

  if (!isOpen || !product) return null;

  const currentStock = product.stock;
  let previewStock = currentStock;
  const numAmount = Number(amount) || 0;

  if (mode === 'add') {
    previewStock = currentStock + numAmount;
  } else if (mode === 'remove') {
    previewStock = Math.max(0, currentStock - numAmount);
  } else {
    previewStock = Math.max(0, numAmount);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStock(product.id, previewStock, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#c5c5d3]/50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-[#e5eeff] bg-[#f8f9ff] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#d3e4fe] flex items-center justify-center text-[#00236f]">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#00236f]">Stock Adjustment</h3>
              <p className="text-xs text-[#757682] truncate max-w-[200px]">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#757682] hover:bg-[#e5eeff]"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 bg-[#eff4ff] rounded-xl border border-[#d3e4fe]">
            <div>
              <p className="text-xs font-semibold text-[#757682]">Current On Hand</p>
              <p className="text-2xl font-bold text-[#00236f]">{currentStock} units</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-[#757682]">After Adjustment</p>
              <p className="text-2xl font-bold text-emerald-700">{previewStock} units</p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setMode('add'); setReason('Supplier Restock'); }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                mode === 'add' ? 'bg-[#00236f] text-white shadow-xs' : 'bg-[#f8f9ff] text-[#444651] border border-[#c5c5d3]'
              }`}
            >
              + Add Units
            </button>
            <button
              type="button"
              onClick={() => { setMode('remove'); setReason('Damaged / Write-off'); }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                mode === 'remove' ? 'bg-[#00236f] text-white shadow-xs' : 'bg-[#f8f9ff] text-[#444651] border border-[#c5c5d3]'
              }`}
            >
              - Deduct
            </button>
            <button
              type="button"
              onClick={() => { setMode('set'); setReason('Physical Stock Audit'); setAmount(currentStock); }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                mode === 'set' ? 'bg-[#00236f] text-white shadow-xs' : 'bg-[#f8f9ff] text-[#444651] border border-[#c5c5d3]'
              }`}
            >
              = Set Exact
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
              {mode === 'set' ? 'Exact Unit Count' : 'Quantity'}
            </label>
            <input
              type="number"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
              className="w-full h-11 px-3.5 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-lg font-bold text-[#00236f] focus:border-[#00236f] outline-none"
            />
            {/* Quick quick chips */}
            {mode !== 'set' && (
              <div className="flex gap-2 mt-2">
                {[5, 10, 25, 50, 100].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAmount(quick)}
                    className="text-xs px-2.5 py-1 bg-[#f8f9ff] hover:bg-[#d3e4fe] border border-[#c5c5d3]/70 rounded-md font-semibold text-[#00236f]"
                  >
                    +{quick}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
              Adjustment Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-xs text-[#0b1c30] focus:border-[#00236f] outline-none"
            >
              <option value="Supplier Restock">Supplier Restock / Delivery</option>
              <option value="Physical Stock Audit">Physical Inventory Audit / Reconciliation</option>
              <option value="Damaged / Write-off">Damaged Goods / Store Display Sample</option>
              <option value="Customer Return">Customer Return / Exchange</option>
              <option value="Other">Other Adjustment</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e5eeff]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-full text-xs font-semibold text-[#444651] hover:bg-[#eff4ff]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 h-10 bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold rounded-full shadow-sm"
            >
              Apply Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
