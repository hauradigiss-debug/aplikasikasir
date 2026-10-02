import React, { useState } from 'react';
import { Product, CategoryType, StoreSettings } from '../types';
import { formatCurrency } from '../utils';
import { BarcodeRenderer } from './BarcodeRenderer';

interface BarcodeSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: CategoryType[];
  settings: StoreSettings;
}

export const BarcodeSheetModal: React.FC<BarcodeSheetModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  settings,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = products.filter((p) => {
    const matchCat = selectedCat === 'All' || p.category === selectedCat;
    const matchSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00236f] dark:bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-lg">print</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#0b1c30] dark:text-slate-100">
                Lembar Cetak Barcode & Label Produk
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cetak label barcode untuk ditempel pada produk fisik atau scan langsung dari layar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 h-8 bg-[#00236f] dark:bg-blue-600 hover:bg-[#1a388b] dark:hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Cetak Barcode</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 transition-colors">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama atau SKU..."
              className="w-full max-w-xs h-8 pl-3 pr-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg outline-none focus:border-[#00236f] dark:focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setSelectedCat('All')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                selectedCat === 'All'
                  ? 'bg-[#00236f] dark:bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Semua ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                  selectedCat === cat
                    ? 'bg-[#00236f] dark:bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Barcode Grid Printable Content */}
        <div id="printable-barcode-sheet" className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 transition-colors">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map((prod) => (
              <div
                key={prod.id}
                className="bg-white border border-slate-300 rounded-xl p-3 flex flex-col items-center justify-between text-center shadow-xs page-break-inside-avoid"
              >
                <div className="w-full">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {settings.storeName}
                  </p>
                  <p className="text-xs font-bold text-[#0b1c30] line-clamp-2 mt-0.5 min-h-[32px]">
                    {prod.name}
                  </p>
                </div>

                <div className="my-2 max-w-full overflow-hidden flex items-center justify-center">
                  <BarcodeRenderer
                    value={prod.sku}
                    height={36}
                    width={1.2}
                    fontSize={10}
                    className="border-none shadow-none p-0"
                  />
                </div>

                <div className="w-full pt-1.5 border-t border-dashed border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">{prod.sku}</span>
                  <span className="text-xs font-bold text-[#00236f]">
                    {formatCurrency(prod.price, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-1">barcode_scanner</span>
              <p className="text-xs">Tidak ada produk yang sesuai dengan filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
