import React, { useState, useMemo } from 'react';
import { Product, CategoryType, StoreSettings } from '../types';
import { formatCurrency } from '../utils';
import { BarcodeSheetModal } from './BarcodeSheetModal';

interface InventoryViewProps {
  products: Product[];
  categories: CategoryType[];
  settings: StoreSettings;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenStockAdjust: (product: Product) => void;
}

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc';

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  categories,
  settings,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenStockAdjust,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Items');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [isBarcodeSheetOpen, setIsBarcodeSheetOpen] = useState(false);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search query
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query));

        // Category filter
        const matchesCategory = selectedCategory === 'All Items' || p.category === selectedCategory;

        // Stock status filter
        let matchesStock = true;
        if (stockFilter === 'in_stock') {
          matchesStock = p.stock > p.minStockAlert;
        } else if (stockFilter === 'low_stock') {
          matchesStock = p.stock > 0 && p.stock <= p.minStockAlert;
        } else if (stockFilter === 'out_of_stock') {
          matchesStock = p.stock === 0;
        }

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'stock_asc') return a.stock - b.stock;
        if (sortBy === 'stock_desc') return b.stock - a.stock;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy]);

  // Total summary counts
  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.stock > p.minStockAlert).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="w-full">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] dark:text-slate-100 tracking-tight">Inventory</h1>
          <p className="text-sm sm:text-base text-[#444651] dark:text-slate-400 mt-1">
            Manage your products, stock, and pricing.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsBarcodeSheetOpen(true)}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#00236f] dark:text-blue-300 border border-[#c5c5d3] dark:border-slate-700 font-medium text-sm h-[44px] px-4 rounded-full active:scale-95 transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
            title="Lihat dan Cetak Lembar Barcode Produk"
          >
            <span className="material-symbols-outlined text-[20px]">barcode_scanner</span>
            <span className="hidden sm:inline">Lembar Barcode</span>
          </button>
          <button
            onClick={onAddProduct}
            className="bg-[#00236f] dark:bg-blue-600 hover:bg-[#1e3a8a] dark:hover:bg-blue-700 text-white font-medium text-sm h-[44px] px-6 rounded-full active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add Product
          </button>
        </div>
      </div>

      {/* Quick Summary Pill Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div
          onClick={() => { setStockFilter('all'); setSelectedCategory('All Items'); }}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            stockFilter === 'all' && selectedCategory === 'All Items'
              ? 'bg-[#eff4ff] dark:bg-blue-950/60 border-[#1e3a8a] dark:border-blue-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-[#c5c5d3]/50 dark:border-slate-800 hover:bg-[#f8f9ff] dark:hover:bg-slate-800'
          }`}
        >
          <p className="text-xs font-semibold text-[#757682] dark:text-slate-400 uppercase">Total Catalog</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-[#00236f] dark:text-blue-300">{totalProducts}</span>
            <span className="text-xs text-[#444651] dark:text-slate-400">items</span>
          </div>
        </div>

        <div
          onClick={() => setStockFilter('in_stock')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            stockFilter === 'in_stock'
              ? 'bg-[#e6f4ea] dark:bg-emerald-950/60 border-[#137333] dark:border-emerald-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-[#c5c5d3]/50 dark:border-slate-800 hover:bg-[#f8f9ff] dark:hover:bg-slate-800'
          }`}
        >
          <p className="text-xs font-semibold text-[#137333] dark:text-emerald-400 uppercase">In Stock</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-[#137333] dark:text-emerald-400">{inStockCount}</span>
            <span className="text-xs text-[#137333] dark:text-emerald-400">healthy</span>
          </div>
        </div>

        <div
          onClick={() => setStockFilter('low_stock')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            stockFilter === 'low_stock'
              ? 'bg-[#fef7e0] dark:bg-amber-950/60 border-[#b06000] dark:border-amber-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-[#c5c5d3]/50 dark:border-slate-800 hover:bg-[#f8f9ff] dark:hover:bg-slate-800'
          }`}
        >
          <p className="text-xs font-semibold text-[#b06000] dark:text-amber-400 uppercase">Low Stock</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-[#b06000] dark:text-amber-400">{lowStockCount}</span>
            <span className="text-xs text-[#b06000] dark:text-amber-400">need restock</span>
          </div>
        </div>

        <div
          onClick={() => setStockFilter('out_of_stock')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            stockFilter === 'out_of_stock'
              ? 'bg-[#f1f3f4] dark:bg-slate-800 border-[#5f6368] dark:border-slate-500 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-[#c5c5d3]/50 dark:border-slate-800 hover:bg-[#f8f9ff] dark:hover:bg-slate-800'
          }`}
        >
          <p className="text-xs font-semibold text-[#5f6368] dark:text-slate-400 uppercase">Out of Stock</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-[#ba1a1a] dark:text-rose-400">{outOfStockCount}</span>
            <span className="text-xs text-red-600 dark:text-rose-400">depleted</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#757682] dark:text-slate-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU or product name..."
            className="w-full h-[44px] pl-10 pr-10 bg-white dark:bg-slate-900 border border-[#c5c5d3] dark:border-slate-700 rounded-lg text-sm text-[#0b1c30] dark:text-slate-100 focus:border-[#00236f] dark:focus:border-blue-400 focus:ring-1 focus:ring-[#00236f] outline-none transition-all placeholder:text-[#757682] dark:placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#757682] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-white"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All Items')}
            className={`whitespace-nowrap px-4 h-[44px] rounded-full text-sm font-medium border transition-colors cursor-pointer ${
              selectedCategory === 'All Items'
                ? 'bg-[#00236f] dark:bg-blue-600 text-white border-[#00236f] dark:border-blue-600'
                : 'bg-white dark:bg-slate-900 text-[#444651] dark:text-slate-300 hover:bg-[#d3e4fe] dark:hover:bg-slate-800 border-[#c5c5d3] dark:border-slate-700'
            }`}
          >
            All Items
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 h-[44px] rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#00236f] dark:bg-blue-600 text-white border-[#00236f] dark:border-blue-600'
                  : 'bg-white dark:bg-slate-900 text-[#444651] dark:text-slate-300 hover:bg-[#d3e4fe] dark:hover:bg-slate-800 border-[#c5c5d3] dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}

          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`whitespace-nowrap px-4 h-[44px] rounded-full text-sm font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
              showMoreFilters || stockFilter !== 'all'
                ? 'bg-[#1e3a8a] dark:bg-blue-700 text-white border-[#1e3a8a] dark:border-blue-700'
                : 'bg-white dark:bg-slate-900 text-[#444651] dark:text-slate-300 hover:bg-[#d3e4fe] dark:hover:bg-slate-800 border-[#c5c5d3] dark:border-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            {stockFilter !== 'all' ? `Filter: ${stockFilter.replace('_', ' ')}` : 'More Filters'}
          </button>
        </div>
      </div>

      {/* Expanded Filters Drawer */}
      {showMoreFilters && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-[#c5c5d3]/70 dark:border-slate-800 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150 transition-colors">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-[#0b1c30] dark:text-slate-200 uppercase">Stock Status:</span>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All Status' },
                { id: 'in_stock', label: 'In Stock' },
                { id: 'low_stock', label: 'Low Stock' },
                { id: 'out_of_stock', label: 'Out of Stock' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStockFilter(st.id as StockFilter)}
                  className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-all cursor-pointer ${
                    stockFilter === st.id
                      ? 'bg-[#00236f] dark:bg-blue-600 text-white border-[#00236f] dark:border-blue-600'
                      : 'bg-[#f8f9ff] dark:bg-slate-800 text-[#444651] dark:text-slate-300 border-[#c5c5d3] dark:border-slate-700 hover:bg-[#eff4ff] dark:hover:bg-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#0b1c30] dark:text-slate-200 uppercase">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 px-3 bg-[#f8f9ff] dark:bg-slate-800 border border-[#c5c5d3] dark:border-slate-700 rounded-lg text-xs font-medium text-[#0b1c30] dark:text-slate-200 focus:border-[#00236f] dark:focus:border-blue-400 outline-none"
            >
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="price_asc">Price (Low to High)</option>
              <option value="price_desc">Price (High to Low)</option>
              <option value="stock_asc">Stock (Low to High)</option>
              <option value="stock_desc">Stock (High to Low)</option>
            </select>
          </div>
        </div>
      )}

      {/* Active Filter Notice if non-empty */}
      {(searchQuery || selectedCategory !== 'All Items' || stockFilter !== 'all') && (
        <div className="flex items-center justify-between mb-4 px-1 text-xs text-[#757682] dark:text-slate-400">
          <span>
            Showing <strong className="text-[#0b1c30] dark:text-slate-200">{filteredProducts.length}</strong> of {products.length} products
          </span>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All Items');
              setStockFilter('all');
            }}
            className="text-[#00236f] dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Product Grid (Bento style) */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock === 0;
            const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
            const isInStock = product.stock > product.minStockAlert;

            return (
              <div
                key={product.id}
                className={`bg-white dark:bg-slate-900 border border-[#c5c5d3]/70 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-2 hover:border-[#00236f] dark:hover:border-blue-500 hover:shadow-md transition-all group relative ${
                  isOutOfStock ? 'opacity-80' : ''
                }`}
              >
                {/* Top Status & Hover Actions */}
                <div className="flex justify-between items-start mb-1">
                  {isInStock && (
                    <span className="bg-[#e6f4ea] dark:bg-emerald-950/80 text-[#137333] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase">
                      In Stock
                    </span>
                  )}
                  {isLowStock && (
                    <span className="bg-[#fef7e0] dark:bg-amber-950/80 text-[#b06000] dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase animate-pulse">
                      Low Stock
                    </span>
                  )}
                  {isOutOfStock && (
                    <span className="bg-[#f1f3f4] dark:bg-slate-800 text-[#5f6368] dark:text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase">
                      Out of Stock
                    </span>
                  )}

                  {/* Actions (visible on hover and always accessible on mobile) */}
                  <div className="flex gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onOpenStockAdjust(product)}
                      title="Adjust Stock"
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#eff4ff] dark:hover:bg-slate-800 text-[#00236f] dark:text-blue-300 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">swap_vert</span>
                    </button>
                    <button
                      onClick={() => onEditProduct(product)}
                      title="Edit Product"
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#d3e4fe] dark:hover:bg-slate-800 text-[#444651] dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${product.name}" from inventory?`)) {
                          onDeleteProduct(product.id);
                        }
                      }}
                      title="Delete Product"
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#ffdad6] dark:hover:bg-rose-950/60 text-[#ba1a1a] dark:text-rose-400 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Product Visual Box */}
                <div
                  className={`h-36 sm:h-32 w-full bg-[#dbeafe]/70 dark:bg-slate-800/80 rounded-xl mb-1 relative overflow-hidden flex items-center justify-center border border-[#c5c5d3]/30 dark:border-slate-700/50 transition-transform ${
                    isOutOfStock ? 'grayscale opacity-60' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-[#1e3a8a] dark:text-blue-300 text-4xl opacity-80 group-hover:scale-110 transition-transform duration-200">
                    {product.icon || 'inventory_2'}
                  </span>
                </div>

                {/* Product Details */}
                <div className="space-y-0.5">
                  <h3
                    className={`font-bold text-base sm:text-lg text-[#0b1c30] dark:text-slate-100 line-clamp-1 group-hover:text-[#00236f] dark:group-hover:text-blue-300 transition-colors ${
                      isOutOfStock ? 'text-[#444651] dark:text-slate-500' : ''
                    }`}
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                  <p className="text-xs text-[#757682] dark:text-slate-400 font-mono tracking-tight">
                    SKU: {product.sku}
                  </p>
                </div>

                {/* Price & Unit Count */}
                <div className="flex justify-between items-baseline mt-auto pt-3 border-t border-[#c5c5d3]/40 dark:border-slate-800">
                  <span className="text-xl font-bold text-[#00236f] dark:text-blue-300 tracking-tight leading-none">
                    {formatCurrency(product.price, settings.currencySymbol)}
                  </span>
                  <span
                    className={`text-sm ${
                      isLowStock
                        ? 'text-[#ba1a1a] dark:text-amber-400 font-bold'
                        : isOutOfStock
                        ? 'text-[#757682] dark:text-slate-500 font-medium'
                        : 'text-[#444651] dark:text-slate-400 font-medium'
                    }`}
                  >
                    {product.stock} units
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-[#c5c5d3] dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 mt-4 transition-colors">
          <div className="w-20 h-20 rounded-full bg-[#f8f9ff] dark:bg-slate-800 flex items-center justify-center mb-4 text-[#757682]/60 dark:text-slate-500">
            <span className="material-symbols-outlined text-5xl">inventory_2</span>
          </div>
          <h2 className="text-lg font-bold text-[#0b1c30] dark:text-slate-100 mb-1">No products found</h2>
          <p className="text-sm text-[#444651] dark:text-slate-400 mb-6 max-w-sm">
            {searchQuery || selectedCategory !== 'All Items' || stockFilter !== 'all'
              ? 'No stationery items match your current filters. Try resetting the search or filters.'
              : 'Your inventory is currently empty. Add products to start managing stock and selling in the POS.'}
          </p>
          {searchQuery || selectedCategory !== 'All Items' || stockFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Items');
                setStockFilter('all');
              }}
              className="bg-[#eff4ff] dark:bg-slate-800 text-[#00236f] dark:text-blue-300 font-semibold text-sm h-[44px] px-6 rounded-full hover:bg-[#d3e4fe] dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={onAddProduct}
              className="bg-[#00236f] dark:bg-blue-600 text-white font-semibold text-sm h-[44px] px-6 rounded-full hover:bg-[#1e3a8a] dark:hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add First Product
            </button>
          )}
        </div>
      )}

      {/* Printable Barcode Sheet Modal */}
      <BarcodeSheetModal
        isOpen={isBarcodeSheetOpen}
        onClose={() => setIsBarcodeSheetOpen(false)}
        products={products}
        categories={categories}
        settings={settings}
      />
    </div>
  );
};
