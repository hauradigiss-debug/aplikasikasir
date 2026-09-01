import React, { useState } from 'react';
import { Product, CategoryType, StoreSettings } from '../types';
import { formatCurrency } from '../utils';

interface CategoryViewProps {
  categories: CategoryType[];
  products: Product[];
  settings: StoreSettings;
  onAddCategory: (categoryName: CategoryType) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  categories,
  products,
  settings,
  onAddCategory,
}) => {
  const [newCatName, setNewCatName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim() as CategoryType);
    setNewCatName('');
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">Category Setup</h1>
          <p className="text-sm text-[#444651] mt-1">
            Organize stationery aisles, department tags, and product groupings
          </p>
        </div>
      </div>

      {/* Add Category Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#c5c5d3]/60 shadow-xs">
        <h3 className="text-sm font-bold text-[#00236f] uppercase mb-2">Create New Category</h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="e.g. Calligraphy & Inks, Adhesives, Planners..."
            className="flex-1 h-11 px-4 bg-[#f8f9ff] border border-[#c5c5d3] rounded-lg text-sm text-[#0b1c30] focus:border-[#00236f] outline-none"
          />
          <button
            type="submit"
            className="px-6 h-11 bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold rounded-full shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Category
          </button>
        </form>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const catProducts = products.filter((p) => p.category === cat);
          const totalStock = catProducts.reduce((sum, p) => sum + p.stock, 0);
          const totalValue = catProducts.reduce((sum, p) => sum + p.price * p.stock, 0);

          return (
            <div
              key={cat}
              className="bg-white p-5 rounded-2xl border border-[#c5c5d3]/60 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#00236f] flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">category</span>
                  </div>
                  <span className="text-xs font-bold bg-[#f8f9ff] text-[#00236f] px-2.5 py-1 rounded-full border border-[#d3e4fe]">
                    {catProducts.length} items
                  </span>
                </div>
                <h3 className="font-bold text-base text-[#0b1c30]">{cat}</h3>
                <p className="text-xs text-[#757682] mt-1">
                  Total in stock: <strong className="text-[#0b1c30]">{totalStock} units</strong>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f1f3f4] flex justify-between items-center text-xs">
                <span className="text-[#757682]">Stock Valuation</span>
                <span className="font-bold text-[#00236f]">
                  {formatCurrency(totalValue, settings.currencySymbol)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
